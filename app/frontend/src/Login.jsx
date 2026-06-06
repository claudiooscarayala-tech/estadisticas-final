import React, { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BarChart3, Lock } from "lucide-react";
import toast from "react-hot-toast";
import logoCoa from "./assets/logo-coa.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success("Bienvenido!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', background: 'var(--bg-main)' }}>
      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <img src={logoCoa} alt="COA Logo" style={{ width: '80px', height: 'auto', display: 'block' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', textAlign: 'center', color: 'var(--text-main)' }}>
            COA Asesores de Seguros
          </h2>
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.5rem 1rem', 
            background: 'var(--accent-light)', 
            borderRadius: '2rem',
            border: '1px solid var(--accent)'
          }}>
            <p style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: '600', textAlign: 'center', letterSpacing: '0.5px' }}>
              "El valor de compartir"
            </p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
            Inicia sesión en tu portal corporativo
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej: admin"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            disabled={isLoading}
          >
            <Lock size={18} />
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
