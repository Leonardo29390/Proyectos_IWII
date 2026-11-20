import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>💸 Mis Finanzas</h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Ingresa a tu cuenta</p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" />
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '14px', fontSize: '16px', marginTop: '10px' }}>Entrar</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}