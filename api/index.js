const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const router = express.Router();

// Tenta pegar a URL do banco ou avisa que falta
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("ERRO GRAVE: POSTGRES_URL não foi encontrada nas variáveis de ambiente!");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(cookieParser());

// CORS permissivo para teste
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

// Rota de Teste Simples
router.get('/', (req, res) => {
  res.send('API Backend está viva! Verifique /api/db-test');
});

// Rota para testar conexão com banco e mostrar o erro na tela
router.get('/db-test', async (req, res) => {
  try {
    if (!process.env.POSTGRES_URL) throw new Error("Variável POSTGRES_URL não definida!");
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'Sucesso', time: result.rows[0], env: 'Variável encontrada' });
  } catch (error) {
    console.error("Erro no banco:", error);
    res.status(500).json({ 
      erro: 'Falha na conexão com Banco', 
      detalhes: error.message, // Isso vai mostrar o erro exato no navegador
      dica: 'Verifique se o banco Neon está criado e conectado na aba Storage'
    });
  }
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Cria tabela se não existir (apenas para garantir)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      )
    `);

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'Criado com sucesso!' });
  } catch (error) {
    console.error("Erro no Registro:", error);
    // Aqui retornamos o erro exato para você ler no console do navegador
    res.status(500).json({ message: 'Erro ao registrar', error: error.message });
  }
});

// Login, Logout e Me simplificados para não ocupar espaço, o foco é o Register
router.get('/me', (req, res) => res.json({ user: { username: 'teste' } }));

app.use('/api', router);
app.use('/', router);

module.exports = app;