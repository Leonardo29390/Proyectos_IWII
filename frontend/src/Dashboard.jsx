// src/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // Por defecto será un gasto
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');

  // Función para cargar las transacciones
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

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchTransactions();
  }, [token, navigate]);

  // Función para guardar una nueva transacción
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/api/transactions/', {
        type: type,
        amount: parseFloat(amount),
        description: description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Limpiamos el formulario y recargamos la lista
      setDescription('');
      setAmount('');
      alert('Transacción guardada exitosamente');
      fetchTransactions(); 
    } catch (error) {
      alert('Error al guardar la transacción');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💸 Mi Dashboard Financiero</h1>
        <button onClick={cerrarSesion} style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Cerrar Sesión
        </button>
      </div>

      {/* FORMULARIO PARA AGREGAR TRANSACCIÓN */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Registrar Nueva Transacción</h3>
        <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '8px' }}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Descripción (ej. Cena)" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ padding: '8px', flex: '1' }}
          />
          
          <input 
            type="number" 
            placeholder="Monto (ej. 25000)" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ padding: '8px', flex: '1' }}
          />
          
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            Guardar
          </button>
        </form>
      </div>

      {/* HISTORIAL DE TRANSACCIONES */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Historial de Transacciones</h3>
        {transactions.length === 0 ? (
          <p>No hay transacciones registradas aún.</p>
        ) : (
          <ul>
            {transactions.map((t) => (
              <li key={t.id} style={{ marginBottom: '10px', fontSize: '18px' }}>
                <strong>{t.description}</strong> - ${t.amount} 
                <span style={{ color: t.type === 'income' ? 'green' : 'red', marginLeft: '10px' }}>
                  ({t.type === 'income' ? 'Ingreso' : 'Gasto'})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}