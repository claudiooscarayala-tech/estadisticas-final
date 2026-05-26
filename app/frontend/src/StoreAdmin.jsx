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
  const [pricePesos, setPricePesos] = useState("");
  const [pricePoints, setPricePoints] = useState("");
  const [pricePesosMixed, setPricePesosMixed] = useState("");
  const [pricePointsMixed, setPricePointsMixed] = useState("");
  const [stock, setStock] = useState("10");
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !image) {
      toast.error("Debes subir una imagen para un nuevo producto");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price_pesos", pricePesos);
    formData.append("price_points", pricePoints);
    formData.append("price_pesos_mixed", pricePesosMixed);
    formData.append("price_points_mixed", pricePointsMixed);
    formData.append("stock", stock);
    if (image) formData.append("image", image);

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
    setName(""); setPricePesos(""); setPricePoints(""); setPricePesosMixed(""); setPricePointsMixed(""); setStock("10"); setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPricePesos(product.price_pesos);
    setPricePoints(product.price_points);
    setPricePesosMixed(product.price_pesos_mixed || 0);
    setPricePointsMixed(product.price_points_mixed || 0);
    setStock(product.stock);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              <label className="form-label">Categoría</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{display: "flex", gap: "1rem"}}>
              <div style={{flex: 1}}>
                <label className="form-label">Precio Solo MP ($)</label>
                <input type="number" step="0.01" className="form-input" style={{width: "100%"}} value={pricePesos} onChange={e => setPricePesos(e.target.value)} required />
              </div>
              <div style={{flex: 1}}>
                <label className="form-label">Precio Solo Puntos</label>
                <input type="number" className="form-input" style={{width: "100%"}} value={pricePoints} onChange={e => setPricePoints(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{display: "flex", gap: "1rem"}}>
              <div style={{flex: 1}}>
                <label className="form-label">Pago Mixto ($)</label>
                <input type="number" step="0.01" className="form-input" style={{width: "100%"}} value={pricePesosMixed} onChange={e => setPricePesosMixed(e.target.value)} required />
              </div>
              <div style={{flex: 1}}>
                <label className="form-label">Pago Mixto (Puntos)</label>
                <input type="number" className="form-input" style={{width: "100%"}} value={pricePointsMixed} onChange={e => setPricePointsMixed(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Stock Disponible</label>
              <input type="number" className="form-input" value={stock} onChange={e => setStock(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Imagen {editingId && "(Opcional si no se cambia)"}</label>
              <div style={{ border: "1px dashed var(--border-color)", padding: "1rem", borderRadius: "0.5rem", textAlign: "center" }}>
                <Upload size={24} color="var(--text-muted)" style={{marginBottom: "0.5rem"}} />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{width: "100%", color: "var(--text-muted)"}} required={!editingId} />
              </div>
            </div>
            <button type="submit" className="btn" style={{width: "100%", justifyContent: "center", background: editingId ? "var(--success)" : "var(--accent)"}}>
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
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Solo $</th>
                  <th>Solo Pts</th>
                  <th>Mixto</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign: "center", padding: "2rem"}}>No hay productos cargados</td></tr>
                ) : products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <img src={`http://localhost:3001${p.image_url}`} alt={p.name} style={{width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px"}} />
                    </td>
                    <td style={{fontWeight: "500"}}>{p.name}</td>
                    <td style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>{p.category}</td>
                    <td>$ {p.price_pesos.toLocaleString("es-AR")}</td>
                    <td style={{color: "var(--accent)", fontWeight: "600"}}>{p.price_points.toLocaleString("es-AR")} pts</td>
                    <td style={{fontSize: "0.85rem"}}>$ {p.price_pesos_mixed?.toLocaleString("es-AR")} + {p.price_points_mixed?.toLocaleString("es-AR")} pts</td>
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
