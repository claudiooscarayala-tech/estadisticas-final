import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import { Trash2, Upload, Plus, Edit2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function StoreAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Llevá el Mundial a tu living");
  const [cost, setCost] = useState("");
  const [tarifa, setTarifa] = useState("1");
  const [stock, setStock] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [image, setImage] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [preview, setPreview] = useState("");
  const [preview2, setPreview2] = useState("");
  const [preview3, setPreview3] = useState("");
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

  const categories = [
    "Llevá el Mundial a tu living",
    "Computadoras, tablets y consolas",
    "Bienestar que elegís",
    "Tu mochila ideal",
    "Accesorios y Electrónica",
    "Mista Seguros",
    "Paraná Seguros",
    "BBVA Seguros"
  ];

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/store/products");
      setProducts(res.data);
    } catch (err) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (index === 1) {
        setImage(file);
        setPreview(url);
      } else if (index === 2) {
        setImage2(file);
        setPreview2(url);
      } else if (index === 3) {
        setImage3(file);
        setPreview3(url);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !image) {
      toast.error("Debes subir al menos la imagen principal para un nuevo producto");
      return;
    }

    const numericCost = parseFloat(cost) || 0;
    let factor = 2.2;
    if (tarifa === "2") factor = 2.6;
    if (tarifa === "3") factor = 3.0;

    const pricePesos = Math.ceil((numericCost * factor) / 100) * 100;
    const pricePoints = Math.ceil((numericCost * factor) / 25);
    const pricePesosMixed = Math.ceil((numericCost * (factor * 0.70)) / 100) * 100;
    const pricePointsMixed = Math.ceil((numericCost * (factor * 0.30)) / 25);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price_pesos", pricePesos);
    formData.append("price_points", pricePoints);
    formData.append("price_pesos_mixed", pricePesosMixed);
    formData.append("price_points_mixed", pricePointsMixed);
    formData.append("stock", stock);
    formData.append("supplier", supplier || "");
    formData.append("base_cost", numericCost);
    formData.append("tarifa", tarifa);
    if (image) formData.append("image", image);
    if (image2) formData.append("image2", image2);
    if (image3) formData.append("image3", image3);

    const toastId = toast.loading(editingId ? "Actualizando producto..." : "Guardando producto...");
    try {
      if (editingId) {
        await api.put(`/api/store/products/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Producto actualizado exitosamente", { id: toastId });
      } else {
        await api.post("/api/store/products", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Producto creado exitosamente", { id: toastId });
      }
      
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(editingId ? "Error al actualizar producto" : "Error al guardar producto", { id: toastId });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCost("");
    setTarifa("1");
    setStock("10");
    setSupplier("");
    setImage(null);
    setImage2(null);
    setImage3(null);
    setPreview("");
    setPreview2("");
    setPreview3("");
    if (fileInputRef1.current) fileInputRef1.current.value = "";
    if (fileInputRef2.current) fileInputRef2.current.value = "";
    if (fileInputRef3.current) fileInputRef3.current.value = "";
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setStock(product.stock);
    setSupplier(product.supplier || "");
    setImage(null);
    setImage2(null);
    setImage3(null);
    setPreview(product.image_url || "");
    setPreview2(product.image_url_2 || "");
    setPreview3(product.image_url_3 || "");
    if (fileInputRef1.current) fileInputRef1.current.value = "";
    if (fileInputRef2.current) fileInputRef2.current.value = "";
    if (fileInputRef3.current) fileInputRef3.current.value = "";

    // Set cost based on stored DB values, fallback to inference
    if (product.base_cost !== undefined && product.base_cost !== null) {
      setCost(product.base_cost);
      setTarifa(product.tarifa ? product.tarifa.toString() : "1");
    } else {
      const inferredCost = (parseFloat(product.price_pesos) / 2.2).toFixed(2);
      setCost(inferredCost);
      setTarifa("1");
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await api.delete(`/api/store/products/${id}`);
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <div className="fade-in">Cargando panel...</div>;

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">Admin Tienda COA</h1>
        <p className="page-subtitle">Gestiona los productos disponibles para canje</p>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card chart-card delay-1" style={{ gridColumn: "span 4", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>{editingId ? "Editar Producto" : "Agregar Nuevo Producto"}</h3>
            {editingId && (
              <button onClick={resetForm} style={{background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer"}} title="Cancelar edición">
                <X size={20} />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre del Producto</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa Proveedora (Interno)</label>
              <input type="text" className="form-input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Ej: Mista Seguros" />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{fontWeight: "600", color: "var(--accent)"}}>Costo Base del Producto ($)</label>
              <input type="number" step="0.01" className="form-input" style={{width: "100%", borderColor: "var(--accent)"}} value={cost} onChange={e => setCost(e.target.value)} placeholder="Ej: 10000" required />
            </div>
            <div className="form-group">
              <label className="form-label">Tarifa de Venta</label>
              <select className="form-select" value={tarifa} onChange={e => setTarifa(e.target.value)} required>
                <option value="1">Tarifa 1 (Markup 120%)</option>
                <option value="2">Tarifa 2 (Markup 160%)</option>
                <option value="3">Tarifa 3 (Markup 200%)</option>
              </select>
            </div>
            {cost && !isNaN(parseFloat(cost)) && parseFloat(cost) > 0 && (() => {
              let currentFactor = 2.2;
              if (tarifa === "2") currentFactor = 2.6;
              if (tarifa === "3") currentFactor = 3.0;
              return (
              <div className="glass-card" style={{ padding: "1rem", marginBottom: "1.25rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", borderRadius: "0.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--accent)", fontWeight: "600" }}>Precios de Venta Calculados (Auto):</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Solo Mercado Pago:</span>
                    <strong style={{ color: "var(--text-main)" }}>$ {(Math.ceil((parseFloat(cost) * currentFactor) / 100) * 100).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Solo Puntos:</span>
                    <strong style={{ color: "var(--text-main)" }}>{Math.ceil((parseFloat(cost) * currentFactor) / 25).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Pago Mixto:</span>
                    <strong style={{ color: "var(--text-main)" }}>
                      $ {(Math.ceil((parseFloat(cost) * currentFactor * 0.70) / 100) * 100).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + {Math.ceil((parseFloat(cost) * currentFactor * 0.30) / 25).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts
                    </strong>
                  </div>
                </div>
              </div>
              );
            })()}
            <div className="form-group">
              <label className="form-label">Stock Disponible</label>
              <input type="number" className="form-input" value={stock} onChange={e => setStock(e.target.value)} required />
            </div>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label className="form-label" style={{ marginBottom: "0.25rem" }}>Imágenes del Producto</label>
              
              <div style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Imagen Principal {editingId && "(Opcional si no cambia)"}
                </span>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {preview && (
                    <img src={preview} alt="Principal" style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "#ffffff" }} />
                  )}
                  <div style={{ flex: 1, border: "1px dashed var(--border-color)", padding: "0.5rem", borderRadius: "0.25rem", textAlign: "center" }}>
                    <input ref={fileInputRef1} type="file" accept="image/*" onChange={e => handleFileChange(e, 1)} style={{ width: "100%", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }} required={!editingId} />
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Imagen Secundaria 1 (Opcional)
                </span>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {preview2 && (
                    <img src={preview2} alt="Secundaria 1" style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "#ffffff" }} />
                  )}
                  <div style={{ flex: 1, border: "1px dashed var(--border-color)", padding: "0.5rem", borderRadius: "0.25rem", textAlign: "center" }}>
                    <input ref={fileInputRef2} type="file" accept="image/*" onChange={e => handleFileChange(e, 2)} style={{ width: "100%", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }} />
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Imagen Secundaria 2 (Opcional)
                </span>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {preview3 && (
                    <img src={preview3} alt="Secundaria 2" style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "#ffffff" }} />
                  )}
                  <div style={{ flex: 1, border: "1px dashed var(--border-color)", padding: "0.5rem", borderRadius: "0.25rem", textAlign: "center" }}>
                    <input ref={fileInputRef3} type="file" accept="image/*" onChange={e => handleFileChange(e, 3)} style={{ width: "100%", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }} />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn" style={{width: "100%", justifyContent: "center", background: editingId ? "var(--success)" : "var(--accent)", marginTop: "1rem"}}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />} 
              {editingId ? "Actualizar Producto" : "Agregar Producto"}
            </button>
          </form>
        </div>

        <div className="glass-card chart-card delay-2" style={{ gridColumn: "span 8" }}>
          <h3 style={{ marginBottom: "1rem" }}>Productos Cargados</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Imágenes</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Solo $</th>
                  <th>Solo Pts</th>
                  <th>Mixto</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} style={{textAlign: "center", padding: "2rem"}}>No hay productos cargados</td></tr>
                ) : products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <img src={`${p.image_url}`} alt={p.name} style={{width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)", background: "#ffffff"}} />
                        {p.image_url_2 && (
                          <img src={`${p.image_url_2}`} alt={`${p.name} 2`} style={{width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)", background: "#ffffff"}} />
                        )}
                        {p.image_url_3 && (
                          <img src={`${p.image_url_3}`} alt={`${p.name} 3`} style={{width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)", background: "#ffffff"}} />
                        )}
                      </div>
                    </td>
                    <td style={{fontWeight: "500"}}>{p.name}</td>
                    <td style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>{p.category}</td>
                    <td style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>{p.supplier || "-"}</td>
                    <td>$ {p.price_pesos.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td style={{color: "var(--accent)", fontWeight: "600"}}>{p.price_points.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts</td>
                    <td style={{fontSize: "0.85rem"}}>$ {p.price_pesos_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + {p.price_points_mixed?.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pts</td>
                    <td>{p.stock}</td>
                    <td style={{textAlign: "right"}}>
                      <button onClick={() => handleEdit(p)} style={{background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginRight: "1rem"}} title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer"}} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
