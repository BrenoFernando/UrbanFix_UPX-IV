const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db');
const { autenticar, apenas } = require('../middleware/auth');
const router = express.Router();

const pasta = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(pasta, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, pasta),
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

// Listar (público), com filtros opcionais: ?municipio_id=1&status=aberta&categoria_id=2
router.get('/', async (req, res) => {
  const { municipio_id, status, categoria_id } = req.query;
  const r = await pool.query(
    `SELECT o.id, o.titulo, o.descricao, o.endereco, o.latitude, o.longitude, o.status,
            o.prioridade, o.criado_em, o.municipio_id, c.nome AS categoria,
            (SELECT url FROM ocorrencia_foto f WHERE f.ocorrencia_id = o.id ORDER BY f.id LIMIT 1) AS foto
     FROM ocorrencia o
     JOIN categoria c ON c.id = o.categoria_id
     WHERE ($1::int IS NULL OR o.municipio_id = $1)
       AND ($2::text IS NULL OR o.status = $2)
       AND ($3::int IS NULL OR o.categoria_id = $3)
     ORDER BY o.criado_em DESC`,
    [municipio_id || null, status || null, categoria_id || null]
  );
  res.json(r.rows);
});

// Ocorrências do morador logado (precisa vir antes da rota /:id)
router.get('/minhas', autenticar, apenas('morador'), async (req, res) => {
  const r = await pool.query(
    `SELECT o.id, o.titulo, o.endereco, o.status, o.criado_em, c.nome AS categoria
     FROM ocorrencia o JOIN categoria c ON c.id = o.categoria_id
     WHERE o.morador_id = $1 ORDER BY o.criado_em DESC`,
    [req.usuario.id]
  );
  res.json(r.rows);
});

// Detalhes de uma ocorrência, com fotos e histórico
router.get('/:id', async (req, res) => {
  const o = await pool.query(
    `SELECT o.*, c.nome AS categoria, m.nome AS morador
     FROM ocorrencia o
     JOIN categoria c ON c.id = o.categoria_id
     JOIN morador m ON m.id = o.morador_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!o.rows[0]) return res.status(404).json({ erro: 'Ocorrência não encontrada' });
  const fotos = await pool.query('SELECT url FROM ocorrencia_foto WHERE ocorrencia_id = $1 ORDER BY id', [req.params.id]);
  const hist = await pool.query(
    'SELECT status_anterior, status_novo, comentario, criado_em FROM historico_status WHERE ocorrencia_id = $1 ORDER BY id',
    [req.params.id]
  );
  res.json({ ...o.rows[0], fotos: fotos.rows.map((f) => f.url), historico: hist.rows });
});

// Registrar ocorrência (morador)
router.post('/', autenticar, apenas('morador'), upload.array('fotos', 4), async (req, res) => {
  const { titulo, descricao, endereco, latitude, longitude, categoria_id, municipio_id } = req.body;
  if (!titulo || !endereco || !latitude || !longitude || !categoria_id || !municipio_id) {
    return res.status(400).json({ erro: 'Preencha título, endereço, local no mapa, categoria e município' });
  }
  const nova = await pool.query(
    `INSERT INTO ocorrencia (morador_id, municipio_id, categoria_id, titulo, descricao, endereco, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [req.usuario.id, municipio_id, categoria_id, titulo.trim(), descricao || null, endereco.trim(), latitude, longitude]
  );
  const id = nova.rows[0].id;
  for (const arq of req.files || []) {
    await pool.query('INSERT INTO ocorrencia_foto (ocorrencia_id, url) VALUES ($1, $2)', [id, '/uploads/' + arq.filename]);
  }
  await pool.query(
    `INSERT INTO historico_status (ocorrencia_id, status_anterior, status_novo) VALUES ($1, NULL, 'aberta')`,
    [id]
  );
  res.status(201).json({ id });
});

// Editar (só o autor, e só enquanto estiver aberta)
router.put('/:id', autenticar, apenas('morador'), async (req, res) => {
  const { titulo, descricao, endereco, categoria_id } = req.body;
  const r = await pool.query(
    `UPDATE ocorrencia
     SET titulo = COALESCE($1, titulo), descricao = COALESCE($2, descricao),
         endereco = COALESCE($3, endereco), categoria_id = COALESCE($4, categoria_id),
         atualizado_em = NOW()
     WHERE id = $5 AND morador_id = $6 AND status = 'aberta' RETURNING id`,
    [titulo || null, descricao || null, endereco || null, categoria_id || null, req.params.id, req.usuario.id]
  );
  if (!r.rows[0]) {
    return res.status(403).json({ erro: 'Você só pode editar ocorrências suas que ainda estão abertas' });
  }
  res.json({ ok: true });
});

// Cancelar (só o autor)
router.patch('/:id/cancelar', autenticar, apenas('morador'), async (req, res) => {
  const atual = await pool.query(
    'SELECT status FROM ocorrencia WHERE id = $1 AND morador_id = $2',
    [req.params.id, req.usuario.id]
  );
  if (!atual.rows[0]) return res.status(403).json({ erro: 'Você só pode cancelar ocorrências suas' });
  if (['resolvida', 'cancelada'].includes(atual.rows[0].status)) {
    return res.status(400).json({ erro: 'Esta ocorrência já foi encerrada' });
  }
  await pool.query(`UPDATE ocorrencia SET status = 'cancelada', atualizado_em = NOW() WHERE id = $1`, [req.params.id]);
  await pool.query(
    `INSERT INTO historico_status (ocorrencia_id, status_anterior, status_novo) VALUES ($1, $2, 'cancelada')`,
    [req.params.id, atual.rows[0].status]
  );
  res.json({ ok: true });
});

// Atualizar status e prioridade (só a prefeitura do mesmo município)
router.patch('/:id/status', autenticar, apenas('prefeitura'), async (req, res) => {
  const { status, prioridade, comentario } = req.body;
  if (!['em_analise', 'em_andamento', 'resolvida'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }
  if (prioridade && !['baixa', 'media', 'alta'].includes(prioridade)) {
    return res.status(400).json({ erro: 'Prioridade inválida' });
  }
  const atual = await pool.query(
    'SELECT status FROM ocorrencia WHERE id = $1 AND municipio_id = $2',
    [req.params.id, req.usuario.municipio_id]
  );
  if (!atual.rows[0]) return res.status(404).json({ erro: 'Ocorrência não encontrada no seu município' });
  if (atual.rows[0].status === 'cancelada') {
    return res.status(400).json({ erro: 'Ocorrência cancelada pelo morador' });
  }
  await pool.query(
    'UPDATE ocorrencia SET status = $1, prioridade = COALESCE($2, prioridade), atualizado_em = NOW() WHERE id = $3',
    [status, prioridade || null, req.params.id]
  );
  await pool.query(
    `INSERT INTO historico_status (ocorrencia_id, prefeitura_id, status_anterior, status_novo, comentario)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.params.id, req.usuario.id, atual.rows[0].status, status, comentario || null]
  );
  res.json({ ok: true });
});

module.exports = router;