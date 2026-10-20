const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, municipio_id } = req.body;
  if (!nome || !email || !senha || senha.length < 6 || !municipio_id) {
    return res.status(400).json({ erro: 'Informe nome, e-mail, município e uma senha com pelo menos 6 caracteres' });
  }
  const emailLimpo = email.trim().toLowerCase();
  const existe = await pool.query(
    'SELECT id FROM prefeitura WHERE email = $1 OR municipio_id = $2',
    [emailLimpo, municipio_id]
  );
  if (existe.rows.length > 0) {
    return res.status(409).json({ erro: 'Já existe uma prefeitura com este e-mail ou neste município' });
  }
  const hash = await bcrypt.hash(senha, 10);
  const nova = await pool.query(
    'INSERT INTO prefeitura (municipio_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, municipio_id',
    [municipio_id, nome.trim(), emailLimpo, hash]
  );
  res.status(201).json(nova.rows[0]);
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const r = await pool.query('SELECT * FROM prefeitura WHERE email = $1', [(email || '').trim().toLowerCase()]);
  const pref = r.rows[0];
  if (!pref || !(await bcrypt.compare(senha || '', pref.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }
  const token = jwt.sign(
    { id: pref.id, tipo: 'prefeitura', municipio_id: pref.municipio_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({
    token,
    usuario: { id: pref.id, nome: pref.nome, tipo: 'prefeitura', municipio_id: pref.municipio_id }
  });
});

module.exports = router;