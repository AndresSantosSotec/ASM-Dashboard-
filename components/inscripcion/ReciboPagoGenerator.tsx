"use client"
import { jsPDF } from "jspdf"
import React, { useState, useRef, useEffect } from "react"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Printer, Copy, Loader2, RefreshCw, Download, AlertTriangle } from "lucide-react"

const BANCOS = [
  "Banco Industrial",
  "Banrural",
  "BAM",
  "G&T Continental",
  "Promerica",
  "Banco Agromercantil",
  "BAC",
  "Bantrab",
  "Vivibanco",
  "Banco Internacional",
  "Otro"
]

interface ReciboData {
  nit: string
  reciboNo: string
  fecha: string
  recibidoDe: string
  cantidadLetras: string
  matricula: string
  mensualidad: string
  mora: string
  graduacion: string
  titulos: string
  proyectoGrado: string
  otros: string
  mesQueCancela: string
  formaPago: "Efectivo" | "Tarjeta" | "Cheque" | "Boleta"
  fechaPago: string
  noBoleta: string
  banco: string
  total: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName?: string
  nit?: string
  monto?: string
  concepto?: "matricula" | "mensualidad" | "mora" | "graduacion" | "titulos" | "proyectoGrado" | "otros"
  // Auto-fill from Ficha de Inscripción
  formaPago?: string
  cuotaMensual?: string
  cantidadMeses?: string
  inversionTotal?: string
  convenioNombre?: string
  programa?: string
  telefono?: string
  email?: string
}

const numberToWords = (num: number): string => {
  const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"]
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"]

  if (num === 0) return "cero"
  if (num === 100) return "cien"

  let result = ""
  if (num >= 1000) {
    const miles = Math.floor(num / 1000)
    if (miles === 1) result += "mil "
    else result += numberToWords(miles) + " mil "
    num %= 1000
  }
  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)] + " "
    num %= 100
  }
  if (num >= 20) {
    result += tens[Math.floor(num / 10)]
    if (num % 10 > 0) result += " y " + units[num % 10]
    else result += " "
  } else if (num >= 10) {
    result += teens[num - 10] + " "
  } else if (num > 0) {
    result += units[num] + " "
  }

  return result.trim()
}

const amountToWords = (amount: string): string => {
  const num = parseFloat(amount.replace(/,/g, "")) || 0
  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)
  let text = numberToWords(intPart)
  text = text.charAt(0).toUpperCase() + text.slice(1)
  if (decPart > 0) {
    text += ` con ${decPart}/100`
  } else {
    text += " exactos"
  }
  return text
}

export default function ReciboPagoGenerator({
  open, onOpenChange, studentName, nit, monto, concepto,
  formaPago, cuotaMensual, cantidadMeses, inversionTotal, convenioNombre,
  programa, telefono, email,
}: Props) {
  const today = new Date().toISOString().split("T")[0]
  const printRef = useRef<HTMLDivElement>(null)
  const [generandoNumero, setGenerandoNumero] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Mapear forma de pago del sistema al recibo
  const mapFormaPago = (fp?: string): "Efectivo" | "Tarjeta" | "Cheque" | "Boleta" => {
    if (!fp) return "Boleta"
    const map: Record<string, "Efectivo" | "Tarjeta" | "Cheque" | "Boleta"> = {
      deposito: "Boleta",
      debito: "Tarjeta",
      transferencia: "Boleta",
      tarjeta: "Tarjeta",
    }
    return map[fp] || "Boleta"
  }

  const [recibo, setRecibo] = useState<ReciboData>({
    nit: "",
    reciboNo: "",
    fecha: today,
    recibidoDe: studentName || "",
    cantidadLetras: monto ? amountToWords(monto) : "",
    matricula: concepto === "matricula" ? (monto || "") : "",
    mensualidad: concepto === "mensualidad" ? (monto || cuotaMensual?.replace(/,/g, "") || "") : (cuotaMensual?.replace(/,/g, "") || ""),
    mora: concepto === "mora" ? (monto || "") : "",
    graduacion: concepto === "graduacion" ? (monto || "") : "",
    titulos: concepto === "titulos" ? (monto || "") : "",
    proyectoGrado: concepto === "proyectoGrado" ? (monto || "") : "",
    otros: concepto === "otros" ? (monto || "") : "",
    mesQueCancela: "",
    formaPago: mapFormaPago(formaPago),
    fechaPago: today,
    noBoleta: "",
    banco: "",
    total: monto || "",
  })

  // Sincronizar datos cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      const matriculaVal = monto?.replace(/,/g, "") || ""
      const mensualidadVal = cuotaMensual?.replace(/,/g, "") || ""
      const newData: ReciboData = {
        ...recibo,
        recibidoDe: studentName || recibo.recibidoDe,
        nit: nit || recibo.nit,
        matricula: matriculaVal,
        mensualidad: mensualidadVal,
        formaPago: mapFormaPago(formaPago),
        fecha: today,
        fechaPago: today,
        total: "",
        cantidadLetras: "",
        mora: recibo.mora,
        graduacion: recibo.graduacion,
        titulos: recibo.titulos,
        proyectoGrado: recibo.proyectoGrado,
        otros: recibo.otros,
      }
      setRecibo(recalculate(newData))

      // Auto-generar número de recibo si está vacío
      if (!recibo.reciboNo) {
        generarNumeroRecibo()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Generar siguiente número de recibo vía API
  const generarNumeroRecibo = async () => {
    setGenerandoNumero(true)
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const { data } = await axios.get(`${API_BASE_URL}/api/recibos/siguiente-numero`, {
        params: { serie: "A" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (data.success && data.numero_recibo) {
        setRecibo(prev => ({ ...prev, reciboNo: data.numero_recibo }))
      }
    } catch (err) {
      console.warn("No se pudo generar número de recibo automático:", err)
    } finally {
      setGenerandoNumero(false)
    }
  }





  // Registrar recibo emitido en el backend
  const registrarRecibo = async () => {
    if (!recibo.reciboNo) return
    setRegistrando(true)
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      await axios.post(`${API_BASE_URL}/api/recibos/registrar`, {
        numero_recibo: recibo.reciboNo,
        recibido_de: recibo.recibidoDe,
        nit: recibo.nit,
        total: parseFloat(recibo.total) || 0,
        concepto: concepto || "matricula",
        forma_pago: recibo.formaPago,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        console.log("Recibo ya registrado, continuando...")
        return
      }
      console.warn("No se pudo registrar el recibo:", err)
    } finally {
      setRegistrando(false)
    }
  }

  // Recalcular total y cantidad en letras
  const recalculate = (data: ReciboData) => {
    const values = [data.matricula, data.mensualidad, data.mora, data.graduacion, data.titulos, data.proyectoGrado, data.otros]
    const total = values.reduce((sum, v) => sum + (parseFloat(v.replace(/,/g, "")) || 0), 0)
    const totalStr = total.toFixed(2)
    return { ...data, total: totalStr, cantidadLetras: amountToWords(totalStr) }
  }

  const update = (field: keyof ReciboData, value: string) => {
    setRecibo(prev => {
      const updated = { ...prev, [field]: value }
      if (["matricula", "mensualidad", "mora", "graduacion", "titulos", "proyectoGrado", "otros"].includes(field)) {
        return recalculate(updated)
      }
      return updated
    })
  }

  // Helper para resolver rutas de assets (public) con el prefix de Next.js
  const resolveAssetUrl = (path: string) => {
    if (path.startsWith("http")) return path

    const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost"
    const prefix = "/webpanel"

    if (isLocal && !path.startsWith(prefix)) {
      return path
    }

    if (path.startsWith(prefix)) return path
    return `${prefix}${path.startsWith("/") ? "" : "/"}${path}`
  }

  // Convertir imagen a base64 con manejo de errores robusto
  const toBase64 = async (url: string): Promise<string> => {
    const loadImg = (src: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              resolve(canvas.toDataURL("image/png"))
            } else {
              resolve("")
            }
          } catch {
            resolve("")
          }
        }
        img.onerror = () => resolve("")
        img.src = src
      })
    }

    let b64 = await loadImg(resolveAssetUrl(url))
    if (b64) return b64

    if (!url.startsWith("http")) {
      const rootUrl = url.startsWith("/") ? url : `/${url}`
      b64 = await loadImg(rootUrl)
      if (b64) return b64
    }

    return ""
  }

  const handleDownloadPDF = async () => {
    setIsPrinting(true)
    try {
      // Registrar recibo antes de descargar
      await registrarRecibo()

      // Pre-cargar logos con fallback robusto
      const [headerLogoB64, footerLogoB64] = await Promise.all([
        toBase64('/recursos/Logos-02.png'),
        toBase64('/recursos/Logos_Mesa.png')
      ])

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      })

      // Configuración de fuentes y estilos
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      // --- Header ---
      // Logo Izquierdo
      if (headerLogoB64) {
        doc.addImage(headerLogoB64, 'PNG', 40, 30, 100, 40)
      }

      // Información Institucional (Centrado)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("AMERICAN", 306, 50, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      // LETTER SPACING SIMULADO
      doc.text("S C H O O L   O F   M A N A G E M E N T", 306, 62, { align: "center" })

      doc.setFont("helvetica", "bold")
      doc.text("American School of Management", 306, 75, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.text("Torre Tigo, Km. 9.5 Carretera al Salvador, Oficina 6C", 306, 87, { align: "center" })
      doc.text("Cel. 5486-2301", 306, 99, { align: "center" })

      // --- Info Section ---
      const startY = 130

      // Line 1: Nit left, Recibo No right
      doc.setFont("helvetica", "bold")
      doc.text("Nit:", 40, startY)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.nit || "C/F", 70, startY)

      doc.setFont("helvetica", "bold")
      doc.text('Recibo Serie "A" Nº', 380, startY)
      doc.setTextColor(200, 0, 0) // Red
      doc.setFontSize(12)
      doc.text(recibo.reciboNo || "", 500, startY)
      doc.setTextColor(0, 0, 0) // Black
      doc.setFontSize(10)

      // Line 2: Fecha left, Total right
      const line2Y = startY + 20
      doc.setFont("helvetica", "bold")
      doc.text("Fecha", 40, line2Y)
      doc.setFont("helvetica", "normal")
      const formattedDate = new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })
      doc.text(formattedDate, 80, line2Y)

      doc.setFont("helvetica", "bold")
      doc.text("Q", 480, line2Y)
      doc.setFont("helvetica", "normal")
      // Alineando a la derecha
      const totalStr = parseFloat(recibo.total).toFixed(2)
      doc.text(totalStr, 520, line2Y)

      // Line 3: Recibimos de
      const line3Y = line2Y + 20
      doc.setFont("helvetica", "bold")
      doc.text("Recibimos de:", 40, line3Y)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.recibidoDe || "", 120, line3Y)

      // Line 4: Cantidad de
      const line4Y = line3Y + 20
      doc.setFont("helvetica", "bold")
      doc.text("La cantidad de:", 40, line4Y)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.cantidadLetras || "", 125, line4Y)

      // --- Table ---
      let tableY = line4Y + 25
      const colWidth1 = 400
      const colWidth2 = 132
      const rowHeight = 20

      // Header Table
      doc.setLineWidth(1)
      doc.rect(40, tableY, colWidth1 + colWidth2, rowHeight) // Border header
      doc.line(40 + colWidth1, tableY, 40 + colWidth1, tableY + rowHeight) // Split header

      doc.setFont("helvetica", "bold")
      doc.text("Concepto", 40 + (colWidth1 + colWidth2) / 2, tableY + 14, { align: "center" })

      tableY += rowHeight

      // Rows
      const concepts = [
        { label: "Matrícula", value: recibo.matricula },
        { label: "Mensualidad", value: recibo.mensualidad },
        { label: "Mora", value: recibo.mora },
        { label: "Graduación", value: recibo.graduacion },
        { label: "Títulos", value: recibo.titulos },
        { label: "Proyecto de Grado", value: recibo.proyectoGrado },
        { label: "Otros:", value: recibo.otros },
      ]

      doc.setFont("helvetica", "normal")
      concepts.forEach((item) => {
        doc.rect(40, tableY, colWidth1 + colWidth2, rowHeight) // Outer border
        doc.line(40 + colWidth1, tableY, 40 + colWidth1, tableY + rowHeight) // Split col

        doc.text(item.label, 45, tableY + 14)
        const valStr = `Q. ${item.value ? parseFloat(item.value).toFixed(2) : "________"}`
        // Right align text in second col
        // Column starts at 40+colWidth1 (440). Width is 132. End is 572.
        // We want to align maybe at 560
        doc.text(valStr, 560, tableY + 14, { align: "right" })

        tableY += rowHeight
      })

      // --- Payment Section ---
      let footerY = tableY + 20

      doc.setFont("helvetica", "bold")
      doc.text("Mes que cancela:", 40, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.mesQueCancela || "________________", 130, footerY)

      footerY += 20
      doc.setFont("helvetica", "bold")
      doc.text("Forma de pago:", 40, footerY)

      // Checkboxes
      const payOptions = ["Efectivo", "Tarjeta", "Cheque", "Boleta"]
      let checkX = 130
      payOptions.forEach(opt => {
        const isSelected = recibo.formaPago === opt
        doc.setDrawColor(0)

        // Draw square
        if (isSelected) {
          doc.setFillColor(230, 230, 230)
          doc.rect(checkX, footerY - 10, 60, 15, "FD")
          doc.setFont("helvetica", "bold")
        } else {
          doc.rect(checkX, footerY - 10, 60, 15)
          doc.setFont("helvetica", "normal")
        }

        doc.text(opt, checkX + 30, footerY + 1, { align: "center" })
        checkX += 70
      })

      footerY += 25
      doc.setFont("helvetica", "bold")
      doc.text("Fecha de pago:", 40, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(new Date(recibo.fechaPago + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" }), 120, footerY)

      footerY += 20
      doc.setFont("helvetica", "bold")
      doc.text("No. De Boleta/cheque/otro:", 40, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.noBoleta || "________________", 180, footerY)

      footerY += 20
      doc.setFont("helvetica", "bold")
      doc.text("Banco:", 40, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(recibo.banco || "________________", 90, footerY)

      footerY += 25
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Total Q. ${parseFloat(recibo.total).toFixed(2)}`, 40, footerY)

      footerY += 30
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("No hacemos devoluciones de pago.", 40, footerY)

      // Signature area (Right aligned)
      doc.line(350, footerY, 550, footerY) // Line
      doc.setFont("helvetica", "normal")
      doc.text("Firma y nombre de quien recibe", 450, footerY + 12, { align: "center" })

      // Footer Logo
      if (footerLogoB64) {
        doc.addImage(footerLogoB64, 'PNG', 260, footerY + 30, 100, 30)
      }

      doc.save(`Recibo-${recibo.reciboNo}.pdf`)

    } catch (e) {
      console.error("Error al generar PDF:", e)
    } finally {
      setIsPrinting(false)
    }
  }

  const handlePrint = async () => {
    // Registrar recibo antes de imprimir
    await registrarRecibo()

    // Pre-cargar logos
    const [headerLogoB64, footerLogoB64] = await Promise.all([
      toBase64('/recursos/Logos-02.png'),
      toBase64('/recursos/Logos_Mesa.png')
    ])

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Fallback: si toBase64 falló (string vacío), usar ruta directa
    const headerSrc = headerLogoB64 || resolveAssetUrl("/recursos/Logos-02.png")
    const footerSrc = footerLogoB64 || resolveAssetUrl("/recursos/Logos_Mesa.png")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo - ${recibo.reciboNo}</title>
        <style>
          @page { size: letter; margin: 1cm 1.5cm; }
          body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 20px; }
          .header-container { position: relative; text-align: center; margin-bottom: 20px; }
          .header-logo { position: absolute; left: 0; top: 0; height: 50px; }
          .header-info h1 { font-size: 14pt; margin: 0; font-weight: bold; }
          .header-info p { margin: 1px 0; font-size: 8.5pt; }
          .data-line { margin: 4px 0; line-height: 1.4; }
          .data-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .concepto-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 1.2px solid #000; }
          .concepto-table th { border: 1.2px solid #000; padding: 4px; font-weight: bold; text-align: center; background: #fff; }
          .concepto-table td { border: 1.2px solid #000; padding: 3px 10px; }
          .amount-cell { text-align: right; width: 130px; }
          .payment-grid { display: flex; gap: 15px; margin: 10px 0; align-items: center; }
          .payment-option { border: 1px solid #000; padding: 2px 12px; font-size: 9pt; min-width: 70px; text-align: center; }
          .payment-option.selected { background: #eee; font-weight: bold; }
          .signature-box { margin-top: 50px; text-align: right; }
          .signature-line { border-top: 1px solid #000; width: 220px; margin-left: auto; text-align: center; padding-top: 5px; font-size: 9pt; }
          .footer-logos { margin-top: 40px; text-align: center; }
          .footer-logos img { height: 35px; }
          .no-devolucion { font-size: 8pt; font-weight: bold; margin-top: 10px; }
          @media print {
            .payment-option.selected { background-color: #ddd !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body onload="setTimeout(function(){ window.print(); window.close(); }, 800)">
        <div class="header-container">
          <img src="${headerSrc}" class="header-logo" alt="Logo" />
          <div class="header-info">
            <h1>AMERICAN</h1>
            <p style="letter-spacing: 2px;">SCHOOL OF MANAGEMENT</p>
            <p><strong>American School of Management</strong></p>
            <p>Torre Tigo, Km. 9.5 Carretera al Salvador, Oficina 6C</p>
            <p>Cel. 5486-2301</p>
          </div>
        </div>

        <div class="data-line"><strong>Nit:</strong> ${recibo.nit || "C/F"}</div>
        <div class="data-line"><strong>Recibo Serie "A"</strong> Nº <strong style="color: red; font-size: 12pt;">${recibo.reciboNo}</strong></div>
        <div class="data-row">
          <span><strong>Fecha</strong> ${new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-GT")}</span>
          <span style="font-weight: bold;">Q${parseFloat(recibo.total).toFixed(2)}</span>
        </div>
        <div class="data-line"><strong>Recibimos de:</strong> ${recibo.recibidoDe}</div>
        <div class="data-line"><strong>La cantidad de:</strong> ${recibo.cantidadLetras}</div>

        <table class="concepto-table">
          <thead><tr><th colspan="2">Concepto</th></tr></thead>
          <tbody>
            <tr><td>Matrícula</td><td class="amount-cell">Q. ${recibo.matricula || "________"}</td></tr>
            <tr><td>Mensualidad</td><td class="amount-cell">Q. ${recibo.mensualidad || "________"}</td></tr>
            <tr><td>Mora</td><td class="amount-cell">Q. ${recibo.mora || "________"}</td></tr>
            <tr><td>Graduación</td><td class="amount-cell">Q. ${recibo.graduacion || "________"}</td></tr>
            <tr><td>Títulos</td><td class="amount-cell">Q. ${recibo.titulos || "________"}</td></tr>
            <tr><td>Proyecto de Grado</td><td class="amount-cell">Q. ${recibo.proyectoGrado || "________"}</td></tr>
            <tr><td>Otros:</td><td class="amount-cell">Q. ${recibo.otros || "________"}</td></tr>
          </tbody>
        </table>

        <div class="data-line"><strong>Mes que cancela:</strong> ${recibo.mesQueCancela || "________________"}</div>
        <div style="margin-top: 10px;"><strong>Forma de pago:</strong></div>
        <div class="payment-grid">
          <div class="payment-option ${recibo.formaPago === "Efectivo" ? "selected" : ""}">Efectivo</div>
          <div class="payment-option ${recibo.formaPago === "Tarjeta" ? "selected" : ""}">Tarjeta</div>
          <div class="payment-option ${recibo.formaPago === "Cheque" ? "selected" : ""}">Cheque</div>
          <div class="payment-option ${recibo.formaPago === "Boleta" ? "selected" : ""}">Boleta</div>
        </div>
        <div class="data-line" style="margin-top: 10px;"><strong>Fecha de pago:</strong> ${new Date(recibo.fechaPago + "T12:00:00").toLocaleDateString("es-GT")}</div>
        <div class="data-line"><strong>No. De Boleta/cheque/otro:</strong> ${recibo.noBoleta || "________________"}</div>
        <div class="data-line"><strong>Banco:</strong> ${recibo.banco || "________________"}</div>
        <div style="font-weight: bold; margin-top: 10px; font-size: 11pt;">Total Q. ${parseFloat(recibo.total).toFixed(2)}</div>

        <p class="no-devolucion">No hacemos devoluciones de pago.</p>
        
        <div class="signature-box">
          <div class="signature-line">Firma y nombre de quien recibe</div>
        </div>

        <div class="footer-logos">
          <img src="${footerSrc}" alt="Footer" />
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generar Recibo de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Vista Previa del Recibo (Visualización) */}
          <div className="border rounded-lg bg-white shadow-inner p-6 overflow-hidden hidden md:block select-none scale-[0.85] origin-top border-gray-200">
            <div className="relative text-center mb-6">
              <img
                src={resolveAssetUrl("/recursos/Logos-02.png")}
                alt="ASM Logo"
                className="absolute left-0 top-0 h-12 w-auto"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <h2 className="text-xl font-bold m-0 leading-tight">AMERICAN</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] m-0 text-gray-500">School of Management</p>
              <p className="text-[10px] font-bold mt-1">American School of Management</p>
              <p className="text-[9px] text-gray-500">Torre Tigo, Km. 9.5 Carretera al Salvador, Oficina 6C</p>
              <p className="text-[9px] text-gray-500">Cel. 5486-2301</p>
            </div>

            <div className="space-y-1 mb-4">
              <p className="text-xs"><strong>Nit:</strong> {recibo.nit || "________________"}</p>
              <p className="text-xs"><strong>Recibo Serie "A"</strong> Nº <span className="text-red-600 font-bold">{recibo.reciboNo || "0000"}</span></p>
              <div className="flex justify-between text-xs">
                <span><strong>Fecha:</strong> {new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-GT")}</span>
                <span className="font-bold">Q{recibo.total || "0.00"}</span>
              </div>
              <p className="text-xs"><strong>Recibimos de:</strong> {recibo.recibidoDe || "________________"}</p>
              <p className="text-xs"><strong>La cantidad de:</strong> {recibo.cantidadLetras || "________________"}</p>
            </div>

            <div className="border border-black rounded p-0 text-xs mb-4">
              <div className="grid grid-cols-[1fr_120px] bg-gray-50 border-b border-black font-bold">
                <div className="p-2 border-r border-black text-center">Concepto</div>
                <div className="p-2 text-center">Total</div>
              </div>
              <div className="grid grid-cols-[1fr_120px] border-b border-black">
                <div className="p-1 px-3 border-r border-black">Matrícula:</div>
                <div className="p-1 px-3 text-right">Q{recibo.matricula || "0.00"}</div>
              </div>
              <div className="grid grid-cols-[1fr_120px] border-b border-black">
                <div className="p-1 px-3 border-r border-black">Mensualidad:</div>
                <div className="p-1 px-3 text-right">Q{recibo.mensualidad || "0.00"}</div>
              </div>
              <div className="grid grid-cols-[1fr_120px] border-b border-black">
                <div className="p-1 px-3 border-r border-black">Otros:</div>
                <div className="p-1 px-3 text-right">Q{recibo.otros || "0.00"}</div>
              </div>
              <div className="grid grid-cols-[1fr_120px]">
                <div className="p-1 px-3 border-r border-black font-bold">Total General:</div>
                <div className="p-1 px-3 text-right font-bold">Q{recibo.total || "0.00"}</div>
              </div>
            </div>

            <div className="text-[10px] text-center pt-2">
              <img
                src={resolveAssetUrl("/recursos/Logos_Mesa.png")}
                alt="Footer Logos"
                className="h-8 w-auto mx-auto mb-1 opacity-80"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>
          {/* Encabezado info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>NIT</Label>
              <Input value={recibo.nit} onChange={(e) => update("nit", e.target.value)} placeholder="Ej: 10775605-6" />
            </div>
            <div>
              <Label>Recibo No.</Label>
              <div className="flex gap-2">
                <Input
                  value={recibo.reciboNo}
                  onChange={(e) => update("reciboNo", e.target.value)}
                  placeholder={generandoNumero ? "Generando..." : "Auto-generado"}
                  readOnly={generandoNumero}
                  className={generandoNumero ? "bg-gray-100" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generarNumeroRecibo}
                  disabled={generandoNumero}
                  title="Generar nuevo número de recibo"
                >
                  {generandoNumero ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={recibo.fecha} onChange={(e) => update("fecha", e.target.value)} />
            </div>
            <div>
              <Label>Recibimos de</Label>
              <Input value={recibo.recibidoDe} onChange={(e) => update("recibidoDe", e.target.value)} placeholder="Nombre completo" />
            </div>
          </div>

          <div>
            <Label>La cantidad de (en letras)</Label>
            <Input value={recibo.cantidadLetras} onChange={(e) => update("cantidadLetras", e.target.value)} className="bg-gray-50" />
          </div>

          {/* Conceptos */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-center">Concepto</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Matrícula Q.</Label>
                <Input value={recibo.matricula} onChange={(e) => update("matricula", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm">Mensualidad Q.</Label>
                <Input value={recibo.mensualidad} onChange={(e) => update("mensualidad", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm">Mora Q.</Label>
                <Input value={recibo.mora} onChange={(e) => update("mora", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm">Graduación Q.</Label>
                <Input value={recibo.graduacion} onChange={(e) => update("graduacion", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm">Títulos Q.</Label>
                <Input value={recibo.titulos} onChange={(e) => update("titulos", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm">Proyecto de Grado Q.</Label>
                <Input value={recibo.proyectoGrado} onChange={(e) => update("proyectoGrado", e.target.value)} placeholder="0.00" />
              </div>
              <div className="col-span-2">
                <Label className="text-sm">Otros Q.</Label>
                <Input value={recibo.otros} onChange={(e) => update("otros", e.target.value)} placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Detalles de pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mes que cancela</Label>
              <Input value={recibo.mesQueCancela} onChange={(e) => update("mesQueCancela", e.target.value)} placeholder="Ej: Febrero 2026" />
            </div>
            <div>
              <Label>Forma de pago</Label>
              <Select value={recibo.formaPago} onValueChange={(v) => update("formaPago", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Boleta">Boleta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Fecha de pago</Label>
              <Input type="date" value={recibo.fechaPago} onChange={(e) => update("fechaPago", e.target.value)} />
            </div>
            <div>
              <Label>No. Boleta/Cheque/Otro</Label>
              <Input value={recibo.noBoleta} onChange={(e) => update("noBoleta", e.target.value)} />
            </div>
            <div>
              <Label>Banco</Label>
              <Select
                value={BANCOS.includes(recibo.banco) ? recibo.banco : recibo.banco ? "Otro" : ""}
                onValueChange={(v) => {
                  if (v === "Otro") {
                    update("banco", "Otro")
                  } else {
                    update("banco", v)
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione el banco" /></SelectTrigger>
                <SelectContent>
                  {BANCOS.map((banco) => (
                    <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(recibo.banco === "Otro" || (recibo.banco && !BANCOS.includes(recibo.banco))) && (
                <Input
                  className="mt-2"
                  value={recibo.banco === "Otro" ? "" : recibo.banco}
                  onChange={(e) => update("banco", e.target.value || "Otro")}
                  placeholder="Nombre del banco"
                />
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <span className="text-lg font-bold text-blue-900">Total Q.</span>
            <span className="text-2xl font-black text-blue-800">
              {parseFloat(recibo.total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <iframe
          ref={iframeRef}
          style={{ position: 'absolute', width: 0, height: 0, border: 'none', visibility: 'hidden' }}
          title="Print Frame"
        />

        {registrando && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center gap-2 text-sm animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Registrando recibo en el sistema...
          </div>
        )}


        <DialogFooter className="flex flex-wrap gap-2 sm:justify-between items-center sm:gap-0 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 order-last sm:order-first">
            Cerrar Ventana
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none border-blue-800 text-blue-800 hover:bg-blue-50"
              disabled={registrando || !recibo.reciboNo || isPrinting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isPrinting ? "Generando PDF..." : "Descargar Recibo"}
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-blue-800 hover:bg-blue-900 text-white"
              disabled={registrando || !recibo.reciboNo || isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              {isPrinting ? "Imprimiendo..." : "Imprimir Recibo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
