import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home, BarChart2, ShoppingBag, Receipt, LogOut, FileText } from 'lucide-react';
import Login from './Login';
import Dashboard from './Dashboard';
import Store from './Store';
import PointsDetail from './PointsDetail';
import History from './History';
import ProducerReport from './ProducerReport';
import axios from 'axios';

export default function App() {
  const [producer, setProducer] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('mobile_producer');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProducer(parsed);
      if (parsed.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  }, []);

  const handleLogin = (prod) => {
    setProducer(prod);
    if (prod.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${prod.token}`;
    }
    localStorage.setItem('mobile_producer', JSON.stringify(prod));
  };

  const handleLogout = () => {
    setProducer(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('mobile_producer');
  };

  if (!producer) {
    return (
      <>
        <Toaster position="top-center" />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Toaster position="top-center" />
        
        {/* Top Bar for Mobile */}
        <div style={{
          padding: '1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <h2 style={{margin: 0, fontSize: '1.2rem', color: 'var(--accent)'}}>COA Puntos</h2>
          <button 
            onClick={handleLogout}
            className="secondary" 
            style={{ width: 'auto', padding: '0.5rem', borderRadius: '50%' }}
          >
            <LogOut size={16} />
          </button>
        </div>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard producer={producer} />} />
            <Route path="/puntos" element={<PointsDetail producer={producer} />} />
            <Route path="/tienda" element={<Store producer={producer} />} />
            <Route path="/historial" element={<History producer={producer} />} />
            <Route path="/reporte" element={<ProducerReport producer={producer} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={24} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/puntos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart2 size={24} />
            <span>Puntos</span>
          </NavLink>
          <NavLink to="/tienda" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={24} />
            <span>Tienda</span>
          </NavLink>
          <NavLink to="/historial" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Receipt size={24} />
            <span>Movimientos</span>
          </NavLink>
          <NavLink to="/reporte" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={24} />
            <span>Reporte</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}
