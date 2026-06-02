import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { 
  ShoppingCart, 
  Star, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Shield, 
  Truck, 
  RotateCcw, 
  ShoppingBag 
} from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

export default function Store() {
  const [products, setProducts] = useState([]);
  const [producers, setProducers] = useState([]);
  const [selectedProducerId, setSelectedProducerId] = useState("");
  const [producerPoints, setProducerPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Shopping Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("store_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && item.product && typeof item.quantity === 'number');
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Detail Modal internal state
  const [detailQty, setDetailQty] = useState(1);
  const [detailPaymentType, setDetailPaymentType] = useState("mixed");
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem("store_cart", JSON.stringify(cart));
  }, [cart]);

  // Reset modal state when product changes
  useEffect(() => {
    if (selectedProduct) {
      setDetailQty(1);
      setDetailPaymentType("mixed");
      setSelectedThumbnailIndex(0);
    }
  }, [selectedProduct]);

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
        setProducerPoints(p.totalPoints);
      }
    } else {
      setProducerPoints(0);
    }
  }, [selectedProducerId, producers]);

  // Cart operations
  const addToCart = (product, paymentType, quantity) => {
    if (!selectedProducerId) {
      toast.error("Selecciona un Productor simulado primero");
      return;
    }

    const pointsPerItem = paymentType === "full_points" 
      ? product.price_points 
      : paymentType === "mixed" 
        ? product.price_points_mixed 
        : 0;

    const cartItemId = `${product.id}_${paymentType}`;
    const existingItem = cart.find(item => item.id === cartItemId);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const newQty = existingQty + quantity;

    if (newQty > product.stock) {
      toast.error(`No hay suficiente stock. Stock disponible: ${product.stock}`);
      return;
    }

    // Check total points for this addition
    const totalPointsCostOfCart = cart.reduce((acc, item) => {
      const itemPoints = item.payment_type === "full_points"
        ? item.product.price_points
        : item.payment_type === "mixed"
          ? item.product.price_points_mixed
          : 0;
      return acc + (itemPoints * item.quantity);
    }, 0);

    const addedPointsCost = pointsPerItem * quantity;
    if (producerPoints < (totalPointsCostOfCart + addedPointsCost)) {
      toast.error("No tienes suficientes puntos disponibles para agregar este item");
      return;
    }

    if (existingItem) {
      setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item));
    } else {
      setCart(prev => [...prev, {
        id: cartItemId,
        product,
        payment_type: paymentType,
        quantity
      }]);
    }

    toast.success(`${product.name} agregado al carrito!`);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const item = cart.find(i => i.id === cartItemId);
    if (!item) return;

    if (newQty > item.product.stock) {
      toast.error(`Solo hay ${item.product.stock} unidades disponibles.`);
      return;
    }

    const otherItemsPointsCost = cart
      .filter(i => i.id !== cartItemId)
      .reduce((acc, i) => {
        const itemPoints = i.payment_type === "full_points"
          ? i.product.price_points
          : i.payment_type === "mixed"
            ? i.product.price_points_mixed
            : 0;
        return acc + (itemPoints * i.quantity);
      }, 0);

    const currentItemPointsPerUnit = item.payment_type === "full_points"
      ? item.product.price_points
      : item.payment_type === "mixed"
        ? item.product.price_points_mixed
        : 0;

    const newPointsCost = otherItemsPointsCost + (currentItemPointsPerUnit * newQty);
    if (producerPoints < newPointsCost) {
      toast.error("Puntos insuficientes para esta cantidad");
      return;
    }

    setCart(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity: newQty } : i));
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(i => i.id !== cartItemId));
    toast.success("Producto eliminado del carrito");
  };

  const handleCartCheckout = async () => {
    if (!selectedProducerId) {
      toast.error("Selecciona un Productor simulado primero");
      return;
    }

    const pointsItems = cart.filter(i => i.payment_type === "full_points");
    const mpItems = cart.filter(i => i.payment_type === "full_mp" || i.payment_type === "mixed");

    const totalPointsRequired = cart.reduce((acc, item) => {
      const itemPoints = item.payment_type === "full_points"
        ? item.product.price_points
        : item.payment_type === "mixed"
          ? item.product.price_points_mixed
          : 0;
      return acc + (itemPoints * item.quantity);
    }, 0);

    if (producerPoints < totalPointsRequired) {
      toast.error("Saldo de puntos insuficiente para realizar esta compra");
      return;
    }

    // 1. Process points-only items sequentially
    if (pointsItems.length > 0) {
      const toastId = toast.loading("Procesando canjes de puntos...");
      try {
        for (const item of pointsItems) {
          for (let q = 0; q < item.quantity; q++) {
            await api.post("/api/store/orders", {
              producer_id: selectedProducerId,
              product_id: item.product.id,
              payment_type: "full_points"
            });
          }
        }
        toast.success("Canjes de puntos procesados con éxito!", { id: toastId });
        
        // Remove points items from cart state
        setCart(prev => prev.filter(i => i.payment_type !== "full_points"));
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al procesar el canje de puntos", { id: toastId });
        return; // stop execution
      }
    }

    // 2. Process MP or Mixed items if any
    if (mpItems.length > 0) {
      const toastIdMp = toast.loading("Conectando con Mercado Pago...");
      try {
        const cartItemsPayload = mpItems.map(item => ({
          product_id: item.product.id,
          payment_type: item.payment_type,
          quantity: item.quantity
        }));

        const res = await api.post("/api/store/checkout", {
          producer_id: selectedProducerId,
          cart_items: cartItemsPayload,
          source: "desktop"
        });
        
        toast.dismiss(toastIdMp);
        // Clear cart since orders are created in backend with status 'pending_payment'
        setCart([]);
        window.location.href = res.data.init_point;
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al procesar el pago con Mercado Pago", { id: toastIdMp });
      }
    } else {
      // If there were only points items, checkout is complete!
      setCart([]);
      setIsCartOpen(false);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      
      // Reload products & points
      try {
        const [prodRes, ptsRes] = await Promise.all([
          api.get("/api/store/products"),
          api.get("/api/points")
        ]);
        setProducts(prodRes.data);
        setProducers(ptsRes.data.producers);
      } catch (err) {
        console.error("Error reloading store data", err);
      }
    }
  };

  const getThumbnails = (product) => {
    if (!product) return [];
    const list = [{ src: product.image_url, style: { objectFit: "contain" } }];
    if (product.image_url_2) {
      list.push({ src: product.image_url_2, style: { objectFit: "contain" } });
    }
    if (product.image_url_3) {
      list.push({ src: product.image_url_3, style: { objectFit: "contain" } });
    }
    
    // If only 1 image exists, generate crop/zoom thumbnails as fallback
    if (list.length === 1) {
      const url = product.image_url;
      return [
        { src: url, style: { objectFit: "contain" } },
        { src: url, style: { objectFit: "cover", objectPosition: "center" } },
        { src: url, style: { objectFit: "contain", transform: "scale(1.3)" } },
        { src: url, style: { objectFit: "contain", filter: "contrast(1.15) brightness(1.02)" } }
      ];
    }
    return list;
  };

  const generateDescription = (product) => {
    if (!product) return "";
    const name = product.name;
    const cat = product.category || "Productos";

    if (cat.toLowerCase().includes("blanco") || cat.toLowerCase().includes("hogar") || name.toLowerCase().includes("frazada") || name.toLowerCase().includes("sábana") || name.toLowerCase().includes("manta")) {
      return `Esta pieza exclusiva combina elegancia y el máximo confort térmico, diseñada específicamente para adaptarse a tu estilo de vida. Fabricada con materiales seleccionados de la más alta calidad, ofrece un tacto sumamente suave y acogedor.

Detalles del Producto:
• Composición Premium: Microfibra y tejidos sintéticos de alta densidad.
• Costuras reforzadas en todo el contorno para un acabado duradero y estético.
• Hipoalergénico y de fácil lavado (secado rápido sin perder suavidad).
• Ideal para renovar tu espacio con estilo y calidez.`;
    }
    
    if (cat.toLowerCase().includes("tecnología") || cat.toLowerCase().includes("electrónica") || name.toLowerCase().includes("auricular") || name.toLowerCase().includes("parlante") || name.toLowerCase().includes("reloj")) {
      return `Experimentá el máximo rendimiento y la última tecnología con este producto de alta gama. Diseñado para ofrecer una experiencia intuitiva, cómoda y sumamente eficiente en tu día a día.

Detalles del Producto:
• Componentes de precisión para una calidad de sonido y fidelidad insuperables.
• Conectividad de última generación con óptimo alcance y bajo consumo.
• Batería/Rendimiento de larga duración para acompañarte todo el día.
• Diseño ergonómico y materiales de tacto suave pero resistentes al impacto.`;
    }

    if (cat.toLowerCase().includes("herramientas") || cat.toLowerCase().includes("ferretería") || name.toLowerCase().includes("taladro") || name.toLowerCase().includes("caja")) {
      return `La herramienta definitiva para llevar a cabo tus proyectos con precisión profesional. Fabricada bajo rigurosos estándares de seguridad y resistencia, ofrece potencia y facilidad de uso inigualables.

Detalles del Producto:
• Motor/Estructura de alta durabilidad optimizada para trabajos exigentes.
• Agarre ergonómico antideslizante que previene la fatiga del operario.
• Accesorios incluidos de máxima dureza y compatibilidad.
• Diseño compacto y portátil con estuche de protección premium.`;
    }

    return `Descubrí la combinación perfecta de diseño, funcionalidad y calidad premium con el nuevo ${name}. Seleccionado especialmente para formar parte de la Tienda COA, este artículo cumple con las mayores exigencias de calidad para brindarte una satisfacción garantizada.

Detalles del Producto:
• Materiales certificados de alta resistencia y durabilidad.
• Diseño moderno y elegante que se adapta perfectamente a tus necesidades cotidianas.
• Acabados finos y detalles cuidados en cada uno de sus bordes.
• Garantía oficial y soporte post-compra para tu total tranquilidad.`;
  };

  if (loading) return <div className="fade-in">Cargando Tienda...</div>;

  const categories = [...new Set(products.map(p => p.category))];
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fade-in" style={{ paddingBottom: "3rem" }}>
      {/* Header bar with Cart */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        padding: "0.5rem 0"
      }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)" }}>Tienda COA</h1>
        <button 
          onClick={() => setIsCartOpen(true)}
          style={{
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            padding: "0.75rem 1.25rem",
            borderRadius: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            transition: "all 0.2s",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <ShoppingCart size={20} className="logo-icon" />
          <span>Mi Carrito</span>
          {cartCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

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
          <h2 style={{ fontSize: "2.2rem", fontWeight: "700", marginBottom: "0.5rem", color: "#ffffff" }}>Descubrí tu tienda COA</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: "1.5rem", color: "#ffffff" }}>Todo eso que buscás podés conseguirlo. ¡Usá tus puntos!</p>
          <span style={{
            background: "rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "2rem", fontWeight: "600",
            backdropFilter: "blur(10px)", color: "#ffffff"
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
              {producerPoints.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
              return (
                <div key={product.id} className="glass-card" style={{ 
                  minWidth: "234px", 
                  width: "234px", 
                  padding: "0", 
                  display: "flex", 
                  flexDirection: "column",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  color: "#1e293b"
                }}>
                  <div 
                    style={{ height: "180px", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img 
                      src={`${product.image_url}`} 
                      alt={product.name} 
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.2s" }} 
                      onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} 
                      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} 
                    />
                  </div>
                  
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, borderTop: "1px solid #f1f5f9" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: "500", marginBottom: "1rem", flex: 1, color: "#334155" }}>
                      {product.name}
                    </h4>

                    {/* Mostrar la Opción 1 (Mixta) en la tarjeta */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                        $ {product.price_pesos_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
                      </span>
                      <span style={{ fontSize: "0.9rem", color: "#f97316", fontWeight: "600" }}>
                        + {product.price_points_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0} puntos
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

      {/* Product Detail Modal */}
      {selectedProduct && createPortal(
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff", color: "#1e293b", width: "100%", maxWidth: "1050px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem",
            borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            position: "relative", display: "flex", flexDirection: "column"
          }}>
            {/* Modal Header / Breadcrumbs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  Inicio &gt; {selectedProduct.category} &gt; {selectedProduct.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  SKU: COA-{selectedProduct.id.toString().padStart(4, '0')}
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Top Section: Gallery + Checkout parameters */}
            <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              {/* Left Column: Gallery */}
              <div style={{ flex: "1 1 450px", display: "flex", gap: "1rem" }}>
                {/* Thumbnails list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {getThumbnails(selectedProduct).map((thumb, tIdx) => (
                    <div 
                      key={tIdx}
                      onClick={() => setSelectedThumbnailIndex(tIdx)}
                      style={{
                        width: "60px",
                        height: "60px",
                        border: selectedThumbnailIndex === tIdx ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                        borderRadius: "0.375rem",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px",
                        transition: "all 0.2s"
                      }}
                    >
                      <img 
                        src={thumb.src} 
                        alt={`Vista ${tIdx + 1}`} 
                        style={{ 
                          maxWidth: "100%", 
                          maxHeight: "100%", 
                          ...thumb.style 
                        }} 
                      />
                    </div>
                  ))}
                </div>

                {/* Main Image Container */}
                <div style={{ 
                  flex: 1, 
                  height: "360px", 
                  background: "#f8fafc", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "0.5rem", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  padding: "1rem",
                  overflow: "hidden"
                }}>
                  <img 
                    src={getThumbnails(selectedProduct)[selectedThumbnailIndex]?.src || selectedProduct.image_url} 
                    alt={selectedProduct.name} 
                    style={{ 
                      maxWidth: "100%", 
                      maxHeight: "100%", 
                      transition: "transform 0.3s ease",
                      ...getThumbnails(selectedProduct)[selectedThumbnailIndex]?.style 
                    }} 
                  />
                </div>
              </div>

              {/* Right Column: Title, Prices, Payment radio cards, Qty, Add to Cart */}
              <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                  {selectedProduct.name}
                </h2>

                {/* Simulador de Usuario inside Modal */}
                <div style={{ 
                  marginBottom: "1.25rem", 
                  padding: "1rem", 
                  background: "#f8fafc", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #cbd5e1" 
                }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Simulador de Usuario (PAS)
                  </div>
                  <select 
                    className="form-select" 
                    style={{ 
                      width: "100%", 
                      padding: "0.5rem", 
                      borderRadius: "0.375rem", 
                      border: !selectedProducerId ? "1px solid #ef4444" : "1px solid #cbd5e1", 
                      fontSize: "0.9rem",
                      backgroundColor: "#ffffff",
                      color: "#1e293b",
                      marginBottom: "0.25rem"
                    }} 
                    value={selectedProducerId} 
                    onChange={e => setSelectedProducerId(e.target.value)}
                  >
                    <option value="">Selecciona un Productor...</option>
                    {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {!selectedProducerId ? (
                    <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: "500", marginTop: "0.25rem" }}>
                      * Debes seleccionar un productor para poder agregar items al carrito.
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                      <span style={{ color: "#64748b" }}>Puntos Disponibles:</span>
                      <span style={{ fontWeight: "700", color: "#f97316" }}>
                        {producerPoints.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Price display */}
                <div style={{ marginBottom: "1.5rem" }}>
                  {detailPaymentType === "mixed" && (
                    <div>
                      <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b" }}>
                        $ {selectedProduct.price_pesos_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span style={{ fontSize: "1.2rem", color: "#f97316", fontWeight: "700", marginLeft: "0.5rem" }}>
                        + {selectedProduct.price_points_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                      </span>
                    </div>
                  )}
                  {detailPaymentType === "full_mp" && (
                    <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b" }}>
                      $ {selectedProduct.price_pesos?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  )}
                  {detailPaymentType === "full_points" && (
                    <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#f97316" }}>
                      {selectedProduct.price_points?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                    </span>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Precio final. Stock disponible: <strong>{selectedProduct.stock}</strong>
                  </div>
                </div>

                {/* Radio Card options */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {/* Option 1: Mixed */}
                  <div 
                    onClick={() => setDetailPaymentType("mixed")}
                    style={{
                      border: detailPaymentType === "mixed" ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      backgroundColor: detailPaymentType === "mixed" ? "#eff6ff" : "#ffffff",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <input 
                      type="radio" 
                      checked={detailPaymentType === "mixed"} 
                      onChange={() => setDetailPaymentType("mixed")}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>Pago Mixto</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pesos + Puntos COA</div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "700", fontSize: "0.9rem" }}>
                      ${selectedProduct.price_pesos_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + {selectedProduct.price_points_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                    </div>
                  </div>

                  {/* Option 2: Full MP */}
                  <div 
                    onClick={() => setDetailPaymentType("full_mp")}
                    style={{
                      border: detailPaymentType === "full_mp" ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      backgroundColor: detailPaymentType === "full_mp" ? "#eff6ff" : "#ffffff",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <input 
                      type="radio" 
                      checked={detailPaymentType === "full_mp"} 
                      onChange={() => setDetailPaymentType("full_mp")}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>Solo Pesos</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Mercado Pago</div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "700", fontSize: "0.9rem" }}>
                      ${selectedProduct.price_pesos?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  {/* Option 3: Full Points */}
                  <div 
                    onClick={() => {
                      const isAffordable = !selectedProducerId || producerPoints >= (selectedProduct.price_points || 0);
                      if (!isAffordable) {
                        toast.error("Saldo de puntos insuficiente para esta opción.");
                        return;
                      }
                      setDetailPaymentType("full_points");
                    }}
                    style={{
                      border: detailPaymentType === "full_points" ? "2px solid #f97316" : "1px solid #e2e8f0",
                      backgroundColor: detailPaymentType === "full_points" ? "#fff7ed" : "#ffffff",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      cursor: (!selectedProducerId || producerPoints >= (selectedProduct.price_points || 0)) ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      opacity: (!selectedProducerId || producerPoints >= (selectedProduct.price_points || 0)) ? 1 : 0.5,
                      transition: "all 0.2s"
                    }}
                  >
                    <input 
                      type="radio" 
                      checked={detailPaymentType === "full_points"} 
                      onChange={() => {}}
                      disabled={selectedProducerId && producerPoints < (selectedProduct.price_points || 0)}
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>Solo Puntos</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Canje 100% Puntos COA</div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "700", fontSize: "0.9rem", color: "#f97316" }}>
                      {selectedProduct.price_points?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                    </div>
                  </div>
                </div>

                {/* Quantity + Add to Cart button */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                  {/* Quantity Stepper */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "0.375rem", height: "45px", overflow: "hidden" }}>
                    <button 
                      onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                      style={{ background: "#f8fafc", border: "none", height: "100%", width: "40px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ width: "40px", textAlign: "center", fontWeight: "700", color: "#1e293b" }}>
                      {detailQty}
                    </span>
                    <button 
                      onClick={() => setDetailQty(prev => Math.min(selectedProduct.stock, prev + 1))}
                      style={{ background: "#f8fafc", border: "none", height: "100%", width: "40px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    onClick={() => addToCart(selectedProduct, detailPaymentType, detailQty)}
                    disabled={selectedProduct.stock <= 0}
                    style={{
                      flex: 1,
                      height: "45px",
                      background: selectedProduct.stock <= 0 ? "#cbd5e1" : "#facc15",
                      color: "#1e293b",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      cursor: selectedProduct.stock <= 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={e => {
                      if (selectedProduct.stock > 0) e.currentTarget.style.background = "#eab308";
                    }}
                    onMouseOut={e => {
                      if (selectedProduct.stock > 0) e.currentTarget.style.background = "#facc15";
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>Agregar al carrito</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <Shield size={20} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>Compra protegida</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Tus datos cuidados durante toda la compra.</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <RotateCcw size={20} style={{ color: "#3b82f6", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>Cambios y devoluciones</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Si no te gusta, podés cambiarlo por otro o devolverlo.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Calculator (Cosmetic) */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>Medios de envío</div>
              <div style={{ display: "flex", gap: "0.5rem", maxWidth: "300px" }}>
                <input 
                  type="text" 
                  placeholder="Tu código postal" 
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                    padding: "0.5rem",
                    fontSize: "0.85rem"
                  }}
                />
                <button 
                  onClick={() => toast.success("Costo de envío bonificado para miembros COA!")}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Calcular
                </button>
              </div>
            </div>

            {/* Description section */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.75rem" }}>Descripción</h3>
              <div style={{ 
                fontSize: "0.9rem", 
                color: "#475569", 
                lineHeight: "1.6", 
                whiteSpace: "pre-line",
                backgroundColor: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "0.5rem"
              }}>
                {generateDescription(selectedProduct)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cart Drawer Backdrop */}
      {isCartOpen && (
        <div 
          onClick={() => setIsCartOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
            zIndex: 10000
          }}
        />
      )}
      
      {/* Cart Drawer */}
      <div style={{
        position: "fixed",
        top: 0,
        right: isCartOpen ? 0 : "-450px",
        width: "100%",
        maxWidth: "450px",
        height: "100vh",
        background: "#ffffff",
        color: "#1e293b",
        boxShadow: "-10px 0 30px -5px rgba(0,0,0,0.3)",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "right 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={24} style={{ color: "#3b82f6" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Mi Carrito</h2>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer Body - Items List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <ShoppingBag size={48} style={{ strokeWidth: 1.5, opacity: 0.5 }} />
              <p style={{ fontWeight: "500" }}>Tu carrito está vacío</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: "#3b82f6", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer"
                }}
              >
                Explorar Tienda
              </button>
            </div>
          ) : (
            cart.map(item => {
              const isPoints = item.payment_type === "full_points";
              const isMixed = item.payment_type === "mixed";
              const isMP = item.payment_type === "full_mp";

              let priceText = "";
              let pointsText = "";
              
              if (isPoints) {
                pointsText = `${(Number(item.product.price_points || 0) * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`;
              } else if (isMixed) {
                priceText = `$ ${(Number(item.product.price_pesos_mixed || 0) * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                pointsText = `+ ${(Number(item.product.price_points_mixed || 0) * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts`;
              } else if (isMP) {
                priceText = `$ ${(Number(item.product.price_pesos || 0) * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              }

              return (
                <div key={item.id} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #f1f5f9" }}>
                  {/* Item Image */}
                  <div style={{ width: "80px", height: "80px", background: "#f8fafc", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", flexShrink: 0 }}>
                    <img src={item.product.image_url} alt={item.product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.25rem" }}>{item.product.name}</h4>
                    
                    {/* Payment Type Badge */}
                    <span style={{
                      alignSelf: "flex-start",
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "0.25rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                      backgroundColor: isPoints ? "#e0f2fe" : isMixed ? "#e0e7ff" : "#fef3c7",
                      color: isPoints ? "#0369a1" : isMixed ? "#4338ca" : "#b45309"
                    }}>
                      {isPoints ? "Solo Puntos" : isMixed ? "Pago Mixto" : "Solo Pesos"}
                    </span>

                    {/* Price & Quantity Controls */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      {/* Subtotals */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {priceText && <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{priceText}</span>}
                        {pointsText && <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#f97316" }}>{pointsText}</span>}
                      </div>

                      {/* Quantity Picker */}
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "0.375rem", overflow: "hidden" }}>
                        <button 
                          onClick={() => updateCartQty(item.id, item.quantity - 1)}
                          style={{ background: "#f8fafc", border: "none", padding: "0.25rem 0.5rem", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "30px", textAlign: "center", fontSize: "0.85rem", fontWeight: "600" }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(item.id, item.quantity + 1)}
                          style={{ background: "#f8fafc", border: "none", padding: "0.25rem 0.5rem", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", alignSelf: "flex-start", padding: "0.25rem" }}
                    onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer - Totals and Pay Button */}
        {cart.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            {/* Totals Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {/* Total Pesos */}
              {cart.some(i => i.payment_type !== "full_points") && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontWeight: "500" }}>Total en Pesos:</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b" }}>
                    $ {cart.reduce((acc, item) => {
                      const itemPesos = item.payment_type === "full_points"
                        ? 0
                        : item.payment_type === "mixed"
                          ? Number(item.product.price_pesos_mixed || 0)
                          : Number(item.product.price_pesos || 0);
                      return acc + (itemPesos * item.quantity);
                    }, 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              {/* Total Points */}
              {cart.some(i => i.payment_type !== "full_mp") && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontWeight: "500" }}>Total en Puntos:</span>
                  <span style={{ fontSize: "1.15rem", fontWeight: "700", color: "#f97316" }}>
                    {cart.reduce((acc, item) => {
                      const itemPoints = item.payment_type === "full_points"
                        ? Number(item.product.price_points || 0)
                        : item.payment_type === "mixed"
                          ? Number(item.product.price_points_mixed || 0)
                          : 0;
                      return acc + (itemPoints * item.quantity);
                    }, 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                  </span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button 
              onClick={handleCartCheckout}
              style={{
                width: "100%",
                background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                padding: "1rem",
                borderRadius: "0.5rem",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.4)",
                transition: "all 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              <ShoppingBag size={20} />
              <span>Finalizar Compra / Canjear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
