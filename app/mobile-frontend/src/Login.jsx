import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Lock, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dni.trim()) {
      toast.error("Por favor, ingresa tu DNI");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/producers/login', { dni: dni.trim() });
      toast.success(res.data.message);
      onLogin({ ...res.data.producer, token: res.data.token });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', padding: '2rem' }}>
      <div className="card fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'var(--accent)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', margin: '0 auto 1.5rem auto' 
        }}>
          <User size={32} color="white" />
        </div>
        
        <h1 style={{ marginBottom: '0.5rem' }}>Bienvenido</h1>
        <p style={{ marginBottom: '2rem' }}>Ingresa con tu DNI para ver tus puntos</p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Lock size={20} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
            <input 
              type="number" 
              placeholder="Número de DNI" 
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              style={{ paddingLeft: '3rem', marginBottom: 0 }}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ marginTop: '1.5rem', minHeight: '3rem' }}>
            {loading ? <span>Ingresando...</span> : <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><LogIn size={20} /> Ingresar</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
