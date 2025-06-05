"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash, Mail, MessageSquare, RefreshCw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { crearUsuarioEnBD } from "@/utils/crearUsuario" // Importa la utilidad nueva

const API_URL = process.env.NEXT_PUBLIC_API_URL 


// Tipos
interface Student {
  id: string
  name: string
  lastName: string
  email: string
  phone: string
  program: string
  idNumber: string
  birthDate: string
  status: "pending" | "active" | "inactive"
  username?: string
  institutionalEmail?: string
  password?: string
}

interface Notification {
  id: string
  studentId: string
  type: "email" | "whatsapp"
  status: "sent" | "failed" | "pending"
  date: string
  message: string
}

// Datos de ejemplo para programas y notificaciones
const mockPrograms = [
  "Licenciatura en Administración de Empresas",
  "Ingeniería en Sistemas Computacionales",
  "Maestría en Educación",
  "Doctorado en Ciencias",
  "Licenciatura en Psicología",
]

const mockNotifications: Notification[] = [
  {
    id: "n1",
    studentId: "2",
    type: "email",
    status: "sent",
    date: "2023-10-15T14:30:00",
    message: "Bienvenido/a a nuestra institución. Sus credenciales han sido enviadas.",
  },
  {
    id: "n2",
    studentId: "2",
    type: "whatsapp",
    status: "sent",
    date: "2023-10-15T14:35:00",
    message: "Hola María, te hemos enviado tus credenciales por correo electrónico.",
  },
  {
    id: "n3",
    studentId: "3",
    type: "email",
    status: "failed",
    date: "2023-10-10T09:15:00",
    message: "Bienvenido/a a nuestra institución. Sus credenciales han sido enviadas.",
  },
]

// Función para generar una contraseña aleatoria
function generatePassword(student: { name: string; lastName: string; idNumber: string | number }) {
  const idStr = String(student.idNumber);
  const nameInitial = student.name.charAt(0).toLowerCase();
  const lastNameInitial = student.lastName.charAt(0).toLowerCase();
  const idSuffix = idStr.slice(-4);
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3 dígitos
  return `${nameInitial}${lastNameInitial}${idSuffix}${randomDigits}`;
}

export default function GestionUsuarios() {
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Formulario de estudiante
  const [formData, setFormData] = useState<Omit<Student, "id" | "status" | "username" | "institutionalEmail" | "password">>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    program: "",
    idNumber: "",
    birthDate: "",
  })

  // Cargar estudiantes desde la API
useEffect(() => {
  async function fetchStudents() {
    try {
      const endpoint = `${API_URL}/api/prospectos/fichas/pendientes-public`;
      console.log('[DEBUG] Intentando conectar al endpoint:', endpoint); // 1. Verifica la URL construida

      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
      });
      console.log('[DEBUG] Respuesta HTTP recibida. Status:', res.status); // 2. Verifica si llegó respuesta

      if (!res.ok) {
        console.error('[DEBUG] Error en la respuesta HTTP. Status:', res.status);
        const errorText = await res.text(); // Intenta leer el cuerpo del error
        console.error('[DEBUG] Contenido del error:', errorText);
        
        setFetchError(
          `Error al cargar estudiantes: HTTP ${res.status}. 
          Verifica que el endpoint '${endpoint}' exista y esté disponible en tu backend.
          Respuesta del servidor: ${errorText}`
        );
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const responseData = await res.json();
      console.log('[DEBUG] Datos recibidos (crudos):', responseData); // 3. Verifica estructura de datos

      if (!responseData.data) {
        console.error('[DEBUG] La respuesta no contiene propiedad "data":', responseData);
        throw new Error('Formato de respuesta inválido: falta propiedad "data"');
      }

      const mapped: Student[] = responseData.data.map((raw: any) => ({
        id: String(raw.id),
        name: raw.nombre_completo?.split(" ")[0] || "",
        lastName: raw.nombre_completo?.split(" ").slice(1).join(" ") || "",
        email: raw.correo_electronico || "",
        phone: raw.telefono || "",
        program: raw.nombre_programa || "",
        idNumber: raw.id || "",
        birthDate: raw.fecha_nacimiento || "",
        status: (raw.status as "pending" | "active" | "inactive") || "pending",
        username: raw.username || undefined,
        institutionalEmail: raw.institutional_email || undefined,
        password: raw.password || undefined,
      }));

      console.log('[DEBUG] Datos mapeados:', mapped); // 4. Verifica el mapeo
      setStudents(mapped);
      setFetchError(null);

    } catch (err) {
      const error = err as Error;
      console.error('[DEBUG] Error en fetchStudents:', {
        error: err,
        message: error.message,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: `No se pudieron cargar los estudiantes: ${error.message}`,
      });
    }
  }
  
  console.log('[DEBUG] Iniciando carga de estudiantes...');
  fetchStudents();
}, []);

  // Filtrar estudiantes
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.idNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || student.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Filtrar notificaciones por estudiante seleccionado
  const studentNotifications = selectedStudent ? notifications.filter((n) => n.studentId === selectedStudent.id) : []

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Abrir formulario para editar
  const handleEdit = (student: Student) => {
    setSelectedStudent(student)
    setFormData({
      name: student.name,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      program: student.program,
      idNumber: student.idNumber,
      birthDate: student.birthDate,
    })
    setIsFormOpen(true)
  }

  // Abrir formulario para crear
  const handleCreate = () => {
    setSelectedStudent(null)
    setFormData({
      name: "",
      lastName: "",
      email: "",
      phone: "",
      program: "",
      idNumber: "",
      birthDate: "",
    })
    setIsFormOpen(true)
  }

  // Guardar estudiante (crear o actualizar) - Solo frontend, deberías implementar POST/PUT en tu API para persistir
  const handleSaveStudent = () => {
    if (selectedStudent) {
      // Actualizar estudiante existente (solo en frontend)
      setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? { ...s, ...formData } : s)))
      toast({
        title: "Estudiante actualizado",
        description: `Los datos de ${formData.name} ${formData.lastName} han sido actualizados.`,
      })
    } else {
      // Crear nuevo estudiante (solo en frontend)
      const newStudent: Student = {
        id: `${Date.now()}`,
        ...formData,
        status: "pending",
      }
      setStudents((prev) => [...prev, newStudent])
      setSelectedStudent(newStudent)
      toast({
        title: "Estudiante creado",
        description: `${formData.name} ${formData.lastName} ha sido registrado correctamente.`,
      })
    }
    setIsFormOpen(false)
  }

  // Eliminar estudiante (solo frontend)
  const handleDelete = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
    if (selectedStudent?.id === id) {
      setSelectedStudent(null)
    }
    toast({
      title: "Estudiante eliminado",
      description: "El estudiante ha sido eliminado correctamente.",
    })
  }

  // Generar credenciales y guardar usuario en la tabla users vía API
  const handleGenerateCredentials = async () => {
    if (!selectedStudent) return

    setIsGeneratingCredentials(true)

    try {
      // Generar username, email y password automáticamente
      const username = `${selectedStudent.name.toLowerCase()}.${selectedStudent.lastName.toLowerCase()}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
      const institutionalEmail = `${username}@americanschool.edu.gt`
      const password = generatePassword(selectedStudent)

      // Payload para la API
      const payload = {
        username,
        email: institutionalEmail,
        password,
        first_name: selectedStudent.name,
        last_name: selectedStudent.lastName,
        is_active: true,
        email_verified: true,
        mfa_enabled: false,
        rol: 3, // ID de rol estudiante
      }

      // Llama a la utilidad para crear el usuario en la tabla users
      await crearUsuarioEnBD(payload)

      // Actualiza el estado local (frontend)
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                username,
                institutionalEmail,
                password,
                status: "active",
              }
            : s,
        ),
      )

      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              username,
              institutionalEmail,
              password,
              status: "active",
            }
          : null,
      )

      toast({
        title: "Credenciales generadas",
        description: `Usuario: ${username}\nCorreo: ${institutionalEmail}\nContraseña: ${password}`,
      })
    } catch (err) {
      // El error ya fue mostrado por Swal
    } finally {
      setIsGeneratingCredentials(false)
    }
  }

  // Enviar notificación (solo frontend)
  const handleSendNotification = (type: "email" | "whatsapp") => {
    if (!selectedStudent) return

    setIsSendingNotification(true)

    setTimeout(() => {
      const newNotification: Notification = {
        id: `n${Date.now()}`,
        studentId: selectedStudent.id,
        type,
        status: "sent",
        date: new Date().toISOString(),
        message:
          type === "email"
            ? "Bienvenido/a a nuestra institución. Sus credenciales han sido enviadas."
            : `Hola ${selectedStudent.name}, te hemos enviado tus credenciales por correo electrónico.`,
      }

      setNotifications((prev) => [...prev, newNotification])
      setIsSendingNotification(false)

      toast({
        title: type === "email" ? "Correo enviado" : "WhatsApp enviado",
        description: `La notificación ha sido enviada a ${selectedStudent.name} ${selectedStudent.lastName}.`,
      })
    }, 1500)
  }

  // Reenviar notificación (solo frontend)
  const handleResendNotification = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, status: "sent", date: new Date().toISOString() } : n)),
    )

    toast({
      title: "Notificación reenviada",
      description: `La notificación ha sido reenviada correctamente.`,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios y Acceso</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel de búsqueda y filtros */}
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nombre, correo o ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de estudiantes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No se encontraron estudiantes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow
                        key={student.id}
                        className={selectedStudent?.id === student.id ? "bg-blue-50" : ""}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {student.name} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">{student.program}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.status === "active"
                                ? "default"
                                : student.status === "pending"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {student.status === "active"
                              ? "Activo"
                              : student.status === "pending"
                                ? "Pendiente"
                                : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(student)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(student.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detalles del estudiante seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Información</TabsTrigger>
                  <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre completo</Label>
                      <div className="font-medium">
                        {selectedStudent.name} {selectedStudent.lastName}
                      </div>
                    </div>
                    <div>
                      <Label>ID</Label>
                      <div className="font-medium">{selectedStudent.idNumber}</div>
                    </div>
                    <div>
                      <Label>Correo personal</Label>
                      <div className="font-medium">{selectedStudent.email}</div>
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <div className="font-medium">{selectedStudent.phone}</div>
                    </div>
                    <div className="col-span-2">
                      <Label>Programa</Label>
                      <div className="font-medium">{selectedStudent.program}</div>
                    </div>

                    {selectedStudent.username && (
                      <>
                        <div>
                          <Label>Usuario</Label>
                          <div className="font-medium">{selectedStudent.username}</div>
                        </div>
                        <div>
                          <Label>Correo institucional</Label>
                          <div className="font-medium">{selectedStudent.institutionalEmail}</div>
                        </div>
                        <div>
                          <Label>Contraseña</Label>
                          <div className="font-medium">{selectedStudent.password}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 space-y-2">
                    {!selectedStudent.username ? (
                      <Button className="w-full" onClick={handleGenerateCredentials} disabled={isGeneratingCredentials}>
                        {isGeneratingCredentials ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Generando credenciales...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Generar credenciales
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleSendNotification("email")}
                            disabled={isSendingNotification}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar por correo
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => handleSendNotification("whatsapp")}
                            disabled={isSendingNotification}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar por WhatsApp
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="pt-4">
                  {studentNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay notificaciones para este usuario</div>
                  ) : (
                    <div className="space-y-4">
                      {studentNotifications.map((notification) => (
                        <div key={notification.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              {notification.type === "email" ? (
                                <Mail className="h-4 w-4 mr-2" />
                              ) : (
                                <MessageSquare className="h-4 w-4 mr-2" />
                              )}
                              <span className="font-medium">
                                {notification.type === "email" ? "Correo electrónico" : "WhatsApp"}
                              </span>
                            </div>
                            <Badge
                              variant={
                                notification.status === "sent"
                                  ? "default"
                                  : notification.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {notification.status === "sent"
                                ? "Enviado"
                                : notification.status === "pending"
                                  ? "Pendiente"
                                  : "Fallido"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {new Date(notification.date).toLocaleString()}
                          </div>
                          <div className="text-sm border-l-2 border-gray-200 pl-3 mb-3">{notification.message}</div>
                          {notification.status !== "sent" && (
                            <Button variant="outline" size="sm" onClick={() => handleResendNotification(notification)}>
                              <RefreshCw className="mr-2 h-3 w-3" />
                              Reenviar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">Seleccione un estudiante para ver sus detalles</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulario de creación/edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? "Editar estudiante" : "Nuevo estudiante"}</DialogTitle>
            <DialogDescription>
              Complete los datos del estudiante para{" "}
              {selectedStudent ? "actualizar su información" : "registrarlo en el sistema"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">Número de identificación</Label>
              <Input id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="program">Programa académico</Label>
              <Select
                name="program"
                value={formData.program}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, program: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un programa" />
                </SelectTrigger>
                <SelectContent>
                  {mockPrograms.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStudent}>{selectedStudent ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}