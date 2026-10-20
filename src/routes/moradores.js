const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha || senha.length < 6) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres' });
  }
  const emailLimpo = email.trim().toLowerCase();
  const existe = await pool.query('SELECT id FROM morador WHERE email = $1', [emailLimpo]);
  if (existe.rows.length > 0) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
  }
  const hash = await bcrypt.hash(senha, 10);
  const novo = await pool.query(
    'INSERT INTO morador (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
    [nome.trim(), emailLimpo, hash]
  );
  res.status(201).json(novo.rows[0]);
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const r = await pool.query('SELECT * FROM morador WHERE email = $1', [(email || '').trim().toLowerCase()]);
  const morador = r.rows[0];
  if (!morador || !(await bcrypt.compare(senha || '', morador.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }
  const token = jwt.sign({ id: morador.id, tipo: 'morador' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: { id: morador.id, nome: morador.nome, tipo: 'morador' } });
});

module.exports = router;