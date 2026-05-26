import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import { Users, Plus, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

export default function ProducerManagement() {
  const [producers, setProducers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    matricula: "",
    address: "",
    city: "",
    province: "",
    birthdate: ""
  });

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/producers");
      setProducers(res.data);
    } catch (error) {
      toast.error("Error al cargar productores");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (producer = null) => {
    if (producer) {
      setEditingId(producer.id);
      setFormData({
        name: producer.name || "",
        email: producer.email || "",
        phone: producer.phone || "",
        matricula: producer.matricula || "",
        address: producer.address || "",
        city: producer.city || "",
        province: producer.province || "",
        birthdate: producer.birthdate || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        matricula: "",
        address: "",
        city: "",
        province: "",
        birthdate: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("El nombre y apellido son obligatorios");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/producers/${editingId}`, formData);
        toast.success("Productor actualizado");
      } else {
        await api.post("/api/producers", formData);
        toast.success("Productor creado exitosamente");
      }
      handleCloseModal();
      fetchProducers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar productor");
    }
  };

  return (
    <div className="fade-in">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={28} />
            Gestión de Productores
            <span style={{ 
              fontSize: '1rem', 
              background: 'var(--accent)', 
              color: 'white', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '1rem',
              marginLeft: '0.5rem',
              fontWeight: '600'
            }}>
              {producers.length}
            </span>
          </h1>
          <p className="subtitle">Administra los datos personales y de contacto de los productores</p>
        </div>
        <button className="btn" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Nuevo Productor
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando productores...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0.25rem' }}>Productor</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Mail</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Teléfono</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Matrícula</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Provincia</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Localidad</th>
                <th style={{ padding: '0.5rem 0.25rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {producers.map(producer => (
                <tr key={producer.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.5rem 0.25rem', fontWeight: '500' }}>{producer.name}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>{producer.email || '-'}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>{producer.phone || '-'}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>{producer.matricula || '-'}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>{producer.province || '-'}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>{producer.city || '-'}</td>
                  <td style={{ padding: '0.5rem 0.25rem' }}>
                    <button 
                      type="button"
                      className="btn" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                      onClick={() => handleOpenModal(producer)}
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {producers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay productores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? "Editar Productor" : "Nuevo Productor"}</h2>
              <button type="button" onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Apellido y Nombre *</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Mail</label>
                  <input type="email" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Teléfono</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Matrícula</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="matricula" value={formData.matricula} onChange={handleInputChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>F. Nacimiento</label>
                  <input type="date" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="birthdate" value={formData.birthdate} onChange={handleInputChange} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Dirección</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="address" value={formData.address} onChange={handleInputChange} />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Localidad</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="city" value={formData.city} onChange={handleInputChange} />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Provincia</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem', fontSize: '0.9rem' }} name="province" value={formData.province} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem' }} onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn" style={{ padding: '0.5rem 1rem' }}>
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
