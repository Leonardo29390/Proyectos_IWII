// src/Register.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/register', {
        username: username,
        email: email,
        password: password
      });
      alert('Usuario creado exitosamente. Ahora puedes iniciar sesión.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2>Crear Cuenta - Finanzas</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Nombre de Usuario:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Correo:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Registrarse
        </button>
      </form>
      
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        ¿Ya tienes cuenta? <Link to="/">Inicia sesión aquí</Link>
      </p>
    </div>
  );
}