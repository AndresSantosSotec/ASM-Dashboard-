"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  Upload,
  Search,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para la carga de boletas
const boletaData = {
  banks: [
    { id: "bank-001", name: "Banco Industrial" },
    { id: "bank-002", name: "Banrural" },
    { id: "bank-003", name: "Banco G&T" },
    { id: "bank-004", name: "BAC Credomatic" },
    { id: "bank-005", name: "Banco Promerica" },
  ],
  students: [
    { id: "est-001", name: "Juan Pérez", carnet: "2025-0123", program: "Desarrollo Web Full Stack" },
    { id: "est-002", name: "María López", carnet: "2025-0124", program: "Diseño UX/UI" },
    { id: "est-003", name: "Carlos Rodríguez", carnet: "2025-0125", program: "Data Science" },
    { id: "est-004", name: "Ana Martínez", carnet: "2025-0126", program: "Desarrollo Web Full Stack" },
    { id: "est-005", name: "Roberto Gómez", carnet: "2024-0987", program: "Ciberseguridad" },
  ],
  recentUploads: [
    {
      id: "upload-001",
      studentName: "Juan Pérez",
      studentId: "2025-0123",
      bank: "Banco Industrial",
      receiptNumber: "BI-123456",
      amount: 750,
      date: "2025-03-10",
      authNumber: "AUTH-987654",
      status: "pendiente",
      uploadDate: "2025-03-10",
    },
    {
      id: "upload-002",
      studentName: "María López",
      studentId: "2025-0124",
      bank: "Banrural",
      receiptNumber: "BR-654321",
      amount: 750,
      date: "2025-03-09",
      authNumber: "AUTH-123456",
      status: "conciliado",
      uploadDate: "2025-03-09",
    },
  ],
}

export function SubirBoleta() {
  const [activeTab, setActiveTab] = useState("upload-receipt")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    bank: "",
    receiptNumber: "",
    amount: "",
    date: "",
    authNumber: "",
    notes: "",
  })

  // Función para buscar estudiante
  const handleSearchStudent = () => {
    // Simulación de búsqueda - En producción, esto sería una llamada a API
    const foundStudent = boletaData.students.find(
      (student) =>
        student.carnet.toLowerCase() === searchQuery.toLowerCase() ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setSelectedStudent(foundStudent || null)

    if (!foundStudent) {
      alert("Estudiante no encontrado. Verifique el carnet o nombre.")
    }
  }

  // Función para manejar cambios en el formulario
  const handleFormChange = (field: string, value: string) => {
    setUploadForm({
      ...uploadForm,
      [field]: value,
    })
  }

  // Función para subir boleta
  const handleUploadReceipt = () => {
    if (!selectedStudent) {
      alert("Debe seleccionar un estudiante primero.")
      return
    }

    if (!uploadForm.bank || !uploadForm.receiptNumber || !uploadForm.amount || !uploadForm.date) {
      alert("Por favor complete todos los campos obligatorios.")
      return
    }

    // Simulación de carga
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)

          // Resetear formulario
          setUploadForm({
            bank: "",
            receiptNumber: "",
            amount: "",
            date: "",
            authNumber: "",
            notes: "",
          })
          setSelectedStudent(null)
          setSearchQuery("")

          alert("Boleta cargada correctamente. Pendiente de conciliación.")
          return 0
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subir Boleta de Pago</h2>
        <p className="text-muted-foreground">Cargue boletas de pago para su posterior conciliación</p>
      </div>

      <Tabs defaultValue="upload-receipt" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload-receipt">Cargar Boleta</TabsTrigger>
          <TabsTrigger value="recent-uploads">Cargas Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="upload-receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Estudiante</CardTitle>
              <CardDescription>Ingrese el carnet o nombre del estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por carnet o nombre..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearchStudent}>Buscar</Button>
              </div>

              {selectedStudent && (
                <div className="mt-4 p-4 border rounded-md">
                  <h4 className="text-sm font-medium mb-2">Estudiante Seleccionado</h4>
                  <div className="space-y-1">
                    <div className="font-medium">{selectedStudent.name}</div>
                    <div className="text-sm text-muted-foreground">Carnet: {selectedStudent.carnet}</div>
                    <div className="text-sm text-muted-foreground">Programa: {selectedStudent.program}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de la Boleta</CardTitle>
              <CardDescription>Ingrese la información de la boleta de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">
                    Banco <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={uploadForm.bank}
                    onValueChange={(value) => handleFormChange("bank", value)}
                    disabled={!selectedStudent || isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {boletaData.banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt-number">
                    Número de Boleta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="receipt-number"
                    placeholder="Ej: BI-123456"
                    value={uploadForm.receiptNumber}
                    onChange={(e) => handleFormChange("receiptNumber", e.target.value)}
                    disabled={!selectedStudent || isUploading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Monto (Q) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ej: 750"
                    value={uploadForm.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    disabled={!selectedStudent || isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Fecha <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={uploadForm.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    disabled={!selectedStudent || isUploading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-number">Número de Autorización</Label>
                <Input
                  id="auth-number"
                  placeholder="Ej: AUTH-987654"
                  value={uploadForm.authNumber}
                  onChange={(e) => handleFormChange("authNumber", e.target.value)}
                  disabled={!selectedStudent || isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-image">
                  Imagen de la Boleta <span className="text-red-500">*</span>
                </Label>
                <Input id="receipt-image" type="file" disabled={!selectedStudent || isUploading} />
                <p className="text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, PDF (máx. 5MB)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Ingrese cualquier información adicional relevante..."
                  value={uploadForm.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  disabled={!selectedStudent || isUploading}
                  rows={3}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Label>Progreso de carga</Label>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}% completado</p>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  La boleta quedará pendiente de conciliación por el departamento financiero. Una vez conciliada, se
                  actualizará el estado de cuenta del estudiante.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto" onClick={handleUploadReceipt} disabled={!selectedStudent || isUploading}>
                <Upload className="mr-2 h-4 w-4" /> Cargar Boleta
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="recent-uploads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cargas Recientes</CardTitle>
              <CardDescription>Boletas cargadas recientemente por usted</CardDescription>
            </CardHeader>
            <CardContent>
              {boletaData.recentUploads.length > 0 ? (
                <div className="space-y-4">
                  {boletaData.recentUploads.map((upload) => (
                    <div key={upload.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{upload.studentName}</h4>
                          <p className="text-sm text-muted-foreground">{upload.studentId}</p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            upload.status === "conciliado"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {upload.status === "conciliado" ? "Conciliado" : "Pendiente"}
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{upload.bank}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{upload.receiptNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Q{upload.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{upload.date}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">Cargado el: {upload.uploadDate}</div>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" /> Ver Detalles
                        </Button>
                        {upload.status === "pendiente" && (
                          <Button size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Verificar Estado
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay cargas recientes para mostrar.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

