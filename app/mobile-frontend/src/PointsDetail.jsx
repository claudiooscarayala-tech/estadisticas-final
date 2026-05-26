import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';

export default function PointsDetail({ producer }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get(`/api/store/producer-collections/${producer.id}`)
      .then(res => {
        setCollections(res.data);
        // Expand the most recent month by default
        if (res.data.length > 0) {
          setExpanded({ [`${res.data[0].month} ${res.data[0].year}`]: true });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [producer.id]);

  const toggleMonth = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;

  return (
    <div className="fade-in delay-2">
      <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Detalle de Puntos Ganados</h2>
      <p style={{marginBottom: '1.5rem', fontSize: '1.05rem'}}>Desglose por compañía y mes</p>

      {collections.length === 0 ? (
        <div className="card" style={{textAlign: 'center', fontSize: '1.1rem'}}>No hay cobranzas registradas.</div>
      ) : (
        collections.map((item) => {
          const key = `${item.month} ${item.year}`;
          const isExpanded = expanded[key];

          return (
            <div className="card" key={key} style={{padding: 0, overflow: 'hidden'}}>
              <div 
                style={{
                  padding: '1.25rem 1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => toggleMonth(key)}
              >
                <div>
                  <div style={{fontWeight: 700, fontSize: '1.3rem'}}>{item.month} {item.year}</div>
                  <div style={{fontSize: '1.1rem', color: 'var(--success)', marginTop: '0.2rem'}}>+{item.total_points.toLocaleString('es-AR')} puntos</div>
                </div>
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>

              {isExpanded && (
                <div style={{padding: '0 1rem 1rem 1rem'}}>
                  <div style={{borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem'}}></div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {item.companies.map((c, i) => (
                      <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i < item.companies.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div style={{background: 'var(--secondary)', padding: '0.4rem', borderRadius: '6px'}}>
                            <Briefcase size={18} color="var(--text-muted)" />
                          </div>
                          <span style={{fontSize: '1.1rem', fontWeight: 600}}>{c.name}</span>
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <div style={{fontSize: '1.1rem', color: 'var(--success)', fontWeight: 'bold'}}>${c.amount.toLocaleString('es-AR')}</div>
                          <div style={{fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold'}}>{c.points.toLocaleString('es-AR')} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
