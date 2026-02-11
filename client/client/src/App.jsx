import { useState, useEffect } from 'react';
import api from './api';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await api.get('/me');
        setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLoginMode ? '/login' : '/register';

    try {
      const response = await api.post(endpoint, { username, password });
      
      if (isLoginMode) {
        setUser(response.data.user);
      } else {
        alert('Cadastro realizado! Faça login agora.');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ocorreu um erro');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Carregando...</div>;

  if (user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>Olá, {user.username}!</h1>
        <p>ID: {user.id}</p>
        <button onClick={handleLogout}>Sair</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>{isLoginMode ? 'Acessar Sistema' : 'Criar Conta'}</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <input
          type="text"
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isLoginMode ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>
      {error && 
      <p style={{ color: 'red' }}>
        {error}
        </p>}
        
      <p>
        <button onClick={() => {
            setIsLoginMode(!isLoginMode);
            setError('');
          }}
          style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
          {isLoginMode ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
        </button>
      </p>
    </div>
  );
}

export default App;