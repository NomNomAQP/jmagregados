import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ServiceOrderReport from './pages/ServiceOrderReport';
import PurchaseOrderReport from './pages/PurchaseOrderReport';
import AdminOrders from './pages/AdminOrders';
import Expenses from './pages/Expenses';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/servicios" element={<ServiceOrderReport />} />
          <Route path="/compras" element={<PurchaseOrderReport />} />
          <Route path="/reportes" element={<AdminOrders />} />
          <Route path="/gastos" element={<Expenses />} />
          <Route path="/equipo" element={<div className="premium-card p-12 text-center text-slate-400 font-bold">Gestión de Personal - Próximamente</div>} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
