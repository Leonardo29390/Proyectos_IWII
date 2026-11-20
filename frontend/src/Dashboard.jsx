import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Ingreso');
  const [aiAdvice, setAiAdvice] = useState('');
  const [budget, setBudget] = useState(0);
  const [newBudget, setNewBudget] = useState('');
  const [usdAmount, setUsdAmount] = useState('10');
  const [copResult, setCopResult] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/', { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(response.data.transactions);
    } catch (error) {
      if (error.response?.status === 401) { localStorage.removeItem('token'); navigate('/'); }
    }
  };

  const fetchBudget = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions/budget', { headers: { Authorization: `Bearer ${token}` } });
      setBudget(res.data.monthly_budget || 0);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetchTransactions(); fetchBudget();
  }, [token, navigate]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/transactions/', { type, amount: parseFloat(amount), description, category_id: category }, { headers: { Authorization: `Bearer ${token}` } });
      setDescription(''); setAmount(''); fetchTransactions(); 
    } catch (error) { alert('Error al guardar'); }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/transactions/budget', { monthly_budget: parseFloat(newBudget) }, { headers: { Authorization: `Bearer ${token}` } });
      setBudget(parseFloat(newBudget)); setNewBudget('');
    } catch (error) { alert('Error al actualizar'); }
  };

  const handleConvert = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/transactions/convert?from=USD&to=COP&amount=${usdAmount}`, { headers: { Authorization: `Bearer ${token}` } });
      setCopResult(res.data);
    } catch (error) { alert("Error al convertir"); }
  };

  const handleGetAdvice = async () => {
    setAiAdvice("Analizando tus datos con Inteligencia Artificial...");
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard/ai-advice', { headers: { Authorization: `Bearer ${token}` } });
      setAiAdvice(res.data.advice);
    } catch (error) { setAiAdvice("Error al conectar con la IA."); }
  };

  const cerrarSesion = () => { localStorage.removeItem('token'); navigate('/'); };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const chartData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{ data: [totalIncome, totalExpense], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 4 }],
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>Panel de Control</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Resumen de tu salud financiera</p>
        </div>
        <button onClick={cerrarSesion} style={{ backgroundColor: '#f1f5f9', color: '#ef4444', padding: '10px 20px' }}>Cerrar Sesión</button>
      </header>

      {/* Tarjetas Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Ingresos Totales</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>${totalIncome.toLocaleString()}</h3>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Gastos Totales</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>${totalExpense.toLocaleString()}</h3>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Saldo Actual</p>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>${balance.toLocaleString()}</h3>
        </div>
      </div>

      {/* Grid Principal (Formulario + Gráfico) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Registrar Transacción</h2>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Ingreso">Salario</option>
                <option value="Gasto">Gasto General</option>
                <option value="Inversión">Inversión</option>
                <option value="Ahorro">Ahorro</option>
              </select>
            </div>
            <input type="text" placeholder="Descripción (ej. Cena)" value={description} onChange={(e) => setDescription(e.target.value)} required />
            <input type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px' }}>Guardar Transacción</button>
          </form>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', alignSelf: 'flex-start' }}>Distribución</h2>
          <div style={{ width: '220px' }}><Doughnut data={chartData} /></div>
        </div>
      </div>

      {/* Herramientas (Presupuesto, Divisas, IA) en Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🎯 Presupuesto</h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Límite: <strong style={{ color: '#0f172a' }}>${budget.toLocaleString()}</strong></p>
          <form onSubmit={handleUpdateBudget} style={{ display: 'flex', gap: '10px' }}>
            <input type="number" placeholder="Nuevo límite" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} required style={{ flex: 1 }} />
            <button type="submit" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0 20px' }}>Fijar</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>💱 Divisas</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} style={{ flex: 1 }} />
            <button onClick={handleConvert} style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '0 20px' }}>USD a COP</button>
          </div>
          {copResult && <p style={{ marginTop: '16px', color: '#0ea5e9', fontWeight: 'bold' }}>${copResult.converted.toLocaleString()} COP</p>}
        </div>
      </div>

      {/* IA Financiera */}
      <div className="card" style={{ marginBottom: '40px', border: '1px solid #8b5cf6', backgroundColor: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4c1d95' }}>🤖 Asesoramiento Experto con IA</h3>
          <button onClick={handleGetAdvice} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '10px 20px' }}>Generar Análisis</button>
        </div>
        {aiAdvice && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e9d5ff', fontSize: '15px', color: '#334155', lineHeight: '1.6', overflowX: 'auto' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiAdvice}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Historial de Movimientos</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '14px' }}>
                <th style={{ paddingBottom: '12px' }}>Fecha</th>
                <th style={{ paddingBottom: '12px' }}>Descripción</th>
                <th style={{ paddingBottom: '12px' }}>Tipo</th>
                <th style={{ paddingBottom: '12px' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 0', color: '#475569' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 0', fontWeight: '500' }}>{t.description}</td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ backgroundColor: t.type === 'income' ? '#dcfce7' : '#fee2e2', color: t.type === 'income' ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 0', fontWeight: '700', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>${t.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}