import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { ShoppingCart, Star, Search } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

export default function Store() {
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [selectedProducerId, setSelectedProducerId] = useState("");
  const [producerPoints, setProducerPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const orderId = urlParams.get('order_id');

    if (status === 'success') {
      if (orderId) {
        api.put(`/api/store/orders/${orderId}/confirm-mp`)
          .then(() => {
            toast.success('¡Pago realizado con éxito! Tu producto está en camino.');
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
          })
          .catch(() => toast.error('Error al confirmar el pago en el sistema.'));
      } else {
        toast.success('¡Pago realizado con éxito! Tu producto está en camino.');
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'failure') {
      toast.error('El pago no pudo ser procesado.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchData = async () => {
      try {
        const [prodRes, ptsRes] = await Promise.all([
          api.get("/api/store/products"),
          api.get("/api/points")
        ]);
        setProducts(prodRes.data);
        setProducers(ptsRes.data.producers);
      } catch (err) {
        toast.error("Error al cargar la tienda");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update points when producer is selected
  useEffect(() => {
    if (selectedProducerId) {
      const p = producers.find(p => p.id.toString() === selectedProducerId);
      if (p) {
        // Obtenemos los gastos previos
        api.get(`/api/store/products`) // Just to ping, actually we should get balance from backend but let's approximate or just fetch order history
          // The backend /api/store/orders endpoint handles verification, so here we just show the points from the /api/points endpoint.
          // Note: If they spent points, this would need a fresh endpoint to get actual balance. We'll show total points earned for now as simulation.
          // For a robust system, we would need a specific GET /api/store/balance/:producer_id. 
          // For now, we just show their total earned points as a guide.
        setProducerPoints(p.totalPoints);
      }
    } else {
      setProducerPoints(0);
    }
  }, [selectedProducerId, producers]);

  const handleExchange = async (product, paymentType = "full_points") => {
    if (!selectedProducerId) {
      toast.error("Selecciona un Productor simulado primero");
      return;
    }
    
    const requiredPoints = paymentType === "mixed" ? product.price_points_mixed : product.price_points;

    if (producerPoints < requiredPoints) {
      toast.error("Puntos insuficientes");
      return;
    }

    const toastId = toast.loading("Procesando canje...");
    try {
      await api.post("/api/store/orders", {
        producer_id: selectedProducerId,
        product_id: product.id,
        payment_type: paymentType
      });
      
      toast.success(`¡Canjeaste ${product.name} con éxito!`, { id: toastId });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setProducerPoints(prev => prev - requiredPoints);
      setProducts(prev => prev.map(p => p.id === product.id ? {...p, stock: p.stock - 1} : p));
      setSelectedProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al realizar el canje", { id: toastId });
    }
  };

  const handleBuy = async (product, paymentType = "full_mp") => {
    if (!selectedProducerId) {
      toast.error("Selecciona un Productor simulado primero");
      return;
    }

    const toastId = toast.loading("Conectando con Mercado Pago...");
    try {
      const res = await api.post("/api/store/checkout", {
        producer_id: selectedProducerId,
        product_id: product.id,
        payment_type: paymentType
      });
      
      toast.dismiss(toastId);
      window.location.href = res.data.init_point;
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al procesar el pago", { id: toastId });
    }
  };

  if (loading) return <div className="fade-in">Cargando Tienda...</div>;

  // Group products by category
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="fade-in" style={{ paddingBottom: "3rem" }}>
      {/* Banner */}
      <div style={{
        background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)",
        borderRadius: "1rem",
        padding: "2.5rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
      }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Descubrí tu tienda COA</h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: "1.5rem" }}>Todo eso que buscás podés conseguirlo. ¡Usá tus puntos!</p>
          <span style={{
            background: "rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "2rem", fontWeight: "600",
            backdropFilter: "blur(10px)"
          }}>
            Ser parte tiene sus beneficios
          </span>
        </div>
        <div style={{
          background: "var(--bg-card)",
          padding: "1.5rem",
          borderRadius: "1rem",
          minWidth: "300px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)"
        }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem", color: "var(--text-muted)" }}>Simulador de Usuario</h3>
          <select className="form-select" style={{width: "100%", marginBottom: "1rem"}} value={selectedProducerId} onChange={e => setSelectedProducerId(e.target.value)}>
            <option value="">Selecciona un Productor...</option>
            {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>Puntos Disponibles:</span>
            <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--accent)" }}>
              {producerPoints.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      {/* Catalog */}
      {categories.length === 0 ? (
         <div style={{textAlign: "center", padding: "3rem", color: "var(--text-muted)"}}>No hay productos en la tienda aún.</div>
      ) : categories.map((cat, idx) => (
        <div key={cat} style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: "500" }}>{cat}</h2>
            <span style={{ color: "var(--accent)", fontSize: "0.9rem", cursor: "pointer" }}>Ver más {">"}</span>
          </div>
          
          <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: "1rem" }}>
            {products.filter(p => p.category === cat).map(product => {
              const isAffordable = selectedProducerId && producerPoints >= product.price_points;
              
              return (
                <div key={product.id} className="glass-card" style={{ 
                  minWidth: "234px", 
                  width: "234px", 
                  padding: "0", 
                  display: "flex", 
                  flexDirection: "column",
                  overflow: "hidden",
                  backgroundColor: "#ffffff", // Tarjetas blancas como el e-commerce
                  color: "#1e293b"
                }}>
                  <div 
                    style={{ height: "180px", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img src={`http://localhost:3001${product.image_url}`} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} />
                  </div>
                  
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, borderTop: "1px solid #f1f5f9" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: "500", marginBottom: "1rem", flex: 1, color: "#334155" }}>
                      {product.name}
                    </h4>

                    {/* Mostrar la Opción 1 (Mixta) en la tarjeta */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                        $ {product.price_pesos_mixed?.toLocaleString("es-AR") || 0}
                      </span>
                      <span style={{ fontSize: "0.9rem", color: "#f97316", fontWeight: "600" }}>
                        + {product.price_points_mixed?.toLocaleString("es-AR") || 0} puntos
                      </span>
                    </div>
                    
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                      Stock disponible: <strong>{product.stock}</strong>
                    </div>

                    <button 
                      onClick={() => setSelectedProduct(product)}
                      disabled={product.stock <= 0}
                      style={{
                        background: product.stock <= 0 ? "#cbd5e1" : "#3b82f6",
                        color: "white",
                        border: "none",
                        padding: "0.75rem",
                        borderRadius: "0.25rem",
                        fontWeight: "600",
                        cursor: product.stock <= 0 ? "not-allowed" : "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {product.stock <= 0 ? "Sin Stock" : "Ver Opciones de Pago"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal de Producto */}
      {selectedProduct && createPortal(
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff", color: "#1e293b", width: "100%", maxWidth: "800px", padding: "2rem",
            borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            position: "relative", display: "flex", gap: "2rem", flexWrap: "wrap"
          }}>
            <button 
              onClick={() => setSelectedProduct(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "2rem", lineHeight: 1 }}
            >
              &times;
            </button>
            
            <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center", alignItems: "center", background: "#fff", borderRadius: "0.5rem", padding: "1rem" }}>
              <img src={`http://localhost:3001${selectedProduct.image_url}`} alt={selectedProduct.name} style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }} />
            </div>

            <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>{selectedProduct.name}</h2>
              <p style={{ color: "#64748b", marginBottom: "2rem" }}>Stock disponible: {selectedProduct.stock}</p>
              
              <h4 style={{ marginBottom: "1rem", color: "#334155" }}>Elige tu forma de pago:</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Opción 1: Mixto */}
                <button 
                  onClick={() => {
                    if (producerPoints < (selectedProduct.price_points_mixed || 0)) {
                      toast.error("Puntos insuficientes para pago mixto");
                      return;
                    }
                    handleBuy(selectedProduct, "mixed");
                  }}
                  className="btn"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "linear-gradient(90deg, #4f46e5, #009ee3)", border: "none" }}
                >
                  <span style={{ fontWeight: "600", color: "white" }}>Pago Mixto</span>
                  <span style={{ color: "white", fontSize: "0.9rem" }}>
                    $ {Number(selectedProduct.price_pesos_mixed || 0).toLocaleString("es-AR")} + {Number(selectedProduct.price_points_mixed || 0).toLocaleString("es-AR")} pts
                  </span>
                </button>

                {/* Opción 2: Solo Mercado Pago */}
                <button 
                  onClick={() => handleBuy(selectedProduct, "full_mp")}
                  className="btn"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#009ee3", border: "none" }}
                >
                  <span style={{ fontWeight: "600", color: "white" }}>Solo Mercado Pago</span>
                  <span style={{ color: "white", fontSize: "0.9rem" }}>
                    $ {Number(selectedProduct.price_pesos || 0).toLocaleString("es-AR")}
                  </span>
                </button>

                {/* Opción 3: Solo Puntos */}
                <button 
                  onClick={() => {
                    if (producerPoints < (selectedProduct.price_points || 0)) {
                      toast.error("Puntos insuficientes");
                      return;
                    }
                    handleExchange(selectedProduct, "full_points");
                  }}
                  className="btn"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#10b981", border: "none", opacity: producerPoints < (selectedProduct.price_points || 0) ? 0.6 : 1 }}
                >
                  <span style={{ fontWeight: "600", color: "white" }}>Solo Puntos</span>
                  <span style={{ color: "white", fontSize: "0.9rem" }}>
                    {Number(selectedProduct.price_points || 0).toLocaleString("es-AR")} pts
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
