# UrbanFix_UPX-IV
Plataforma web em que moradores registram problemas urbanos (buracos, iluminação, calçadas, lixo etc.) com foto, endereço e localização no mapa, e a prefeitura do município acompanha, prioriza e resolve cada ocorrência por um painel próprio.

# Funcionalidades:

Morador: Cadastro e login, Registro de ocorrência com título, categoria, descrição, endereço, até 4 fotos e local no mapa
O mapa localiza o endereço digitado automaticamente, e o pino pode ser ajustado à mão
Acompanhamento das próprias ocorrências, com as fotos e o status de cada uma
Edição da própria ocorrência, enquanto ela estiver aberta
Cancelamento da própria ocorrência (só o autor pode editar ou cancelar)

Prefeitura: (login separado do morador, uma conta por município)
Painel com totais por status e por categoria e tempo médio de resolução
Atualização do status (em análise, em andamento, resolvida), da prioridade (baixa, média, alta) e comentário
Lista ordenada pela prioridade, com as de prioridade mais alta primeiro
Visualização apenas das ocorrências do seu município

Geral: Mapa público com todas as ocorrências, fotos nos balões e filtros por status e categoria
Página de detalhes de cada ocorrência, com fotos, mapa e o histórico completo de mudanças de status
Histórico de cada mudança de status guardado no banco, com data e comentário da prefeitura

# Tecnologias

Camada	Tecnologia

Servidor (API)	Node.js, Express

Banco de dados	PostgreSQL

Autenticação	JWT (jsonwebtoken) e senhas criptografadas com bcryptjs

Upload de fotos	Multer

Site	HTML, CSS e JavaScript puro

Mapa	Leaflet com mapas do OpenStreetMap

Busca de endereço	Nominatim (OpenStreetMap)




# UrbanFix

## Estrutura do Projeto

O UrbanFix é uma plataforma web desenvolvida para facilitar a comunicação entre cidadãos e prefeituras, permitindo o registro e o acompanhamento de problemas urbanos, como buracos nas vias públicas, iluminação defeituosa, calçadas danificadas e outras ocorrências.

O projeto utiliza Node.js, PostgreSQL, JavaScript, HTML e CSS, com uma API responsável pela comunicação entre o sistema e o banco de dados.

### Organização dos arquivos

```text
urbanfix/
├── server.js
├── package.json
├── tests.http
├── .env.example
├── .gitignore
│
├── banco/
│   └── schema.sql
│
├── src/
│   ├── db.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   └── routes/
│       ├── listas.js
│       ├── moradores.js
│       ├── prefeituras.js
│       ├── ocorrencias.js
│       └── dashboard.js
│
└── public/
    ├── index.html
    ├── login.html
    ├── cadastro.html
    ├── nova.html
    ├── minhas.html
    ├── detalhe.html
    ├── painel.html
    │
    ├── css/
    │   └── style.css
    │
    └── js/
        └── api.js
```

### Descrição dos principais arquivos

**Arquivos principais**
- `server.js`: inicia o servidor, disponibiliza o site e registra as rotas da API.
- `package.json`: gerencia as dependências e os scripts do projeto, incluindo `npm run dev`.
- `tests.http`: contém requisições para testar a API utilizando a extensão REST Client do VS Code.
- `.env.example`: apresenta um modelo das variáveis de ambiente necessárias para executar o projeto.
- `.gitignore`: define os arquivos e diretórios que não devem ser enviados ao GitHub.

**Banco de dados**
- `banco/schema.sql`: contém a estrutura das tabelas e os dados iniciais do PostgreSQL.
- `src/db.js`: responsável pela conexão com o banco de dados PostgreSQL.

**Middleware**
- `src/middleware/auth.js`: verifica a autenticação por JWT e o tipo de conta do usuário (morador ou prefeitura).

**Rotas da API**
- `listas.js`: disponibiliza categorias de ocorrências e municípios.
- `moradores.js`: gerencia o cadastro e o login dos moradores.
- `prefeituras.js`: gerencia o cadastro e o login das prefeituras.
- `ocorrencias.js`: gerencia o registro, a listagem, a consulta, a edição, o cancelamento e a atualização do status das ocorrências.
- `dashboard.js`: disponibiliza os indicadores e dados do painel administrativo da prefeitura.

**Interface do usuário (public)**
- `index.html`: página inicial com mapa, filtros e lista de ocorrências.
- `login.html`: tela de acesso para moradores e prefeituras.
- `cadastro.html`: cadastro de moradores e prefeituras.
- `nova.html`: formulário para registrar ocorrências, com busca de endereço no mapa.
- `minhas.html`: área do morador para consultar, editar e cancelar suas ocorrências.
- `detalhe.html`: apresenta os detalhes, o mapa e o histórico de uma ocorrência.
- `painel.html`: painel administrativo da prefeitura.
- `css/style.css`: contém os estilos visuais da plataforma.
- `js/api.js`: reúne funções compartilhadas para comunicação com a API, autenticação e gerenciamento do menu.

### Tecnologias utilizadas

- **Node.js:** ambiente de execução do servidor.
- **PostgreSQL:** gerenciamento do banco de dados.
- **JavaScript:** desenvolvimento das funcionalidades e comunicação com a API.
- **HTML5:** estrutura das páginas.
- **CSS3:** estilização e identidade visual.
- **JWT:** autenticação e controle de acesso.

### Segurança

O arquivo `.env` contém informações privadas de configuração e não deve ser enviado ao GitHub. Utilize o `.env.example` como modelo para configurar o ambiente localmente.

## Armazenamento de imagens

A pasta `uploads/`, responsável por armazenar as fotos enviadas pelos usuários durante o registro das ocorrências, é criada automaticamente pelo servidor e não é versionada no Git.

## Banco de dados

O UrbanFix utiliza PostgreSQL como sistema de gerenciamento de banco de dados, contando com sete tabelas principais:

- `municipio`: armazena os municípios cadastrados.
- `morador`: armazena os dados dos moradores.
- `prefeitura`: armazena os dados das prefeituras.
- `categoria`: armazena as categorias de problemas urbanos.
- `ocorrencia`: registra as ocorrências cadastradas pelos moradores.
- `ocorrencia_foto`: armazena as informações das fotografias das ocorrências.
- `historico_status`: registra as alterações de status das ocorrências.

Toda ocorrência está vinculada a um município, permitindo que cada prefeitura visualize e gerencie somente as ocorrências relacionadas ao seu município.

O script completo de criação das tabelas e inserção dos dados iniciais está disponível em `banco/schema.sql`.

## Como executar o projeto

### Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Node.js (versão LTS).
- PostgreSQL.

### Instalação

**1. Clone o repositório e acesse a pasta do projeto:**

```bash
git clone https://github.com/SEU_USUARIO/urbanfix.git
cd urbanfix
```

**2. Instale as dependências:**

```bash
npm install
```

**3. Configure o banco de dados:**

Crie um banco de dados chamado `UrbanFix` no PostgreSQL e execute o arquivo `banco/schema.sql` utilizando o pgAdmin ou o terminal `psql`.

**4. Configure as variáveis de ambiente:**

Copie o arquivo `.env.example` para `.env` e preencha as configurações necessárias, incluindo:

- `DB_PASSWORD`: senha de acesso ao PostgreSQL.
- `JWT_SECRET`: chave utilizada para autenticação dos usuários.

**5. Inicie o servidor:**

```bash
npm run dev
```

**6. Acesse o sistema pelo navegador:**

http://localhost:3000

**Observação:** o mapa e a busca de endereços utilizam serviços do OpenStreetMap e precisam de conexão com a internet.

## Primeiros passos no sistema

Para começar a utilizar o UrbanFix, siga as etapas:

1. Acesse a opção **Cadastro** e crie uma conta de prefeitura, selecionando o município correspondente. Cada município pode possuir apenas uma conta de prefeitura.
2. Crie também uma conta de morador.
3. Entre como morador, registre uma ocorrência com fotografia e acompanhe seu andamento na seção **Minhas Ocorrências**.
4. Entre como prefeitura, acesse o **Painel**, atualize o status e a prioridade das ocorrências e consulte o histórico na página de detalhes.

### Testes da API

Para testar as rotas da API sem utilizar a interface do site, utilize o arquivo `tests.http` com a extensão **REST Client** do Visual Studio Code.
