import React, { useState, useEffect } from "react";
import api from "./api";
import { Download, FileText, CheckCircle } from "lucide-react";

export default function AltasPASAdmin() {
  const [altas, setAltas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/altas-pas")
      .then(res => setAltas(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return `/admin/${filePath}`;
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          Altas de PAS
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Gestiona las solicitudes de inscripción de nuevos Productores Asesores de Seguros.
        </p>
      </header>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Cargando datos...</p>
        ) : altas.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>No hay solicitudes de alta registradas.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Fecha</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Productor</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Compañía de Alta</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>DNI / CUIT</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Matrícula</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>Trabaja Con</th>
                  <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: "500" }}>CBU</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: "500" }}>Documentación</th>
                </tr>
              </thead>
              <tbody>
                {altas.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "1rem", color: "var(--text-main)", whiteSpace: "nowrap" }}>
                      {new Date(a.fecha).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "600", color: "var(--primary)" }}>{a.apellido}, {a.nombre}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{a.condicion_fiscal}</div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-main)", fontWeight: "500" }}>
                      {a.compania_alta || "-"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: "var(--text-main)" }}>DNI: {a.dni}</div>
                      <div style={{ color: "var(--text-main)" }}>CUIT: {a.cuit}</div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-main)" }}>{a.matricula || "-"}</td>
                    <td style={{ padding: "1rem", color: "var(--text-main)" }}>
                      <div>CBU: {a.cbu || "-"}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Banco: {a.banco_cobro || "-"}</div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: "250px" }}>
                        {a.constancia_afip && (
                          <a href={getFileUrl(a.constancia_afip)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Constancia AFIP">
                            <FileText size={14} /> AFIP
                          </a>
                        )}
                        {a.constancia_iibb && (
                          <a href={getFileUrl(a.constancia_iibb)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Constancia IIBB">
                            <FileText size={14} /> IIBB
                          </a>
                        )}
                        {a.pago_matricula && (
                          <a href={getFileUrl(a.pago_matricula)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Último Pago Matrícula">
                            <FileText size={14} /> Matrícula
                          </a>
                        )}
                        {a.dni_frente && (
                          <a href={getFileUrl(a.dni_frente)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar DNI Frente">
                            <FileText size={14} /> DNI Frente
                          </a>
                        )}
                        {a.dni_dorso && (
                          <a href={getFileUrl(a.dni_dorso)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar DNI Dorso">
                            <FileText size={14} /> DNI Dorso
                          </a>
                        )}
                        {a.cipas_frente && (
                          <a href={getFileUrl(a.cipas_frente)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar CIPAS Frente">
                            <FileText size={14} /> CIPAS Frente
                          </a>
                        )}
                        {a.cipas_dorso && (
                          <a href={getFileUrl(a.cipas_dorso)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar CIPAS Dorso">
                            <FileText size={14} /> CIPAS Dorso
                          </a>
                        )}
                        {a.pago_libros && (
                          <a href={getFileUrl(a.pago_libros)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Pago Libros">
                            <FileText size={14} /> Libros
                          </a>
                        )}
                        {a.constancia_cbu && (
                          <a href={getFileUrl(a.constancia_cbu)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(59, 130, 246, 0.1)", color: "var(--info-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Constancia de CBU">
                            <FileText size={14} /> CBU
                          </a>
                        )}
                        {a.constancia_uif && (
                          <a href={getFileUrl(a.constancia_uif)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(236, 72, 153, 0.1)", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar Constancia UIF">
                            <FileText size={14} /> UIF
                          </a>
                        )}
                        {/* Fallback for old records */}
                        {a.cipas && !a.cipas_frente && (
                          <a href={getFileUrl(a.cipas)} target="_blank" rel="noreferrer" className="btn" style={{ padding: "0.25rem 0.5rem", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }} title="Descargar CIPAS (Antiguo)">
                            <FileText size={14} /> CIPAS
                          </a>
                        )}
                        
                        {!a.constancia_afip && !a.cipas_frente && !a.dni_frente && (
                          <span style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>Sin archivos</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
