import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Wallet, Gift } from 'lucide-react';

export default function Dashboard({ producer }) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Fetch latest balance from history endpoint
    axios.get(`/api/store/producer-history/${producer.id}`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setBalance(res.data[0].balance); // It's reversed, so newest is first
        }
      })
      .catch(err => console.error(err));
  }, [producer.id]);

  return (
    <div className="fade-in delay-1">
      <h1 style={{fontSize: '2rem', marginTop: '1rem'}}>Hola,</h1>
      <h2 style={{color: 'var(--text-muted)', fontWeight: 400, marginBottom: '2rem', fontSize: '1.3rem'}}>
        {producer.name.includes(',') ? producer.name.split(',')[1].split('-')[0].trim() : producer.name}
      </h2>

      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.9, fontSize: '1.05rem'}}>
          <Wallet size={20} />
          <span>Tu Saldo Disponible</span>
        </div>
        <div style={{fontSize: '3.3rem', fontWeight: 700}}>
          {balance.toLocaleString('es-AR')} <span style={{fontSize: '1.5rem', opacity: 0.8}}>pts</span>
        </div>
      </div>

      <h3 style={{marginTop: '2rem', marginBottom: '1rem', fontSize: '1.35rem'}}>Novedades</h3>
      <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        <div style={{width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Gift size={24} color="var(--accent)" />
        </div>
        <div>
          <h4 style={{marginBottom: '0.25rem', fontSize: '1.1rem'}}>Nuevos Productos</h4>
          <p style={{fontSize: '1.05rem', margin: 0}}>Visita la Tienda para ver los últimos premios agregados.</p>
        </div>
      </div>
    </div>
  );
}
