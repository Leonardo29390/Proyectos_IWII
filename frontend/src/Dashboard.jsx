// src/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();
  
  // Obtenemos el token guardado en el login
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Si no hay token, lo mandamos al login
    if (!token) {
      navigate('/');
      return;
    }

    // Pedir las transacciones al backend
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/transactions/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data.transactions);
      } catch (error) {
        console.error("Error al cargar transacciones", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };

    fetchTransactions();
  }, [token, navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💸 Mi Dashboard Financiero</h1>
        <button onClick={cerrarSesion} style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Historial de Transacciones</h3>
        {transactions.length === 0 ? (
          <p>No hay transacciones registradas aún.</p>
        ) : (
          <ul>
            {transactions.map((t) => (
              <li key={t.id} style={{ marginBottom: '10px' }}>
                <strong>{t.description}</strong> - ${t.amount} ({t.type === 'income' ? 'Ingreso' : 'Gasto'})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}