import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';

export default function Store({ producer }) {
  const [products, setProducts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const orderId = urlParams.get('order_id');

    if (status === 'success') {
      if (orderId) {
        axios.put(`/api/store/orders/${orderId}/confirm-mp`)
          .then(() => {
            toast.success('¡Pago exitoso!');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          })
          .catch(() => toast.error('Error al confirmar pago.'));
      } else {
        toast.success('¡Pago exitoso!');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'failure') {
      toast.error('Pago rechazado.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    Promise.all([
      axios.get('/api/store/products'),
      axios.get(`/api/store/producer-history/${producer.id}`)
    ]).then(([prodRes, histRes]) => {
      setProducts(prodRes.data);
      if (histRes.data && histRes.data.length > 0) {
        setBalance(histRes.data[0].balance);
      }
    }).catch(() => toast.error("Error al cargar la tienda"))
      .finally(() => setLoading(false));
  }, [producer.id]);

  const handleExchange = async (product, paymentType = "full_points") => {
    if (balance < product.price_points) {
      return toast.error("Puntos insuficientes");
    }
    try {
      await axios.post("/api/store/orders", {
        producer_id: producer.id,
        product_id: product.id,
        payment_type: paymentType
      });
      toast.success(`¡Canjeaste ${product.name} con éxito!`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setBalance(b => b - product.price_points);
      setSelectedProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al realizar canje");
    }
  };

  const handleBuy = async (product, paymentType) => {
    try {
      if (paymentType === 'full_mp' || paymentType === 'mixed') {
        const res = await axios.post('/api/store/checkout', {
          producer_id: producer.id,
          product_id: product.id,
          payment_type: paymentType,
          source: 'mobile'
        });
        if (res.data.init_point) {
          window.location.href = res.data.init_point;
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al iniciar pago");
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;

  return (
    <>
      <div className="fade-in delay-2">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{fontSize: '1.5rem'}}>Catálogo</h2>
          <div style={{background: 'rgba(59, 130, 246, 0.2)', padding: '0.4rem 1rem', borderRadius: '1rem', color: 'var(--accent)', fontWeight: 600, fontSize: '1.1rem'}}>
            {balance.toLocaleString('es-AR')} pts
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          {products.map(p => (
            <div 
              className="card" 
              key={p.id} 
              style={{padding: '0', overflow: 'hidden', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.6}} 
              onClick={() => p.stock > 0 && setSelectedProduct(p)}
            >
              <div style={{width: '100%', height: '220px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative'}}>
                {p.stock <= 0 && (
                  <div style={{position: 'absolute', top: '1rem', right: '1rem', background: 'var(--danger)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '1rem', fontSize: '0.95rem', fontWeight: 600}}>
                    AGOTADO
                  </div>
                )}
                <img src={`http://localhost:3001${p.image_url}`} alt={p.name} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: p.stock <= 0 ? 'grayscale(100%)' : 'none'}} />
              </div>
              <div style={{padding: '1.25rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem'}}>
                  <div style={{fontSize: '1rem', color: 'var(--accent)', fontWeight: 600}}>{p.category}</div>
                  {p.stock > 0 && (
                    <div style={{fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>
                      Stock: {p.stock}
                    </div>
                  )}
                </div>
                <h3 style={{fontSize: '1.3rem', marginBottom: '0.5rem'}}>{p.name}</h3>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem'}}>
                  <span style={{fontWeight: 700, fontSize: '1.3rem'}}>{(p.price_points_mixed || 0).toLocaleString('es-AR')} pts</span>
                  <span style={{color: 'var(--text-muted)'}}>+</span>
                  <span style={{color: '#10b981', fontWeight: 600, fontSize: '1.2rem'}}>${(p.price_pesos_mixed || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'var(--bg-dark)', padding: '1.5rem', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.4rem'}}>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} style={{width: '36px', height: '36px', padding: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.1)'}}>
                <X size={20} />
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'env(safe-area-inset-bottom)'}}>
              <button onClick={() => handleBuy(selectedProduct, 'mixed')} style={{display: 'flex', flexDirection: 'column', padding: '1.25rem', height: 'auto', gap: '0.35rem'}}>
                <span style={{fontSize: '1.2rem', fontWeight: 600}}>Pagar con Puntos y MP</span>
                <span style={{fontSize: '1.2rem', fontWeight: 600}}>
                  {(selectedProduct.price_points_mixed || 0).toLocaleString('es-AR')} pts + ${(selectedProduct.price_pesos_mixed || 0).toLocaleString('es-AR')}
                </span>
              </button>
              
              <button onClick={() => handleBuy(selectedProduct, 'full_mp')} className="secondary" style={{display: 'flex', flexDirection: 'column', padding: '1.25rem', height: 'auto', gap: '0.35rem'}}>
                <span style={{fontSize: '1.2rem', fontWeight: 600}}>Pagar solo con Mercado Pago</span>
                <span style={{fontSize: '1.2rem', fontWeight: 600}}>
                  ${(selectedProduct.price_pesos || 0).toLocaleString('es-AR')}
                </span>
              </button>

              <button 
                onClick={() => handleExchange(selectedProduct)} 
                className="secondary" 
                style={{display: 'flex', flexDirection: 'column', padding: '1.25rem', height: 'auto', gap: '0.35rem', borderColor: balance >= selectedProduct.price_points ? '#10b981' : 'rgba(255,255,255,0.1)'}}
                disabled={balance < selectedProduct.price_points}
              >
                <span style={{fontSize: '1.2rem', fontWeight: 600}}>Pagar solo con Puntos</span>
                <span style={{fontSize: '1.2rem', fontWeight: 600, color: balance >= selectedProduct.price_points ? '#10b981' : 'var(--danger)'}}>
                  {(selectedProduct.price_points || 0).toLocaleString('es-AR')} pts
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
