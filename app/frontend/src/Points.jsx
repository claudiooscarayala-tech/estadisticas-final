import React, { useEffect, useState } from "react";
import api from "./api";
import { Gift, Award } from "lucide-react";

const MONTHS_ORDER = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Points() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProducerId, setSelectedProducerId] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get("/api/points")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedProducerId) {
      setHistoryLoading(true);
      api.get(`/api/store/producer-history/${selectedProducerId}`)
        .then(res => setHistory(res.data))
        .catch(err => console.error(err))
        .finally(() => setHistoryLoading(false));
    } else {
      setHistory([]);
    }
  }, [selectedProducerId]);

  if (loading) return <div className="page-title fade-in">Cargando puntos...</div>;

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">Puntos Ganados</h1>
        <p className="page-subtitle">Sistema de recompensas para productores (1 punto = 0.01% recaudado)</p>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card stat-card delay-1">
          <div className="stat-title"><Gift size={16} style={{display:"inline", marginRight: "8px"}} /> Puntos Totales Repartidos</div>
          <div className="stat-value" style={{color: "var(--accent)"}}>{data.globalTotalPoints.toLocaleString("es-AR")} pts</div>
        </div>
        <div className="glass-card stat-card delay-2">
          <div className="stat-title"><Award size={16} style={{display:"inline", marginRight: "8px"}} /> Productor Destacado</div>
          <div className="stat-value" style={{fontSize: "1.5rem", color: "var(--success)"}}>
            {data.topProducer ? data.topProducer.name : "-"}
          </div>
          <div style={{fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem"}}>
            {data.topProducer ? `${data.topProducer.totalPoints.toLocaleString("es-AR")} puntos` : ""}
          </div>
        </div>
      </div>

      <div className="glass-card fade-in delay-3" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--text-main)", fontSize: "1.1rem" }}>Estado de Cuenta por Productor</h3>
        <select 
          className="form-select" 
          style={{width: "100%", maxWidth: "400px", marginBottom: "1.5rem"}} 
          value={selectedProducerId} 
          onChange={e => setSelectedProducerId(e.target.value)}
        >
          <option value="">Selecciona un Productor...</option>
          {data.producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {selectedProducerId && (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Forma de Pago</th>
                  <th style={{textAlign: "right"}}>Movimiento</th>
                  <th style={{textAlign: "right"}}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan="5" style={{textAlign: "center", padding: "2rem"}}>Cargando historial...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: "center", padding: "2rem"}}>No hay movimientos registrados.</td></tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>
                        {new Date(h.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{fontWeight: "500"}}>
                        {h.type === 'income' ? <span style={{color: "#10b981", marginRight: "0.5rem"}}>↓</span> : <span style={{color: "#ef4444", marginRight: "0.5rem"}}>↑</span>}
                        {h.description}
                      </td>
                      <td style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>
                        {h.payment_type === 'mixed' ? 'Mixto' : h.payment_type === 'full_points' ? 'Solo Puntos' : h.payment_type === 'full_mp' ? 'Mercado Pago' : '-'}
                      </td>
                      <td style={{textAlign: "right", color: h.type === 'income' ? "#10b981" : "#ef4444", fontWeight: "600"}}>
                        {h.type === 'income' ? '+' : '-'}{h.points.toLocaleString("es-AR")}
                      </td>
                      <td style={{textAlign: "right", fontWeight: "700", color: "var(--accent)"}}>
                        {h.balance.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="data-table-container fade-in delay-3">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Productor</th>
                {MONTHS_ORDER.map(m => (
                  <th key={m} style={{textAlign: "center"}}>{m.substring(0,3)}</th>
                ))}
                <th style={{textAlign: "right", color: "var(--accent)"}}>Total Anual</th>
              </tr>
            </thead>
            <tbody>
              {data.producers.map((p, index) => (
                <tr key={p.id}>
                  <td style={{fontWeight: "500", whiteSpace: "nowrap"}}>{p.name}</td>
                  {MONTHS_ORDER.map(m => (
                    <td key={m} style={{textAlign: "center", color: "var(--text-muted)"}}>
                      {p.months[m] ? p.months[m].toLocaleString("es-AR") : "-"}
                    </td>
                  ))}
                  <td style={{textAlign: "right", color: "var(--success)", fontWeight: "600"}}>
                    {p.totalPoints.toLocaleString("es-AR")} pts
                  </td>
                </tr>
              ))}
              {data.producers.length === 0 && (
                <tr>
                  <td colSpan={14} style={{textAlign: "center", padding: "2rem"}}>No hay datos disponibles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
