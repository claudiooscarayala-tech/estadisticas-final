import React, { useState, useEffect } from "react";
import api from "./api";
import { Save, AlertCircle, CheckCircle, Edit, X } from "lucide-react";

export default function Siniestros() {
  const [producers, setProducers] = useState([]);
  const [siniestros, setSiniestros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    fecha: new Date().toISOString().split('T')[0],
    fecha_siniestro: "",
    compania: "",
    stros: "",
    poliza: "",
    asegurado: "",
    patente: "",
    detalle_stro: "",
    producer_id: "",
    somos_culpables: "No",
    terceros: "",
    tel_tercero: "",
    fecha_contacto: "",
    detalle_comunicacion: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    // Load producers
    api.get("/api/producers").then(res => setProducers(res.data));
    // Load existing siniestros
    loadSiniestros();
  }, []);

  const loadSiniestros = () => {
    api.get("/api/siniestros").then(res => setSiniestros(res.data));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (siniestro) => {
    setEditingId(siniestro.id);
    setFormData({
      fecha: siniestro.fecha || "",
      compania: siniestro.compania || "",
      stros: siniestro.stros || "",
      poliza: siniestro.poliza || "",
      asegurado: siniestro.asegurado || "",
      patente: siniestro.patente || "",
      detalle_stro: siniestro.detalle_stro || "",
      producer_id: siniestro.producer_id || "",
      somos_culpables: siniestro.somos_culpables || "No",
      terceros: siniestro.terceros || "",
      tel_tercero: siniestro.tel_tercero || "",
      fecha_contacto: siniestro.fecha_contacto || "",
      detalle_comunicacion: siniestro.detalle_comunicacion || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    const request = editingId 
      ? api.put(`/api/siniestros/${editingId}`, formData)
      : api.post("/api/siniestros", formData);

    request
      .then(res => {
        setStatus({ type: "success", message: editingId ? "Siniestro actualizado exitosamente." : "Siniestro guardado exitosamente." });
        
        if (editingId) {
          setSiniestros(siniestros.map(s => s.id === editingId ? res.data : s));
          setEditingId(null);
        } else {
          setSiniestros([res.data, ...siniestros]); // Add to top of list
        }
        
        setFormData(initialFormState);
        setTimeout(() => setStatus({ type: "", message: "" }), 3000);
      })
      .catch(err => {
        setStatus({ type: "error", message: err.response?.data?.error || (editingId ? "Error al actualizar siniestro. Verifica que el servidor se haya reiniciado." : "Error al guardar siniestro") });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h1 className="page-title">Gestión de Siniestros</h1>
        <p className="page-subtitle">Carga y consulta de siniestros</p>
      </header>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "var(--text-main)" }}>
          {editingId ? "Editar Siniestro" : "Nuevo Siniestro"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Fecha Denuncia
              </label>
              <input 
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Fecha Siniestro
              </label>
              <input 
                type="datetime-local"
                name="fecha_siniestro"
                value={formData.fecha_siniestro}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Productor
              </label>
              <select 
                name="producer_id"
                value={formData.producer_id}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">Seleccione un productor</option>
                {producers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Compañía
              </label>
              <select 
                name="compania"
                value={formData.compania}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">Seleccione una compañía</option>
                <option value="Sancor Seguros">Sancor Seguros</option>
                <option value="Parana Seguros">Parana Seguros</option>
                <option value="Digna Seguros">Digna Seguros</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Nº de Siniestro (Cia)
              </label>
              <input 
                type="text"
                name="stros"
                value={formData.stros}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Nº Póliza
              </label>
              <input 
                type="text"
                name="poliza"
                value={formData.poliza}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Asegurado
              </label>
              <input 
                type="text"
                name="asegurado"
                value={formData.asegurado}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Patente
              </label>
              <input 
                type="text"
                name="patente"
                value={formData.patente}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                ¿Somos Culpables?
              </label>
              <select 
                name="somos_culpables"
                value={formData.somos_culpables}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Terceros
              </label>
              <input 
                type="text"
                name="terceros"
                value={formData.terceros}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Tel Tercero
              </label>
              <input 
                type="text"
                name="tel_tercero"
                value={formData.tel_tercero}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Fecha de Contacto
              </label>
              <input 
                type="date"
                name="fecha_contacto"
                value={formData.fecha_contacto}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Detalle del Siniestro
              </label>
              <textarea 
                name="detalle_stro"
                value={formData.detalle_stro}
                onChange={handleInputChange}
                className="input-field"
                rows="4"
              ></textarea>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>
                Detalle de Comunicación
              </label>
              <textarea 
                name="detalle_comunicacion"
                value={formData.detalle_comunicacion}
                onChange={handleInputChange}
                className="input-field"
                rows="4"
              ></textarea>
            </div>
          </div>

          {status.message && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: status.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
              color: status.type === "success" ? "var(--success-color)" : "var(--danger-color)", 
              borderRadius: "0.5rem", 
              display: "flex", alignItems: "center", gap: "0.5rem" 
            }}>
              {status.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-color)" }}>
                <X size={18} />
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Save size={18} />
              {loading ? "Guardando..." : editingId ? "Actualizar Siniestro" : "Guardar Siniestro"}
            </button>
          </div>

        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "1rem", color: "var(--text-main)" }}>Historial de Siniestros</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Número</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Fecha Denuncia</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Fecha Siniestro</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Días</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Compañía</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Asegurado</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Productor</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Culpable</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Tercero</th>
                <th style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontWeight: "500" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {siniestros.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)" }}>
                    No hay siniestros registrados.
                  </td>
                </tr>
              ) : (
                siniestros.map(s => {
                  const getDaysPassed = (dateString) => {
                    if (!dateString) return 0;
                    const [year, month, day] = dateString.split("-");
                    const past = new Date(year, month - 1, day);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = Math.abs(today - past);
                    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  };
                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const [year, month, day] = dateString.split("-");
                    return `${day}/${month}/${year.slice(2)}`;
                  };
                  const formatDateTime = (dateTimeString) => {
                    if (!dateTimeString) return "-";
                    // Format: 2024-10-22T14:30
                    const [datePart, timePart] = dateTimeString.split("T");
                    if (!datePart) return "-";
                    const [year, month, day] = datePart.split("-");
                    return `${day}/${month}/${year.slice(2)} ${timePart || ""}`;
                  };
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: "600", color: "var(--primary)" }}>#{s.numero}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{formatDate(s.fecha)}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{formatDateTime(s.fecha_siniestro)}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)", fontWeight: "500" }}>
                        <span style={{ 
                          backgroundColor: "rgba(99, 102, 241, 0.1)", 
                          color: "var(--primary)", 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "1rem",
                          fontSize: "0.85rem" 
                        }}>
                          {getDaysPassed(s.fecha)} días
                        </span>
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{s.compania}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{s.asegurado}</td>
                      <td style={{ padding: "1rem", color: "var(--text-light)" }}>{s.producer_name}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{s.somos_culpables}</td>
                      <td style={{ padding: "1rem", color: "var(--text-main)" }}>{s.terceros || "-"}</td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button 
                        onClick={() => handleEdit(s)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--primary)" }}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
