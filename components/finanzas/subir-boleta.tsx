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
  AlertTriangle,
  Shield,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"

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
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  // Function to handle form changes and auto-verify when bank and receipt number are complete
  const handleFormChange = (field: string, value: string) => {
    const newForm = {
      ...uploadForm,
      [field]: value,
    }
    setUploadForm(newForm)

    // Auto-verify when both bank and receipt number are filled
    if (field === 'bank' || field === 'receiptNumber') {
      if (newForm.bank && newForm.receiptNumber && newForm.bank !== uploadForm.bank || newForm.receiptNumber !== uploadForm.receiptNumber) {
        handleVerifyReceipt(newForm.bank, newForm.receiptNumber)
      }
    }

    // Clear verification result if bank or receipt number changes
    if ((field === 'bank' || field === 'receiptNumber') && verificationResult) {
      setVerificationResult(null)
    }
  }

  // Function to verify receipt before upload (preflight check)
  const handleVerifyReceipt = async (bank?: string, receiptNumber?: string) => {
    const bankToVerify = bank || uploadForm.bank
    const receiptToVerify = receiptNumber || uploadForm.receiptNumber

    if (!bankToVerify || !receiptToVerify) {
      setVerificationResult({
        verified: false,
        message: 'Ingrese banco y número de boleta para verificar',
        type: 'warning'
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const bankName = boletaData.banks.find(b => b.id === bankToVerify)?.name || bankToVerify
      
      const response = await api.get('/estudiante/pagos/boletas/verify', {
        params: {
          banco: bankName,
          numero_boleta: receiptToVerify
        }
      })

      if (response.data.success && !response.data.duplicate) {
        setVerificationResult({
          verified: true,
          message: 'Esta boleta está disponible para uso.',
          type: 'success'
        })
      } else {
        setVerificationResult({
          verified: false,
          message: response.data.message || 'Esta boleta ya fue utilizada.',
          type: 'error'
        })
      }
    } catch (error: any) {
      console.error('Error verifying receipt:', error)
      setVerificationResult({
        verified: false,
        message: error.response?.data?.message || 'Error al verificar la boleta. Intente nuevamente.',
        type: 'error'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.')
        e.target.value = ''
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Formato de archivo no válido. Solo se permiten JPG, PNG y PDF.')
        e.target.value = ''
        return
      }

      setSelectedFile(file)
    }
  }

  // Function to upload receipt with duplicate prevention
  const handleUploadReceipt = async () => {
    if (!selectedStudent) {
      alert("Debe seleccionar un estudiante primero.")
      return
    }

    if (!uploadForm.bank || !uploadForm.receiptNumber || !uploadForm.amount || !uploadForm.date || !selectedFile) {
      alert("Por favor complete todos los campos obligatorios y seleccione un archivo.")
      return
    }

    // Check verification status
    if (verificationResult && !verificationResult.verified) {
      alert("Esta boleta no puede ser utilizada. Verifique el número de boleta.")
      return
    }

    // Final verification before upload if not already done
    if (!verificationResult) {
      await handleVerifyReceipt()
      if (verificationResult && !verificationResult.verified) {
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Prepare form data
      const formData = new FormData()
      const bankName = boletaData.banks.find(b => b.id === uploadForm.bank)?.name || uploadForm.bank
      
      formData.append('banco', bankName)
      formData.append('numero_boleta', uploadForm.receiptNumber)
      formData.append('monto', uploadForm.amount)
      formData.append('fecha_pago', uploadForm.date)
      formData.append('estudiante_id', selectedStudent.id)
      formData.append('comprobante', selectedFile)
      
      if (uploadForm.authNumber) {
        formData.append('numero_autorizacion', uploadForm.authNumber)
      }
      
      if (uploadForm.notes) {
        formData.append('notas', uploadForm.notes)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload receipt
      const response = await api.post('/estudiante/pagos/subir-recibo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.data.success) {
        alert("Boleta cargada correctamente. Pendiente de conciliación.")
        
        // Reset form
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
        setSelectedFile(null)
        setVerificationResult(null)
        
        // Clear file input
        const fileInput = document.getElementById('receipt-image') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      
      if (error.response?.data?.duplicate_type) {
        // Handle specific duplicate errors
        alert(`Error: ${error.response.data.message}`)
      } else if (error.response?.data?.details) {
        // Handle validation errors
        alert(`Errores de validación:\n${error.response.data.details.join('\n')}`)
      } else {
        alert("Error al cargar la boleta. Intente nuevamente.")
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
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
                  <div className="flex gap-2">
                    <Input
                      id="receipt-number"
                      placeholder="Ej: BI-123456"
                      value={uploadForm.receiptNumber}
                      onChange={(e) => handleFormChange("receiptNumber", e.target.value)}
                      disabled={!selectedStudent || isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyReceipt()}
                      disabled={!uploadForm.bank || !uploadForm.receiptNumber || isVerifying || isUploading}
                    >
                      {isVerifying ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-1 border-2 border-current border-t-transparent rounded-full"></div>
                          Verificando...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-4 w-4" />
                          Verificar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <Alert className={
                  verificationResult.type === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : verificationResult.type === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }>
                  {verificationResult.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : verificationResult.type === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertTitle className={
                    verificationResult.type === 'success' 
                      ? 'text-green-800' 
                      : verificationResult.type === 'error'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }>
                    {verificationResult.type === 'success' ? 'Verificación exitosa' 
                     : verificationResult.type === 'error' ? 'Boleta no disponible'
                     : 'Verificación pendiente'}
                  </AlertTitle>
                  <AlertDescription className={
                    verificationResult.type === 'success' 
                      ? 'text-green-700' 
                      : verificationResult.type === 'error'
                      ? 'text-red-700'
                      : 'text-yellow-700'
                  }>
                    {verificationResult.message}
                  </AlertDescription>
                </Alert>
              )}

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
                <Input 
                  id="receipt-image" 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  disabled={!selectedStudent || isUploading || (verificationResult && !verificationResult.verified)} 
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                  {selectedFile && (
                    <span className="ml-2 text-green-600 font-medium">
                      ✓ {selectedFile.name}
                    </span>
                  )}
                </p>
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
                <AlertTitle>Importante - Prevención de Duplicados</AlertTitle>
                <AlertDescription>
                  • Se verificará automáticamente que esta boleta no haya sido utilizada anteriormente.<br/>
                  • No se permiten boletas duplicadas, sin importar el estado del pago anterior.<br/>
                  • La verificación incluye el número de boleta y el archivo del comprobante.<br/>
                  • La boleta quedará pendiente de conciliación por el departamento financiero.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto" 
                onClick={handleUploadReceipt} 
                disabled={
                  !selectedStudent || 
                  isUploading || 
                  !selectedFile ||
                  (verificationResult && !verificationResult.verified) ||
                  !uploadForm.bank ||
                  !uploadForm.receiptNumber ||
                  !uploadForm.amount ||
                  !uploadForm.date
                }
              >
                <Upload className="mr-2 h-4 w-4" /> 
                {isUploading ? 'Cargando...' : 'Cargar Boleta'}
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

