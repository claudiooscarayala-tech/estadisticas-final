import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Award, Calendar } from 'lucide-react';

const COMPANY_COLORS = {
  "DIGNA": "#f97316",       // Naranja
  "SANCOR": "#ef4444",      // Rojo
  "PARANA": "#1e3a8a",      // Azul oscuro
  "BBVA": "#38bdf8",        // Celeste
  "FEDERACION": "#22c55e"   // Verde
};
const DEFAULT_COLORS = ["#8b5cf6", "#f43f5e", "#eab308", "#14b8a6", "#64748b"];

const getColorForCompany = (companyName, index) => {
  const normalized = companyName.trim().toUpperCase();
  for (const key in COMPANY_COLORS) {
    if (normalized.includes(key)) {
      return COMPANY_COLORS[key];
    }
  }
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

export default function ProducerReport({ producer }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only pass the year, no company filter so we get global performance
    axios.get(`/api/reports/producer/${producer.id}`)
      .then(res => {
        const data = res.data;
        const MONTHS_ORDER = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        
        if (data && data.byMonth) {
          data.byMonth.sort((a, b) => {
            return MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month);
          });
        }
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [producer.id]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    return "$ " + Number(val).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="fade-in delay-1" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh'}}>
        <div style={{color: 'var(--text-muted)'}}>Cargando tu reporte...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="fade-in delay-1" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh'}}>
        <div style={{color: 'var(--text-muted)'}}>No se pudo cargar el reporte.</div>
      </div>
    );
  }

  return (
    <div className="fade-in delay-1">
      <div style={{marginBottom: '1.5rem'}}>
        <h2 style={{fontSize: '1.6rem', marginBottom: '0.25rem'}}>Tu Rendimiento</h2>
        <p style={{color: 'var(--text-muted)', fontSize: '1.1rem'}}>Resumen global del año en curso</p>
      </div>

      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.2) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <TrendingUp size={28} color="#10b981" />
        </div>
        <div>
          <div style={{color: 'var(--success)', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.5px', marginBottom: '0.2rem'}}>TOTAL DE COBRANZAS AÑO 2026</div>
          <div style={{fontSize: '2.2rem', fontWeight: 800}}>
            {formatCurrency(reportData.total)}
          </div>
        </div>
      </div>

      <h3 style={{fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem'}}>Cobranzas por Mes</h3>
      <div className="card" style={{padding: '1rem', paddingTop: '1.5rem', marginBottom: '2rem'}}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={reportData.byMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8" 
              tick={{fontSize: 10, fill: "var(--text-muted)"}}
              tickFormatter={(val) => val.substring(0, 3)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              tickFormatter={(val) => val >= 1000000 ? `$${(val/1000000).toFixed(1)}M` : `$${(val/1000).toFixed(0)}K`} 
              tick={{fontSize: 10}}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: "rgba(255,255,255,0.05)"}} 
              contentStyle={{background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px"}}
              formatter={(val) => formatCurrency(val)}
              labelStyle={{color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem'}}
            />
            <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
            {reportData.byCompany && reportData.byCompany.map((c, index) => (
              <Bar 
                key={c.name} 
                dataKey={c.name} 
                stackId="a" 
                fill={getColorForCompany(c.name, index)} 
                radius={index === reportData.byCompany.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{fontSize: '1.3rem', marginBottom: '1rem', marginTop: '1rem'}}>Desglose por Compañía</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem'}}>
        {reportData.byCompany && reportData.byCompany.map((c, idx) => (
          <div key={idx} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: 0}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <div style={{background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%'}}>
                <Award size={20} color={getColorForCompany(c.name, idx)} />
              </div>
              <div style={{fontSize: '1.1rem', fontWeight: 600}}>{c.name}</div>
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)'}}>
              {formatCurrency(c.total)}
            </div>
          </div>
        ))}
        {(!reportData.byCompany || reportData.byCompany.length === 0) && (
          <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '1rem'}}>
            No hay cobranzas registradas aún.
          </div>
        )}
      </div>

    </div>
  );
}
