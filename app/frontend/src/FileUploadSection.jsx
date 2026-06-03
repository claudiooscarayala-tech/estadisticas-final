import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import api from "./api";
import * as pdfjsLib from "pdfjs-dist";

// Configurar el worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const normalizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // Reemplazar signos de puntuación (comas, puntos, guiones) por espacios
    .replace(/\s+/g, " ") // Reducir espacios múltiples a uno solo
    .trim();
};

export default function FileUploadSection({ producers, companies, onSuccess }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { month, collections: [{producer, amount, producer_id}], total }

  // Filtrar solo las 3 compañías principales
  const mainCompanies = companies.filter(c => 
    c.name.toLowerCase().includes("parana") || 
    c.name.toLowerCase().includes("sancor") || 
    c.name.toLowerCase().includes("digna")
  );

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setStatus({ type: "", message: "" });
        setPreviewData(null);
      } else {
        setStatus({ type: "error", message: "Por favor, sube un archivo PDF." });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: "", message: "" });
      setPreviewData(null);
    }
  };

  // Algoritmo de coincidencia parcial ignorando mayúsculas y acentos
  const matchProducer = (extractedName) => {
    const normExtracted = normalizeString(extractedName);
    
    // 1. Coincidencia exacta (normalizada)
    let match = producers.find(p => normalizeString(p.name) === normExtracted);
    if (match) return match;

    // 2. Extracted name está contenido en el nombre de la BD o viceversa
    match = producers.find(p => {
      const normP = normalizeString(p.name);
      return normP.includes(normExtracted) || normExtracted.includes(normP);
    });
    if (match) return match;

    // 3. Coincidencia de apellido (primera palabra)
    const extractedWords = normExtracted.split(/\s+/);
    if (extractedWords.length > 0) {
      match = producers.find(p => {
        const pWords = normalizeString(p.name).split(/\s+/);
        // Si la primera palabra (apellido) y alguna otra coinciden
        const intersection = extractedWords.filter(w => pWords.includes(w));
        return intersection.length >= 2; // Al menos dos palabras coinciden (ej. apellido y un nombre)
      });
      if (match) return match;
    }

    return null;
  };

  const processParanaPDF = async (arrayBuffer, targetMonth) => {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let allLines = [];
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const itemsByY = {};
      textContent.items.forEach(item => {
        if (!item.str.trim() && item.str !== " ") return;
        const y = Math.round(item.transform[5]); 
        const existingY = Object.keys(itemsByY).find(key => Math.abs(parseInt(key) - y) <= 2);
        const targetY = existingY ? existingY : y;
        
        if (!itemsByY[targetY]) itemsByY[targetY] = [];
        itemsByY[targetY].push(item);
      });

      const sortedYs = Object.keys(itemsByY).sort((a, b) => b - a);
      sortedYs.forEach(y => {
        const items = itemsByY[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineStr = items.map(item => item.str.trim()).filter(s => s.length > 0).join(" ");
        if (lineStr) {
          allLines.push(lineStr);
          fullText += lineStr + " ";
        }
      });
    }

    // Extracción de Productores y Montos
    let producersMap = new Map();
    let currentProducerCode = null;

    const producerRegex = /^(?:\d+\s+)?(\d{4,6})\s+([A-Z\s]+)$/;
    const totalsRegex = /Totales Rama.*en\s+PESOS\s+([\d.,]+)/i;

    allLines.forEach(line => {
      const prodMatch = line.match(producerRegex);
      if (prodMatch && !line.includes("Totales Rama") && !line.includes("DETALLE")) {
        currentProducerCode = prodMatch[1].trim();
        const producerName = prodMatch[2].trim();
        if (!producersMap.has(currentProducerCode)) {
          producersMap.set(currentProducerCode, { name: producerName, total: 0 });
        }
      }

      const totalsMatch = line.match(totalsRegex);
      if (totalsMatch && currentProducerCode) {
        const importeStr = totalsMatch[1].replace(/\./g, "").replace(",", ".");
        const importeNum = parseFloat(importeStr);
        if (!isNaN(importeNum)) {
          producersMap.get(currentProducerCode).total += importeNum;
        }
      }
    });

    const collectionsMap = new Map();
    let grandTotal = 0;

    producersMap.forEach((data, code) => {
      if (data.total > 0) {
        const matchedDbProducer = matchProducer(data.name);
        const prodId = matchedDbProducer ? matchedDbProducer.id : `unmatched_${code}`;
        
        if (collectionsMap.has(prodId)) {
          // Ya existe, le sumamos el monto
          collectionsMap.get(prodId).amount += data.total;
        } else {
          // No existe, lo creamos
          collectionsMap.set(prodId, {
            extracted_name: data.name,
            producer_id: matchedDbProducer ? matchedDbProducer.id : null,
            db_name: matchedDbProducer ? matchedDbProducer.name : "⚠️ NO ENCONTRADO",
            amount: data.total
          });
        }
        grandTotal += data.total;
      }
    });

    const collections = Array.from(collectionsMap.values());

    return { month: targetMonth, collections, total: grandTotal };
  };

  const handleProcessFile = async () => {
    if (!file || !selectedCompanyId || !selectedMonth) {
      setStatus({ type: "error", message: "Selecciona una compañía, un mes y un archivo." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "success", message: "Procesando archivo PDF..." });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const company = companies.find(c => c.id === Number(selectedCompanyId));
      let parsedResult = null;

      if (company.name.toLowerCase().includes("parana")) {
        parsedResult = await processParanaPDF(arrayBuffer, selectedMonth);
      } else {
        throw new Error(`El algoritmo de extracción para ${company.name} aún no está implementado.`);
      }

      setPreviewData(parsedResult);
      setStatus({ type: "success", message: "PDF procesado con éxito. Revisa la vista previa antes de guardar." });

    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: `Error al procesar: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDB = async () => {
    if (!previewData || !selectedCompanyId) return;

    // Filtrar solo los que hicieron match con un productor en BD
    const validCollections = previewData.collections
      .filter(c => c.producer_id !== null)
      .map(c => ({
        producer_id: c.producer_id,
        amount: c.amount
      }));

    if (validCollections.length === 0) {
      setStatus({ type: "error", message: "No hay productores válidos para guardar." });
      return;
    }

    setIsProcessing(true);
    const year = new Date().getFullYear();

    try {
      await api.post("/api/collections", {
        month: previewData.month,
        year: year,
        company_id: Number(selectedCompanyId),
        collections: validCollections
      });

      setStatus({ type: "success", message: "¡Datos guardados correctamente en la base de datos!" });
      setPreviewData(null);
      setFile(null);
      if (onSuccess) onSuccess(); // Callback para refrescar datos en otras pestañas
      setTimeout(() => setStatus({type: "", message: ""}), 4000);
    } catch (error) {
      setStatus({ type: "error", message: `Error al guardar: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="glass-card" style={{ marginBottom: "2rem", maxWidth: "800px" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--text-main)" }}>Carga Automática de Liquidaciones</h3>
        
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Compañía</label>
            <select 
              className="form-select"
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setPreviewData(null);
              }}
            >
              <option value="">Seleccione compañía</option>
              {mainCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Mes de Carga</label>
            <select 
              className="form-select"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPreviewData(null);
              }}
            >
              <option value="">Seleccione un mes</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div 
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
          style={{
            border: "2px dashed var(--border-color)",
            borderRadius: "16px",
            padding: "3rem",
            textAlign: "center",
            background: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            marginBottom: "1.5rem"
          }}
          onClick={() => document.getElementById("pdf-upload").click()}
        >
          <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <p style={{ fontWeight: "500", color: "var(--text-main)", marginBottom: "0.5rem" }}>
            {file ? `Archivo: ${file.name}` : "Arrastra y suelta el PDF de liquidación aquí"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>o haz clic para explorar</p>
          <input 
            id="pdf-upload" 
            type="file" 
            accept="application/pdf" 
            hidden 
            onChange={handleFileChange} 
          />
        </div>

        {status.message && (
          <div style={{
            padding: "1rem", 
            borderRadius: "8px", 
            backgroundColor: status.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: status.type === "success" ? "var(--success)" : "var(--accent)",
            display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem"
          }}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{status.message}</span>
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={handleProcessFile} 
          disabled={!file || !selectedCompanyId || !selectedMonth || isProcessing}
        >
          {isProcessing ? "Procesando..." : "Analizar PDF"}
        </button>
      </div>

      {previewData && (
        <div className="glass-card fade-in" style={{ maxWidth: "800px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ color: "var(--text-main)", marginBottom: "0.25rem" }}>Vista Previa de Importación</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Mes detectado: <strong style={{ color: "var(--primary)" }}>{previewData.month}</strong>
              </p>
            </div>
            <button className="btn-primary" onClick={handleSaveToDB} disabled={isProcessing}>
              Confirmar y Guardar en BD
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Productor en PDF</th>
                  <th>Productor en Sistema (Match)</th>
                  <th style={{ textAlign: "right" }}>Total Premio ($)</th>
                </tr>
              </thead>
              <tbody>
                {previewData.collections.map((c, idx) => (
                  <tr key={idx} style={{ background: c.producer_id ? "transparent" : "rgba(239, 68, 68, 0.05)" }}>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.extracted_name}</td>
                    <td style={{ fontSize: "0.85rem", fontWeight: "500", color: c.producer_id ? "var(--text-main)" : "var(--accent)" }}>
                      {c.db_name}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                      {c.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(15, 23, 42, 0.5)", fontWeight: "600", fontSize: "0.85rem" }}>
                  <td colSpan={2} style={{ padding: "0.5rem 1rem" }}>TOTAL A IMPORTAR</td>
                  <td style={{ textAlign: "right", color: "var(--success)", padding: "0.5rem 1rem" }}>
                    $ {previewData.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
