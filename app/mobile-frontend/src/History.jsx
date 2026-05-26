import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function History({ producer }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/store/producer-history/${producer.id}`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [producer.id]);

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;

  const currentBalance = history.length > 0 ? history[0].balance : 0;

  return (
    <div className="fade-in delay-3">
      <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Estado de Cuenta</h2>
      
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        padding: '1.5rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem', letterSpacing: '1px'}}>SALDO ACTUAL</div>
        <div style={{fontSize: '2.5rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
          {currentBalance.toLocaleString('es-AR')} <span style={{fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)'}}>pts</span>
        </div>
      </div>

      <p style={{marginBottom: '1.5rem', fontSize: '1.05rem', fontWeight: 600}}>Historial de Movimientos</p>

      {history.length === 0 ? (
        <div className="card" style={{textAlign: 'center', fontSize: '1.1rem'}}>No hay movimientos registrados.</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          {history.map((h) => (
            <div className="card" key={h.id} style={{marginBottom: 0, padding: '1.25rem 1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: h.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {h.type === 'income' ? 
                      <ArrowDownRight size={24} color="#10b981" /> : 
                      <ArrowUpRight size={24} color="#ef4444" />
                    }
                  </div>
                  <div>
                    <div style={{fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.2rem'}}>{h.description}</div>
                    <div style={{fontSize: '0.95rem', color: 'var(--text-muted)'}}>
                      {new Date(h.date).toLocaleDateString('es-AR', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </div>
                  </div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{
                    fontWeight: 700, fontSize: '1.25rem',
                    color: h.type === 'income' ? '#10b981' : '#ef4444'
                  }}>
                    {h.type === 'income' ? '+' : '-'}{h.points.toLocaleString('es-AR')}
                  </div>
                  <div style={{fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.2rem'}}>
                    Saldo: <span style={{fontWeight: 'bold', color: '#f8fafc', fontSize: '1.05rem'}}>{h.balance.toLocaleString('es-AR')}</span> pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
