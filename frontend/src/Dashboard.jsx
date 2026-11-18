// src/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/transactions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
    } catch (error) {
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
      
      setDescription('');
      setAmount('');
      fetchTransactions(); 
    } catch (error) {
      alert('Error al guardar la transacción');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // --- CÁLCULOS PARA EL DASHBOARD ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Datos para el gráfico
  const chartData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderColor: ['#388E3C', '#D32F2F'],
        borderWidth: 1,
      },
    ],
  };
  // --- FUNCIÓN PARA EXPORTAR DATOS ---
  const handleExport = async (format) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/transactions/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Importante para descargar archivos
      });
      
      // Crear un enlace temporal para forzar la descarga en el navegador
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mis_finanzas.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error al exportar los datos');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💸 Mi Dashboard Financiero</h1>
        <button onClick={cerrarSesion} style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Cerrar Sesión
        </button>
      </div>

            {/* BOTONES DE EXPORTACIÓN */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => handleExport('csv')} style={{ padding: '10px 15px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          📥 Exportar a CSV
        </button>
        <button onClick={() => handleExport('excel')} style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          📊 Exportar a Excel
        </button>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Ingresos Totales</h3>
          <p style={{ fontSize: '24px', color: '#2E7D32', fontWeight: 'bold' }}>${totalIncome.toLocaleString()}</p>
        </div>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#ffebee', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Gastos Totales</h3>
          <p style={{ fontSize: '24px', color: '#C62828', fontWeight: 'bold' }}>${totalExpense.toLocaleString()}</p>
        </div>
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Saldo Actual</h3>
          <p style={{ fontSize: '24px', color: balance >= 0 ? '#1565C0' : '#C62828', fontWeight: 'bold' }}>${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* GRÁFICO Y FORMULARIO */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        
        {/* Gráfico */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3>Distribución de Dinero</h3>
          {transactions.length > 0 ? (
             <div style={{ width: '250px' }}>
               <Doughnut data={chartData} />
             </div>
          ) : (
            <p>No hay datos para graficar</p>
          )}
        </div>

        {/* Formulario */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Registrar Transacción</h3>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '10px' }}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <input 
              type="text" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '10px' }}
            />
            <input 
              type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ padding: '10px' }}
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Guardar Transacción
            </button>
          </form>
        </div>
      </div>

      {/* HISTORIAL */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Historial Detallado</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Fecha</th>
              <th style={{ padding: '10px' }}>Descripción</th>
              <th style={{ padding: '10px' }}>Tipo</th>
              <th style={{ padding: '10px' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{new Date(t.date).toLocaleDateString()}</td>
                <td style={{ padding: '10px' }}>{t.description}</td>
                <td style={{ padding: '10px', color: t.type === 'income' ? 'green' : 'red' }}>
                  {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>${t.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}