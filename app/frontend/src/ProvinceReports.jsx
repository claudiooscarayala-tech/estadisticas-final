import React, { useState, useEffect } from "react";
import api from "./api";
import { Map, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);
};

export default function ProvinceReports() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/reports/provinces?year=${selectedYear}`);
      setData(res.data);
    } catch (error) {
      toast.error("Error al cargar las estadísticas por provincia");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCollection = data.reduce((sum, item) => sum + item.totalCollection, 0);
  const totalProducers = data.reduce((sum, item) => sum + item.producerCount, 0);

  // Modern color palette for chart
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="fade-in">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '2rem' }}>
            <Map size={28} color="var(--accent)" />
            Por Provincia
          </h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Estadísticas y cobranzas totales agrupadas geográficamente
          </p>
        </div>
        
        <select 
          className="form-select" 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ padding: '0.5rem 1rem', width: 'auto' }}
        >
          {[2024, 2025, 2026, 2027].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-card stat-card delay-1" style={{ gridColumn: 'span 6', padding: '2rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'var(--accent-light)', padding: '1.5rem', borderRadius: '50%' }}>
            <Users size={32} color="var(--accent)" />
          </div>
          <div>
            <div className="stat-title">Total Productores en {selectedYear}</div>
            <div className="stat-value">{totalProducers}</div>
          </div>
        </div>
        <div className="glass-card stat-card delay-2" style={{ gridColumn: 'span 6', padding: '2rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
            <TrendingUp size={32} color="var(--success)" />
          </div>
          <div>
            <div className="stat-title">Recaudación Total ({selectedYear})</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalCollection)}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card delay-3" style={{ gridColumn: 'span 5', maxHeight: '500px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Detalle por Provincia</h3>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Provincia</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Productores</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Cobranza</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{item.province}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                        {item.producerCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>
                      {formatCurrency(item.totalCollection)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay datos para el año {selectedYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-card delay-3" style={{ gridColumn: 'span 7', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Cobranza por Provincia</h3>
          {isLoading ? (
            <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Cargando gráfico...
            </div>
          ) : data.length > 0 ? (
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="province" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8' }} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="totalCollection" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No hay datos para graficar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
