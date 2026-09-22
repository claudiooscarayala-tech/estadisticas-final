import React, { useState } from "react";
import { CheckCircle, AlertCircle, Upload, Save } from "lucide-react";
import logoCoa from "./assets/logo-coa.png";

export default function AltaPasPublico() {
  const [formData, setFormData] = useState({
    compania_alta: "",
    apellido: "",
    nombre: "",
    dni: "",
    cuit: "",
    condicion_fiscal: "Monotributo",
    matricula: "",
    companias: "",
    cbu: "",
    banco_cobro: ""
  });
  
  const [files, setFiles] = useState({
    constancia_afip: null,
    constancia_iibb: null,
    pago_matricula: null,
    dni_frente: null,
    dni_dorso: null,
    cipas_frente: null,
    cipas_dorso: null,
    pago_libros: null,
    constancia_uif: null,
    constancia_cbu: null
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (files.constancia_afip) data.append("constancia_afip", files.constancia_afip);
    if (files.constancia_iibb) data.append("constancia_iibb", files.constancia_iibb);
    if (files.pago_matricula) data.append("pago_matricula", files.pago_matricula);
    if (files.dni_frente) data.append("dni_frente", files.dni_frente);
    if (files.dni_dorso) data.append("dni_dorso", files.dni_dorso);
    if (files.cipas_frente) data.append("cipas_frente", files.cipas_frente);
    if (files.cipas_dorso) data.append("cipas_dorso", files.cipas_dorso);
    if (files.pago_libros) data.append("pago_libros", files.pago_libros);
    if (files.constancia_uif) data.append("constancia_uif", files.constancia_uif);
    if (files.constancia_cbu) data.append("constancia_cbu", files.constancia_cbu);

    fetch("/api/public/altas-pas", {
      method: "POST",
      body: data
    })
    .then(async res => {
      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error("Error en la respuesta del servidor. Inténtalo de nuevo.");
      }
      if (!res.ok) throw new Error(json?.error || "Error al enviar");
      setSubmitted(true);
    })
    .catch(err => {
      setStatus({ type: "error", message: err.message });
    })
    .finally(() => {
      setLoading(false);
    });
  };

  if (submitted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-dark)" }}>
        <div className="card" style={{ maxWidth: "500px", textAlign: "center", padding: "3rem" }}>
          <CheckCircle size={64} color="var(--success-color)" style={{ margin: "0 auto 1.5rem" }} />
          <h2 style={{ color: "var(--text-main)", marginBottom: "1rem" }}>¡Solicitud Enviada!</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Tus datos han sido recibidos correctamente. Nos pondremos en contacto contigo a la brevedad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)", padding: "2rem", display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: "700px", width: "100%" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ 
            background: "#ffffff", 
            padding: "1rem", 
            borderRadius: "0.5rem", 
            display: "inline-flex",
            marginBottom: "1rem"
          }}>
            <img src={logoCoa} alt="COA Logo" style={{ width: "150px" }} />
          </div>
          <h1 style={{ color: "var(--text-main)", fontSize: "1.5rem" }}>Formulario de Alta para PAS</h1>
          <p style={{ color: "var(--text-muted)" }}>Completa el siguiente formulario para iniciar tu vinculación</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>¿En qué compañía desea el ALTA? *</label>
            <select name="compania_alta" value={formData.compania_alta} onChange={handleInputChange} className="form-input" required style={{ width: '100%', fontSize: '1.1rem' }}>
              <option value="">-- Seleccione una compañía --</option>
              <option value="Andina ART">Andina ART</option>
              <option value="Asociart ART">Asociart ART</option>
              <option value="BBVA Seguros">BBVA Seguros</option>
              <option value="Beneficio Seguros">Beneficio Seguros</option>
              <option value="Berkley ART">Berkley ART</option>
              <option value="Berkley Seguros">Berkley Seguros</option>
              <option value="Chubb Seguros">Chubb Seguros</option>
              <option value="Digna Seguros">Digna Seguros</option>
              <option value="Federacion ART">Federacion ART</option>
              <option value="Federacion Patronal">Federacion Patronal</option>
              <option value="Federacion Retiro">Federacion Retiro</option>
              <option value="Mercantil Andina Seguros">Mercantil Andina Seguros</option>
              <option value="Mista Seguros">Mista Seguros</option>
              <option value="Nivel Seguros">Nivel Seguros</option>
              <option value="Parana ART">Parana ART</option>
              <option value="Parana Seguros">Parana Seguros</option>
              <option value="Prevencion ART">Prevencion ART</option>
              <option value="Prevencion Retiro">Prevencion Retiro</option>
              <option value="Prevencion Salud">Prevencion Salud</option>
              <option value="Provincia ART">Provincia ART</option>
              <option value="San Cristobal Retiro">San Cristobal Retiro</option>
              <option value="San Cristobal Seguros">San Cristobal Seguros</option>
              <option value="Sancor Seguros">Sancor Seguros</option>
              <option value="Zurich Seguros">Zurich Seguros</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="form-input" required style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Apellido *</label>
              <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className="form-input" required style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>DNI *</label>
              <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} className="form-input" required style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>CUIT *</label>
              <input type="text" name="cuit" value={formData.cuit} onChange={handleInputChange} className="form-input" required style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Condición Fiscal</label>
              <select name="condicion_fiscal" value={formData.condicion_fiscal} onChange={handleInputChange} className="form-input" style={{ width: '100%', fontSize: '1.1rem' }}>
                <option value="Monotributo">Monotributo</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Exento">Exento</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Número de Matrícula</label>
              <input type="text" name="matricula" value={formData.matricula} onChange={handleInputChange} className="form-input" style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Compañías con las que trabaja actualmente</label>
            <input type="text" name="companias" value={formData.companias} onChange={handleInputChange} className="form-input" style={{ width: '100%', fontSize: '1.1rem' }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>Banco para cobrar comisiones</label>
              <input type="text" name="banco_cobro" value={formData.banco_cobro} onChange={handleInputChange} className="form-input" style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "var(--text-main)" }}>CBU</label>
              <input type="text" name="cbu" value={formData.cbu} onChange={handleInputChange} className="form-input" style={{ width: '100%', fontSize: '1.1rem' }} />
            </div>
          </div>

          <div style={{ padding: "1.5rem", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "0.5rem", border: "1px dashed var(--border-color)" }}>
            <h3 style={{ color: "var(--text-main)", marginBottom: "1rem", fontSize: "1.1rem" }}>Documentación Requerida (PDF)</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>1. Constancia de AFIP</label>
                <input type="file" name="constancia_afip" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>
              
              {formData.condicion_fiscal === "Responsable Inscripto" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>2. Constancia de IIBB (Requerido para Responsable Inscripto)</label>
                  <input type="file" name="constancia_iibb" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} required={formData.condicion_fiscal === "Responsable Inscripto"} />
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>3. Último Pago de Matrícula</label>
                <input type="file" name="pago_matricula" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>4. DNI Frente</label>
                <input type="file" name="dni_frente" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>5. DNI Dorso</label>
                <input type="file" name="dni_dorso" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>6. CIPAS Frente</label>
                <input type="file" name="cipas_frente" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>7. CIPAS Dorso</label>
                <input type="file" name="cipas_dorso" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>8. Último Pago de Libros</label>
                <input type="file" name="pago_libros" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>9. Constancia de CBU</label>
                <input type="file" name="constancia_cbu" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>10. Constancia de UIF (Opcional)</label>
                <input type="file" name="constancia_uif" accept=".pdf" onChange={handleFileChange} className="form-input" style={{ width: '100%', backgroundColor: 'transparent', padding: 0 }} />
              </div>
            </div>
          </div>

          {status.message && (
            <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger-color)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={20} />
              {status.message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}>
            <Save size={20} />
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </button>

        </form>
      </div>
    </div>
  );
}
