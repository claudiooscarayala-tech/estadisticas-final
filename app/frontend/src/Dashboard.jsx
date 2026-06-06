import React, { useEffect, useState } from "react";
import api from "./api";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, Award, Building } from "lucide-react";
import logoCoa from "./assets/logo-coa.png";

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
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reportsRes, bdaysRes] = await Promise.all([
        api.get("/api/reports"),
        api.get("/api/birthdays/today")
      ]);
      
      const reportData = reportsRes.data;
      const MONTHS_ORDER = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      
      if (reportData && reportData.byMonth) {
        reportData.byMonth.sort((a, b) => {
          return MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month);
        });
      }
      
      setData(reportData);
      setBirthdays(bdaysRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBirthdays = async () => {
    if (window.confirm("¿Seguro que deseas forzar el envío de mensajes a los cumpleañeros de hoy? Esto enviará un WhatsApp por Whapi a todos los que no lo hayan recibido hoy.")) {
      setIsTriggering(true);
      try {
        await api.post("/api/birthdays/trigger");
        fetchDashboardData();
      } catch (error) {
        console.error(error);
      } finally {
        setIsTriggering(false);
      }
    }
  };

  if (loading) return <div className="page-title fade-in">Cargando reporte...</div>;

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    return "$ " + Number(val).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fade-in">
      <header style={{
        background: "linear-gradient(90deg, var(--bg-card) 0%, rgba(42, 121, 198, 0.2) 100%)",
        borderRadius: "1rem",
        padding: "2rem",
        marginBottom: "2rem",
        border: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem"
      }}>
        <div style={{
          background: "#ffffff",
          padding: "1rem",
          borderRadius: "0.75rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <img src={logoCoa} alt="COA Logo" style={{ width: "60px", height: "auto", display: "block" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: "0 0 0.25rem 0", color: "var(--text-main)" }}>
            COA Asesores de Seguros
          </h1>
          <p style={{ color: "var(--accent)", fontSize: "1.1rem", fontWeight: "500", margin: "0 0 0.5rem 0" }}>
            "El valor de compartir"
          </p>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
            Resumen de cobranzas y gestión de equipo
          </p>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Stats */}
        <div className="glass-card stat-card delay-1">
          <div className="stat-title"><TrendingUp size={16} style={{display:"inline", marginRight: "8px"}} /> Total Recaudado</div>
          <div className="stat-value">{formatCurrency(data.total)}</div>
        </div>
        <div className="glass-card stat-card delay-2">
          <div className="stat-title"><Building size={16} style={{display:"inline", marginRight: "8px"}} /> Mejor Compañía</div>
          <div className="stat-value" style={{fontSize: "1.5rem"}}>
            {data.byCompany.length > 0 ? data.byCompany[0].name : "-"}
          </div>
        </div>
        <div className="glass-card stat-card delay-3">
          <div className="stat-title"><Award size={16} style={{display:"inline", marginRight: "8px"}} /> Top Productor</div>
          <div className="stat-value" style={{fontSize: "1.2rem"}}>
            {data.byProducer.length > 0 ? data.byProducer[0].name : "-"}
          </div>
        </div>

        {/* Cumpleaños de Hoy Widget */}
        <div className="glass-card delay-1" style={{ gridColumn: 'span 12', background: 'linear-gradient(to right, rgba(236, 72, 153, 0.05), transparent)' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <span style={{ fontSize: '1.5rem' }}>🎂</span> Cumpleaños de Hoy
            </h3>
            <button 
              onClick={handleTriggerBirthdays} 
              disabled={isTriggering}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                cursor: isTriggering ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                opacity: isTriggering ? 0.5 : 1
              }}
            >
              {isTriggering ? 'Procesando...' : 'Reintentar envíos'}
            </button>
          </div>
          
          {birthdays.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay cumpleaños registrados para el día de hoy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {birthdays.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <strong>{b.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>{b.phone || 'Sin número'}</span>
                  </div>
                  <div>
                    {b.status === 'sent' ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
                        Mensaje Enviado
                      </span>
                    ) : b.status === 'failed' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', display: 'inline-block' }}></span>
                          Error al enviar
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: '200px', textAlign: 'right', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                          {b.message || "Error desconocido"}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }}></span>
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Chart */}
        <div className="glass-card chart-card delay-1" style={{marginTop: "1.5rem"}}>
          <h3 style={{marginBottom: "1.5rem", fontWeight: "600"}}>Cobranzas por Mes</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8" 
                tickFormatter={(value) => {
                  const monthData = data.byMonth.find(d => d.month === value);
                  return monthData ? formatCurrency(monthData.total) : "";
                }}
                angle={0}
                textAnchor="middle"
                height={40}
                tick={{fontSize: 11, fill: "var(--text-muted)"}}
              />
              <YAxis 
                stroke="#94a3b8" 
                width={80}
                tickFormatter={(val) => val >= 1000000 ? `$${(val/1000000).toFixed(1)}M` : `$${(val/1000).toFixed(0)}K`} 
              />
              <Tooltip 
                cursor={{fill: "rgba(255,255,255,0.05)"}} 
                contentStyle={{background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px"}}
                formatter={(val) => formatCurrency(val)}
              />
              <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
              {data.byCompany && data.byCompany.map((c, index) => (
                <Bar 
                  key={c.name} 
                  dataKey={c.name} 
                  stackId="a" 
                  fill={getColorForCompany(c.name, index)} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side Charts */}
        <div className="glass-card side-chart-card delay-2" style={{marginTop: "1.5rem"}}>
          <h3 style={{marginBottom: "1.5rem", fontWeight: "600", textAlign: "center"}}>Participación por Compañía</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byCompany}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="total"
                nameKey="name"
              >
                {data.byCompany.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForCompany(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px"}}
                formatter={(val) => formatCurrency(val)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "1rem"}}>
            {data.byCompany.slice(0,4).map((c, i) => (
               <span key={i} style={{fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px"}}>
                  <span style={{width: "10px", height: "10px", borderRadius: "50%", background: getColorForCompany(c.name, i)}}></span>
                  {c.name}
               </span>
            ))}
          </div>
        </div>

      </div>

      {/* Top Producers Table */}
      <div className="data-table-container fade-in delay-3">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Productor</th>
              <th style={{textAlign: "right"}}>Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            {data.byProducer.map((p, index) => (
              <tr key={index}>
                <td style={{color: "var(--text-muted)"}}>#{index + 1}</td>
                <td style={{fontWeight: "500"}}>
                  <Link to={`/productor/${p.id}`} style={{color: "var(--accent)", textDecoration: "none"}} onMouseOver={(e) => e.target.style.textDecoration="underline"} onMouseOut={(e) => e.target.style.textDecoration="none"}>
                    {p.name}
                  </Link>
                </td>
                <td style={{textAlign: "right", color: "var(--success)", fontWeight: "600"}}>
                  {formatCurrency(p.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
