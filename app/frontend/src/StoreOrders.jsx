import React, { useState, useEffect } from "react";
import api from "./api";
import { Package, CheckCircle, Clock, CreditCard, DollarSign, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/store/orders");
      setOrders(res.data);
    } catch (err) {
      toast.error("Error al cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeliver = async (id) => {
    if (!window.confirm("¿Confirmas que este producto ya fue entregado al productor?")) return;
    
    try {
      await api.put(`/api/store/orders/${id}/deliver`);
      toast.success("Pedido marcado como Entregado");
      fetchOrders();
    } catch (err) {
      toast.error("Error al actualizar el estado");
    }
  };

  if (loading) return <div className="fade-in">Cargando pedidos...</div>;

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">Gestión de Entregas</h1>
        <p className="page-subtitle">Administra los canjes solicitados por los productores</p>
      </header>

      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        <div className="glass-card stat-card delay-1">
          <div className="stat-title"><Activity size={16} style={{display:"inline", marginRight: "8px"}} /> Puntos Consumidos</div>
          <div className="stat-value" style={{color: "var(--accent)"}}>
            {orders.reduce((acc, o) => acc + (o.points_spent || 0), 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
          </div>
        </div>
        <div className="glass-card stat-card delay-2">
          <div className="stat-title"><DollarSign size={16} style={{display:"inline", marginRight: "8px"}} /> Dinero Recaudado (MP)</div>
          <div className="stat-value" style={{color: "#10b981"}}>
            $ {orders.reduce((acc, o) => acc + (o.pesos_spent || 0), 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="glass-card stat-card delay-3">
          <div className="stat-title"><CreditCard size={16} style={{display:"inline", marginRight: "8px"}} /> Método Preferido</div>
          <div className="stat-value" style={{fontSize: "1.2rem"}}>
            {(() => {
              if (orders.length === 0) return "-";
              const counts = { full_points: 0, mixed: 0, full_mp: 0 };
              orders.forEach(o => counts[o.payment_type || 'full_points']++);
              const max = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
              return max === 'mixed' ? 'Pago Mixto' : max === 'full_points' ? 'Solo Puntos' : 'Mercado Pago';
            })()}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Package size={20} color="var(--accent)" /> Historial de Canjes
        </h3>
        
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Productor</th>
                <th>Producto Solicitado</th>
                <th>Forma de Pago</th>
                <th>Puntos Gastados</th>
                <th>Pesos (MP)</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{textAlign: "center", padding: "2rem", color: "var(--text-muted)"}}>
                    No hay canjes registrados aún.
                  </td>
                </tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>
                    {new Date(o.created_at).toLocaleDateString("es-AR", { 
                      year: 'numeric', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  <td style={{fontWeight: "600"}}>{o.producer_name}</td>
                  <td>
                    <div style={{display: "flex", alignItems: "center", gap: "0.75rem"}}>
                      <img src={`${o.image_url}`} alt={o.product_name} style={{width: "32px", height: "32px", objectFit: "contain", background: "white", borderRadius: "4px"}} />
                      <span>{o.product_name}</span>
                    </div>
                  </td>
                  <td style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>
                    {o.payment_type === 'mixed' ? 'Mixto' : o.payment_type === 'full_points' ? 'Solo Puntos' : o.payment_type === 'full_mp' ? 'Mercado Pago' : 'Solo Puntos'}
                  </td>
                  <td style={{color: "var(--accent)", fontWeight: "600"}}>{(o.points_spent || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts</td>
                  <td style={{color: "#10b981", fontWeight: "600"}}>$ {(o.pesos_spent || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td>
                    {o.status === "delivered" ? (
                      <span style={{background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "0.25rem"}}>
                        <CheckCircle size={14} /> Entregado
                      </span>
                    ) : (
                      <span style={{background: "rgba(234, 179, 8, 0.2)", color: "#facc15", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "0.25rem"}}>
                        <Clock size={14} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td>
                    {o.status !== "delivered" && (
                      <button 
                        onClick={() => handleDeliver(o.id)}
                        style={{
                          background: "var(--accent)", color: "white", border: "none", 
                          padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer",
                          fontWeight: "500", fontSize: "0.85rem"
                        }}
                      >
                        Marcar Entregado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
