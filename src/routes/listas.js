const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/categorias', async (req, res) => {
  const r = await pool.query('SELECT id, nome FROM categoria ORDER BY nome');
  res.json(r.rows);
});

router.get('/municipios', async (req, res) => {
  const r = await pool.query('SELECT id, nome, uf FROM municipio ORDER BY nome');
  res.json(r.rows);
});

module.exports = router;