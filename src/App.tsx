import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ServiceOrderReport from './pages/ServiceOrderReport';
import PurchaseOrderReport from './pages/PurchaseOrderReport';
import AdminOrders from './pages/AdminOrders';
import Expenses from './pages/Expenses';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('antigravity_logged_user');
    if (user) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (loading) return null;

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servicios" element={<ServiceOrderReport />} />
            <Route path="/compras" element={<PurchaseOrderReport />} />
            <Route path="/reportes" element={<AdminOrders />} />
            <Route path="/gastos" element={<Expenses />} />
            <Route path="/equipo" element={<div className="premium-card p-12 text-center text-slate-400 font-bold">Gestión de Personal - Próximamente</div>} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
