"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, XCircle, FileSignature, Send } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"

interface Programa {
  id: number
  nombre_del_programa: string
  abreviatura?: string
  meses?: number
}

interface EstudiantePrograma {
  id: number
  prospecto_id: number
  programa_id: number
  inscripcion: number | null
  cuota_mensual: number | null
  convenio_id: number | null
  duracion_meses?: number | null
  programa?: Programa
}

interface ProspectoData {
  id: number
  nombre_completo: string
  correo_electronico: string
  programas?: EstudiantePrograma[]
}

interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
}

export default function NuevoContratoPage() {
  const params = useParams()
  const router = useRouter()
  const prospectoId = params.prospectoId as string

  const [prospecto, setProspecto] = useState<ProspectoData | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)
  const [firmaFile, setFirmaFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tokenFirma, setTokenFirma] = useState<string | null>(null)
  const [urlFirmaEstudiante, setUrlFirmaEstudiante] = useState<string | null>(null)
  const [contratoId, setContratoId] = useState<number | null>(null)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token || !prospectoId) {
      setLoading(false)
      setError("No autorizado o prospecto no especificado")
      return
    }

    const load = async () => {
      try {
        const [resProspecto, resUser] = await Promise.all([
          fetch(`${API_BASE_URL}/api/prospectos/${prospectoId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!resProspecto.ok) {
          setError("Prospecto no encontrado")
          setLoading(false)
          return
        }
        const dataProspecto = await resProspecto.json()
        setProspecto(dataProspecto.data)

        if (resUser.ok) {
          const dataUser = await resUser.json()
          setUser(dataUser)
        }
      } catch {
        setError("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [prospectoId])

  const estProg = prospecto?.programas?.filter((p) => p.programa)?.[0] ?? null
  const programa = estProg?.programa

  const buildDatosContrato = (): Record<string, unknown> | null => {
    if (!prospecto || !programa || !user) return null
    const ahora = new Date()
    const fechaStr = ahora.toLocaleDateString("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const fecha = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)

    return {
      prospecto: prospecto.nombre_completo,
      email: prospecto.correo_electronico,
      programa: programa.nombre_del_programa,
      programa_abreviatura: programa.abreviatura || programa.nombre_del_programa?.slice(0, 3) || "",
      matricula: String(estProg?.inscripcion ?? 0),
      mensualidad: estProg?.cuota_mensual != null ? String(estProg.cuota_mensual) : null,
      convenio_id: estProg?.convenio_id ?? null,
      asesor: `${user.first_name} ${user.last_name}`.trim(),
      fecha,
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setFirmaFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setFirmaBase64(data)
    }
    reader.readAsDataURL(file)
  }

  const guardarFirma = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token || !prospectoId || !firmaBase64) return
    const datos = buildDatosContrato()
    if (!datos) return

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/contratos/firma-asesor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prospecto_id: Number(prospectoId),
          firma_asesor: firmaBase64,
          datos_contrato: datos,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTokenFirma(data.token)
        setUrlFirmaEstudiante(data.url_firma_estudiante)
        setContratoId(data.contrato_id)
      } else {
        setError(data.message || "Error al guardar la firma")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar la firma")
    } finally {
      setSaving(false)
    }
  }

  const enviarContrato = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token || !prospectoId || !firmaBase64 || !tokenFirma || !urlFirmaEstudiante) return

    setEnviando(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/prospectos/${prospectoId}/enviar-contrato`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature: firmaBase64,
          url_firma_estudiante: urlFirmaEstudiante,
          token_firma: tokenFirma,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        router.push("/firma/contratos")
      } else {
        setError(data.message || data.error || "Error al enviar el contrato")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar el contrato")
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error && !prospecto) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => router.push("/firma/contratos")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a contratos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/firma/contratos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-primary">Generar contrato y firma digital</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prospecto y programa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Nombre:</strong> {prospecto?.nombre_completo}</p>
            <p><strong>Correo:</strong> {prospecto?.correo_electronico}</p>
            <p><strong>Programa:</strong> {programa?.nombre_del_programa}</p>
            <p><strong>Asesor:</strong> {user ? `${user.first_name} ${user.last_name}` : "—"}</p>
          </CardContent>
        </Card>

        {!tokenFirma ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Firma del asesor
              </CardTitle>
              <p className="text-sm text-gray-600">
                Sube una imagen de tu firma (PNG o JPG). Se usará la misma lógica que el módulo de firma digital.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Imagen de firma</Label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700"
                />
              </div>
              {firmaBase64 && (
                <div className="border rounded-lg p-4 bg-gray-50 inline-block">
                  <img src={firmaBase64} alt="Vista previa firma" className="max-h-24 object-contain" />
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                onClick={guardarFirma}
                disabled={saving || !firmaBase64 || !buildDatosContrato()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSignature className="h-4 w-4 mr-2" />}
                {saving ? "Guardando..." : "Guardar firma y generar contrato"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800">Contrato generado</CardTitle>
              <p className="text-sm text-green-700">
                Enlace para que el estudiante firme:
              </p>
              <a
                href={urlFirmaEstudiante ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-600 underline break-all"
              >
                {urlFirmaEstudiante}
              </a>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={enviarContrato}
                disabled={enviando}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {enviando ? "Enviando..." : "Enviar contrato por correo al estudiante"}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button variant="outline" onClick={() => router.push("/firma/contratos")}>
                Ir a lista de contratos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
