const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'chave_secreta_padrao';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )
`).catch(err => console.error(err));

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://login3-0-gmff.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const router = express.Router();

const verificaToken = (req, res, next) => {
  const token = req.cookies.token_acesso;
  if (!token) return res.status(401).json({ message: 'Não autenticado' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao criar usuário.' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

    res.cookie('token_acesso', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000 
    });

    return res.json({ message: 'Login realizado', user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token_acesso', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  return res.json({ message: 'Logout realizado' });
});

router.get('/me', verificaToken, (req, res) => {
  res.json({ user: req.user });
});

router.get('/', (req, res) => {
  res.send('API Online');
});

app.use('/api', router);
app.use('/', router);

module.exports = app;