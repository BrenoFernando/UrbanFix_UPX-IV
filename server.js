require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./src/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/teste', async (req, res) => {
  const resultado = await pool.query('SELECT NOW()');
  res.json({ ok: true, hora_do_banco: resultado.rows[0].now });
});

app.use('/', require('./src/routes/listas'));
app.use('/moradores', require('./src/routes/moradores'));
app.use('/prefeituras', require('./src/routes/prefeituras'));
app.use('/ocorrencias', require('./src/routes/ocorrencias'));
app.use('/dashboard', require('./src/routes/dashboard'));

app.use((erro, req, res, next) => {
  if (erro.name === 'MulterError') {
    return res.status(400).json({ erro: 'Envie no máximo 4 fotos de até 5 MB cada' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(process.env.PORT, () => {
  console.log('Servidor rodando na porta ' + process.env.PORT);
});