"use client"
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
import { FileText, Printer, Copy, Loader2, RefreshCw } from "lucide-react"

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
        nit: recibo.nit,
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
    } catch (err) {
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

  // Convertir imagen a base64 para usar en la ventana de impresión
  const toBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      // Método 1: Usar Image + Canvas (más compatible)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
          } else {
            resolve('')
          }
        } catch {
          resolve('')
        }
      }
      img.onerror = () => {
        // Método 2: Intentar con fetch como fallback
        fetch(url)
          .then(r => r.blob())
          .then(blob => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve('')
            reader.readAsDataURL(blob)
          })
          .catch(() => resolve(''))
      }
      img.src = url
    })
  }

  const handlePrint = async () => {
    if (!printRef.current) return
    // Registrar recibo antes de imprimir
    await registrarRecibo()

    // Pre-cargar logos como base64 para que estén disponibles inmediatamente en la ventana de impresión
    const [headerLogoB64, footerLogoB64] = await Promise.all([
      toBase64('/recursos/Logos-02.png'),
      toBase64('/recursos/Logos_Mesa.png')
    ])

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // URL absoluta como fallback si base64 falla
    const origin = window.location.origin
    const headerSrc = headerLogoB64 || `${origin}/recursos/Logos-02.png`
    const footerSrc = footerLogoB64 || `${origin}/recursos/Logos_Mesa.png`
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Pago - ${recibo.reciboNo}</title>
        <style>
          @page { size: letter; margin: 1cm 1.5cm; }
          body { font-family: 'Times New Roman', serif; font-size: 10pt; color: #000; margin: 0; padding: 15px; }
          .logo-bar { background: linear-gradient(90deg, #1e264d 0%, #26335b 100%); padding: 8px 15px; margin: -15px -15px 0 -15px; text-align: left; display: flex; align-items: center; }
          .logo-bar img { height: 38px; width: auto; display: block; }
          .gold-line { height: 2px; background: #b08b4f; margin: 0 -15px 8px -15px; }
          .header { text-align: center; margin-bottom: 10px; }
          .header h1 { font-size: 13pt; margin: 0; font-weight: bold; }
          .header p { margin: 1px 0; font-size: 9pt; }
          .footer-logos { margin-top: 15px; text-align: center; border-top: 1px solid #1e264d; padding-top: 5px; }
          .footer-logos img { height: 28px; width: auto; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .info-row span { font-size: 10pt; }
          .concepto-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          .concepto-table th { text-align: center; font-weight: bold; border: 1px solid #000; padding: 3px; font-size: 10pt; }
          .concepto-table td { border: 1px solid #000; padding: 2px 8px; font-size: 10pt; }
          .concepto-table td:last-child { text-align: right; width: 100px; }
          .pago-section { margin-top: 8px; }
          .pago-row { display: flex; gap: 10px; margin: 2px 0; font-size: 10pt; }
          .forma-pago { display: flex; gap: 15px; margin: 4px 0; }
          .forma-pago span { border: 1px solid #000; padding: 2px 10px; font-size: 9pt; }
          .forma-pago span.selected { background: #ddd; font-weight: bold; }
          .total-row { font-weight: bold; font-size: 12pt; margin-top: 6px; }
          .firma { margin-top: 25px; text-align: right; }
          .firma-line { border-top: 1px solid #000; width: 180px; margin-left: auto; margin-top: 25px; padding-top: 3px; text-align: center; font-size: 9pt; }
          .no-devolucion { font-size: 8pt; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="logo-bar">
          <img src="${headerSrc}" alt="American School of Management" />
        </div>
        <div class="gold-line"></div>
        <div class="header">
          <h1>AMERICAN</h1>
          <p style="font-size: 8pt; letter-spacing: 2px;">SCHOOL OF MANAGEMENT</p>
          <p><strong>American School of Management</strong></p>
          <p>Torre Tigo, Km. 9.5 Carretera al Salvador, Oficina 6C</p>
          <p>Cel. 5486-2301</p>
        </div>
        
        <div class="info-row">
          <span><strong>Nit:</strong> ${recibo.nit}</span>
        </div>
        <div class="info-row">
          <span><strong>Recibo Serie "A"</strong> Nº <strong style="color: red; font-size: 12pt;">${recibo.reciboNo}</strong></span>
        </div>
        <div class="info-row">
          <span><strong>Fecha</strong> ${new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
          <span><strong>Q</strong>${recibo.total}</span>
        </div>
        <div class="info-row">
          <span><strong>Recibimos de:</strong> ${recibo.recibidoDe}</span>
        </div>
        <div class="info-row">
          <span><strong>La cantidad de:</strong> ${recibo.cantidadLetras}</span>
        </div>

        <table class="concepto-table">
          <thead><tr><th colspan="2">Concepto</th></tr></thead>
          <tbody>
            <tr><td>Matrícula</td><td>Q. ${recibo.matricula || "________"}</td></tr>
            <tr><td>Mensualidad</td><td>Q. ${recibo.mensualidad || "________"}</td></tr>
            <tr><td>Mora</td><td>Q. ${recibo.mora || "________"}</td></tr>
            <tr><td>Graduación</td><td>Q. ${recibo.graduacion || "________"}</td></tr>
            <tr><td>Títulos</td><td>Q. ${recibo.titulos || "________"}</td></tr>
            <tr><td>Proyecto de Grado</td><td>Q. ${recibo.proyectoGrado || "________"}</td></tr>
            <tr><td>Otros:</td><td>Q. ${recibo.otros || "________"}</td></tr>
          </tbody>
        </table>

        <div class="pago-section">
          <div class="pago-row"><strong>Mes que cancela:</strong> ${recibo.mesQueCancela}</div>
          <p style="margin:2px 0;"><strong>Forma de pago:</strong></p>
          <div class="forma-pago">
            <span class="${recibo.formaPago === "Efectivo" ? "selected" : ""}">Efectivo</span>
            <span class="${recibo.formaPago === "Tarjeta" ? "selected" : ""}">Tarjeta</span>
            <span class="${recibo.formaPago === "Cheque" ? "selected" : ""}">Cheque</span>
            <span class="${recibo.formaPago === "Boleta" ? "selected" : ""}">Boleta</span>
          </div>
          <div class="pago-row"><strong>Fecha de pago:</strong> ${new Date(recibo.fechaPago + "T12:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
          <div class="pago-row"><strong>No. De Boleta/cheque/otro:</strong> ${recibo.noBoleta}</div>
          <div class="pago-row"><strong>Banco:</strong> ${recibo.banco}</div>
          <div class="total-row">Total Q. ${recibo.total}</div>
        </div>

        <p class="no-devolucion">No hacemos devoluciones de pago.</p>
        <div class="firma">
          <div class="firma-line">Firma y nombre de quien recibe</div>
        </div>
        <div class="footer-logos">
          <img src="${footerSrc}" alt="Logos institucionales" />
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    // Esperar a que las imágenes carguen antes de imprimir
    const images = printWindow.document.querySelectorAll('img')
    const loadPromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continuar aunque falle una imagen
      })
    })
    await Promise.all(loadPromises)
    // Pequeño delay para asegurar renderizado
    await new Promise(r => setTimeout(r, 300))
    printWindow.onafterprint = () => printWindow.close()
    printWindow.print()
    // Cerrar el diálogo después de imprimir
    onOpenChange(false)
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

        <div ref={printRef} className="space-y-4">
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
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <span className="text-lg font-bold">Total Q.</span>
            <span className="text-2xl font-bold text-blue-800">{recibo.total}</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} className="bg-blue-800 hover:bg-blue-900" disabled={registrando || !recibo.reciboNo}>
            {registrando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            {registrando ? "Registrando..." : "Imprimir Recibo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
