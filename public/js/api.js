const $ = (id) => document.getElementById(id);

const ROTULOS = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  em_andamento: 'Em andamento',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
};

function getSessao() {
  try { return JSON.parse(localStorage.getItem('sessao')); } catch { return null; }
}
function salvarSessao(s) { localStorage.setItem('sessao', JSON.stringify(s)); }
function sair() { localStorage.removeItem('sessao'); location.href = '/login.html'; }

// Evita que texto digitado por usuários quebre a página
function esc(texto) {
  const d = document.createElement('div');
  d.textContent = texto ?? '';
  return d.innerHTML;
}

async function api(caminho, opcoes = {}) {
  const sessao = getSessao();
  const headers = {};
  if (sessao) headers.Authorization = 'Bearer ' + sessao.token;
  const config = { method: opcoes.method || 'GET', headers };
  if (opcoes.body instanceof FormData) {
    config.body = opcoes.body;
  } else if (opcoes.body) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(opcoes.body);
  }
  const resp = await fetch(caminho, config);
  const dados = await resp.json().catch(() => ({}));
  if (resp.status === 401 && sessao) localStorage.removeItem('sessao');
  if (!resp.ok) throw new Error(dados.erro || 'Erro na requisição');
  return dados;
}

function menu() {
  const s = getSessao();
  let html = `<span class='logo'>UrbanFix</span><a href='/'>Mapa</a>`;
  if (s && s.usuario.tipo === 'morador') {
    html += `<a href='/nova.html'>Nova ocorrência</a><a href='/minhas.html'>Minhas ocorrências</a>`;
  }
  if (s && s.usuario.tipo === 'prefeitura') html += `<a href='/painel.html'>Painel</a>`;
  html += s
    ? `<button onclick='sair()'>Sair (${esc(s.usuario.nome)})</button>`
    : `<a href='/login.html'>Entrar</a>`;
  $('menu').innerHTML = html;
}