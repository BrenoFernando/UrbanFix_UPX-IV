const express = require('express');
const pool = require('../db');
const { autenticar, apenas } = require('../middleware/auth');
const router = express.Router();

router.get('/resumo', autenticar, apenas('prefeitura'), async (req, res) => {
  const m = req.usuario.municipio_id;
  const porStatus = await pool.query(
    'SELECT status, COUNT(*)::int AS total FROM ocorrencia WHERE municipio_id = $1 GROUP BY status',
    [m]
  );
  const porCategoria = await pool.query(
    `SELECT c.nome AS categoria, COUNT(*)::int AS total
     FROM ocorrencia o JOIN categoria c ON c.id = o.categoria_id
     WHERE o.municipio_id = $1 GROUP BY c.nome ORDER BY total DESC`,
    [m]
  );
  const tempo = await pool.query(
    `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (h.criado_em - o.criado_em)) / 3600)::numeric, 1) AS horas
     FROM ocorrencia o
     JOIN historico_status h ON h.ocorrencia_id = o.id AND h.status_novo = 'resolvida'
     WHERE o.municipio_id = $1`,
    [m]
  );
  res.json({
    porStatus: porStatus.rows,
    porCategoria: porCategoria.rows,
    horasMediasResolucao: tempo.rows[0].horas,
  });
});

module.exports = router;