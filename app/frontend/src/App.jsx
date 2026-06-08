import React, { useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, BarChart3, Building, User, FileText, LogOut, Award } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Dashboard from "./Dashboard";
import DataEntry from "./DataEntry";
import CompanyReports from "./CompanyReports";
import ProducerGlobalReports from "./ProducerGlobalReports";
import ProducerReport from "./ProducerReport";
import ProducerManagement from "./ProducerManagement";
import ProvinceReports from "./ProvinceReports";
import Deuda from "./Deuda";
import Vencimiento from "./Vencimiento";
import Points from "./Points";
import Store from "./Store";
import StoreAdmin from "./StoreAdmin";
import StoreOrders from "./StoreOrders";
import { Gift, ShoppingBag, Settings, Package, Users, Map, ChevronDown, ChevronRight } from "lucide-react";
import logoCoa from "./assets/logo-coa.png";

function ProducerLayout({ children }) {
  const { logout, user } = useContext(AuthContext);

  return (
    <>
      <aside className="sidebar">
        <div className="logo" style={{ marginBottom: "1rem", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ 
            background: "#ffffff", 
            padding: "1rem", 
            borderRadius: "0.5rem", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <img src={logoCoa} alt="COA Logo" style={{ width: "100%", maxWidth: "150px", height: "auto" }} />
          </div>
          <div style={{ textAlign: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontStyle: "italic", fontWeight: "600" }}>"El valor de compartir"</span>
          </div>
        </div>
        <nav className="nav-links">
          <NavLink to={`/productor/${user?.id}`} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={20} />
            Mi Reporte
          </NavLink>
          <NavLink to="/puntos" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Award size={20} />
            Mis Puntos
          </NavLink>
          <NavLink to="/tienda" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <ShoppingBag size={20} />
            Tienda COA
          </NavLink>
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem", display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Productor</span>
            <strong>{user?.username}</strong>
          </div>
          <button 
            onClick={logout} 
            className="nav-link" 
            style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: "0.75rem 1rem" }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

function DashboardLayout({ children }) {
  const { logout, user } = useContext(AuthContext);
  const [isProducersOpen, setIsProducersOpen] = useState(false);
  const [isDeudasOpen, setIsDeudasOpen] = useState(false);
  const [isVencimientosOpen, setIsVencimientosOpen] = useState(false);
  const [isTiendaOpen, setIsTiendaOpen] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <div className="logo" style={{ marginBottom: "1rem", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ 
            background: "#ffffff", 
            padding: "1rem", 
            borderRadius: "0.5rem", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <img src={logoCoa} alt="COA Logo" style={{ width: "100%", maxWidth: "150px", height: "auto" }} />
          </div>
          <div style={{ textAlign: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontStyle: "italic", fontWeight: "600" }}>"El valor de compartir"</span>
          </div>
        </div>
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/por-compania" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Building size={20} />
            Por Compañía
          </NavLink>
          <div 
            className="nav-link" 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setIsProducersOpen(!isProducersOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={20} />
              Productores
            </div>
            {isProducersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {isProducersOpen && (
            <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
              <NavLink to="/por-productor" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Reporte por PAS
              </NavLink>
              <NavLink to="/por-provincia" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Estadísticas por provincia
              </NavLink>
              <NavLink to="/gestion-productores" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Gestión
              </NavLink>
            </div>
          )}
          <div 
            className="nav-link" 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setIsTiendaOpen(!isTiendaOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingBag size={20} />
              Tienda y Puntos
            </div>
            {isTiendaOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {isTiendaOpen && (
            <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
              <NavLink to="/puntos" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Puntos Ganados
              </NavLink>
              <NavLink to="/tienda" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Tienda COA
              </NavLink>
              <NavLink to="/tienda-admin" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Admin Tienda
              </NavLink>
              <NavLink to="/tienda-entregas" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Gestión Entregas
              </NavLink>
            </div>
          )}
          <NavLink to="/ingreso" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Database size={20} />
            Carga de Datos
          </NavLink>
          
          <div 
            className="nav-link" 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setIsDeudasOpen(!isDeudasOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={20} />
              Gestión de Deudas
            </div>
            {isDeudasOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {isDeudasOpen && (
            <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
              <NavLink to="/deuda-digna" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Digna
              </NavLink>
              <NavLink to="/deuda-sancor" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Sancor
              </NavLink>
              <NavLink to="/deuda-parana" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Paraná
              </NavLink>
            </div>
          )}

          <div 
            className="nav-link" 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setIsVencimientosOpen(!isVencimientosOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={20} />
              Gestión de Vencimientos
            </div>
            {isVencimientosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {isVencimientosOpen && (
            <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
              <NavLink to="/vencimiento-digna" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Digna
              </NavLink>
              <NavLink to="/vencimiento-sancor" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Sancor
              </NavLink>
              <NavLink to="/vencimiento-parana" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Paraná
              </NavLink>
            </div>
          )}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Usuario: {user?.username}
          </div>
          <button 
            onClick={() => {
              const token = localStorage.getItem("token");
              if (!token) return;
              fetch("/api/download-db", {
                headers: { "Authorization": `Bearer ${token}` }
              })
              .then(res => {
                if (!res.ok) throw new Error("Error al descargar backup");
                return res.blob();
              })
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `backup_estadisticas_${new Date().toISOString().split('T')[0]}.sqlite`;
                a.click();
              })
              .catch(err => alert(err.message));
            }}
            className="nav-link" 
            style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: "0.75rem 1rem", color: "var(--accent)" }}
          >
            <Database size={20} />
            Descargar Backup
          </button>
          <button 
            onClick={logout} 
            className="nav-link" 
            style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: "0.75rem 1rem" }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/admin">
        <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }} />
        <AuthContext.Consumer>
          {({ user }) => (
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {user?.role === 'producer' ? (
                <>
                  <Route path="/" element={<Navigate to={`/productor/${user.id}`} replace />} />
                  <Route path="/productor/:id" element={<ProtectedRoute><ProducerLayout><ProducerReport /></ProducerLayout></ProtectedRoute>} />
                  <Route path="/puntos" element={<ProtectedRoute><ProducerLayout><Points /></ProducerLayout></ProtectedRoute>} />
                  <Route path="/tienda" element={<ProtectedRoute><ProducerLayout><Store /></ProducerLayout></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to={`/productor/${user.id}`} replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/por-compania" element={<ProtectedRoute><DashboardLayout><CompanyReports /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/por-productor" element={<ProtectedRoute><DashboardLayout><ProducerGlobalReports /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/por-provincia" element={<ProtectedRoute><DashboardLayout><ProvinceReports /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/gestion-productores" element={<ProtectedRoute><DashboardLayout><ProducerManagement /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/puntos" element={<ProtectedRoute><DashboardLayout><Points /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/tienda" element={<ProtectedRoute><DashboardLayout><Store /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/tienda-admin" element={<ProtectedRoute><DashboardLayout><StoreAdmin /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/tienda-entregas" element={<ProtectedRoute><DashboardLayout><StoreOrders /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/productor/:id" element={<ProtectedRoute><DashboardLayout><ProducerReport /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/ingreso" element={<ProtectedRoute><DashboardLayout><DataEntry /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/deuda-digna" element={<ProtectedRoute><DashboardLayout><Deuda companyName="Digna Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/deuda-sancor" element={<ProtectedRoute><DashboardLayout><Deuda companyName="Sancor Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/deuda-parana" element={<ProtectedRoute><DashboardLayout><Deuda companyName="Paraná Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/vencimiento-digna" element={<ProtectedRoute><DashboardLayout><Vencimiento companyName="Digna Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/vencimiento-sancor" element={<ProtectedRoute><DashboardLayout><Vencimiento companyName="Sancor Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/vencimiento-parana" element={<ProtectedRoute><DashboardLayout><Vencimiento companyName="Paraná Seguros" /></DashboardLayout></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          )}
        </AuthContext.Consumer>
      </Router>
    </AuthProvider>
  );
}

export default App;
