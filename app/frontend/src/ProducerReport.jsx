import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { User, ArrowLeft, TrendingUp, Building } from "lucide-react";

const COMPANY_COLORS = {
  "DIGNA": "#f97316",       // Naranja
  "SANCOR": "#ef4444",      // Rojo
  "PARANA": "#1e3a8a",      // Azul oscuro
  "BBVA": "#38bdf8",        // Celeste
  "FEDERACION": "#22c55e"   // Verde
};
const DEFAULT_COLORS = ["#8b5cf6", "#f43f5e", "#eab308", "#14b8a6", "#64748b"];

const getColorForCompany = (companyName, index) => {
  if (!companyName) return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const normalized = companyName.trim().toUpperCase();
  for (const key in COMPANY_COLORS) {
    if (normalized.includes(key)) {
      return COMPANY_COLORS[key];
    }
  }
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

const MONTHS_ORDER = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function ProducerReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const url = companyId ? `/api/reports/producer/${id}?companyId=${companyId}` : `/api/reports/producer/${id}`;
    api.get(url)
      .then(res => {
        const data = res.data;
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
  }, [id, companyId]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    return "$ " + Number(val).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const displayedData = useMemo(() => {
    if (!reportData) return null;
    
    let total = reportData.total;
    let byCompany = reportData.byCompany || [];
    let byMonth = reportData.byMonth || [];

    if (selectedMonth) {
      const monthData = byMonth.find(m => m.month === selectedMonth);
      if (monthData) {
        total = monthData.total;
        if (!companyId) {
          byCompany = reportData.byCompany.map(c => ({
            ...c,
            total: monthData[c.name] || 0
          })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
        }
      } else {
        total = 0;
        byCompany = [];
      }
    }

    return { total, byCompany, byMonth };
  }, [reportData, selectedMonth, companyId]);

  if (loading) return <div className="page-title fade-in">Cargando reporte de productor...</div>;
  if (!reportData) return <div className="page-title fade-in">Productor no encontrado.</div>;

  return (
    <div className="fade-in">
      <header className="page-header" style={{display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between"}}>
        <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
          <button 
            className="btn" 
            onClick={() => navigate(-1)}
            style={{padding: "0.5rem", borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-main)"}}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title" style={{marginBottom: 0}}>Reporte Individual</h1>
            <p className="page-subtitle">
              {reportData.company ? `Análisis de rendimiento en ${reportData.company}` : "Análisis de rendimiento global (Todas las compañías)"}
            </p>
          </div>
        </div>
        
        <div>
          <select 
            className="form-select" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ minWidth: "200px" }}
          >
            <option value="">Todos los Meses (Año Actual)</option>
            {reportData.byMonth.map(m => (
              <option key={m.month} value={m.month}>{m.month}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card stat-card delay-1">
          <div className="stat-title"><User size={16} style={{display:"inline", marginRight: "8px"}} /> Productor</div>
          <div className="stat-value" style={{fontSize: "1.5rem"}}>{reportData.producer}</div>
        </div>
        <div className="glass-card stat-card delay-2">
          <div className="stat-title">
            <TrendingUp size={16} style={{display:"inline", marginRight: "8px"}} /> 
            {selectedMonth ? `Recaudado en ${selectedMonth}` : "Total Recaudado (Año en curso)"}
          </div>
          <div className="stat-value" style={{color: "var(--success)"}}>{formatCurrency(displayedData.total)}</div>
        </div>
      </div>

      {!companyId && displayedData.byCompany.length > 0 && (
        <div className="data-table-container fade-in delay-3" style={{ marginTop: "2rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--text-main)", fontSize: "1.1rem", padding: "0 1rem" }}>
            <Building size={18} style={{display:"inline", marginRight: "8px", verticalAlign: "middle"}} />
            Desglose por Compañía {selectedMonth ? `(${selectedMonth})` : ""}
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compañía</th>
                  <th style={{textAlign: "right"}}>Total Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.byCompany.map((c, index) => (
                  <tr key={index}>
                    <td style={{fontWeight: "500", display: "flex", alignItems: "center", gap: "8px"}}>
                      <span style={{width: "12px", height: "12px", borderRadius: "50%", background: getColorForCompany(c.name, index), display: "inline-block"}}></span>
                      {c.name}
                    </td>
                    <td style={{textAlign: "right", color: "var(--success)", fontWeight: "600"}}>
                      {formatCurrency(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card chart-card fade-in delay-3" style={{marginTop: "2rem"}}>
        <h3 style={{marginBottom: "1.5rem", fontWeight: "600"}}>Cobranzas por Mes</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={reportData.byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8" 
              tickFormatter={(value) => {
                const monthData = reportData.byMonth.find(d => d.month === value);
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
            
            {companyId ? (
              <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} name={reportData.company} />
            ) : (
              reportData.byCompany && reportData.byCompany.map((c, index) => (
                <Bar 
                  key={c.name} 
                  dataKey={c.name} 
                  stackId="a" 
                  fill={getColorForCompany(c.name, index)} 
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
