"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import api from "@/services/api"

interface ProspectDocument {
  id: number
  tipo_documento: string
  estado: string
  updated_at: string
}

export default function RejectedDocumentsPage() {
  const [documents, setDocuments] = useState<ProspectDocument[]>([])
  const [selected, setSelected] = useState<ProspectDocument | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documentos")
      const rejected = res.data.filter((doc: ProspectDocument) => doc.estado === "rechazado")
      setDocuments(rejected)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudieron cargar los documentos" })
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selected || !file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("estado", "pendiente")
    try {
      setLoading(true)
      await api.put(`/documentos/${selected.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast({ title: "Documento reenviado" })
      await fetchDocuments()
      setSelected(null)
      setFile(null)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo reenviar el documento" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reenvío de Documentos Rechazados</h1>
      {documents.length === 0 ? (
        <p className="text-gray-500">No hay documentos rechazados.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {doc.tipo_documento}
                  <span className="text-sm font-normal capitalize text-red-600">{doc.estado}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Última actualización: {new Date(doc.updated_at).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelected(doc)}>Subir corrección</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setFile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar {selected?.tipo_documento}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setFile(null); }} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!file || loading}>
              {loading ? "Enviando..." : "Enviar corrección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

