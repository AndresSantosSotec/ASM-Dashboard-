"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"

// Datos de ejemplo para los docentes
const docentes = [
  {
    id: 1,
    nombre: "Dr. Juan Pérez",
    materia: "Matemáticas Avanzadas",
    online: true,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    nombre: "Dra. María López",
    materia: "Programación",
    online: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    nombre: "Lic. Roberto Gómez",
    materia: "Estadística",
    online: true,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    nombre: "Ing. Ana Martínez",
    materia: "Bases de Datos",
    online: true,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    nombre: "Dr. Carlos Sánchez",
    materia: "Inteligencia Artificial",
    online: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Datos de ejemplo para los mensajes
const mensajesIniciales = [
  {
    id: 1,
    emisor: 2,
    receptor: 0,
    texto: "Hola, ¿cómo puedo ayudarte con el proyecto?",
    fecha: "10:30 AM",
    leido: true,
  },
  {
    id: 2,
    emisor: 0,
    receptor: 2,
    texto: "Tengo dudas sobre el último tema que vimos en clase",
    fecha: "10:32 AM",
    leido: true,
  },
  { id: 3, emisor: 2, receptor: 0, texto: "Claro, ¿qué parte no entendiste?", fecha: "10:33 AM", leido: true },
  {
    id: 4,
    emisor: 0,
    receptor: 2,
    texto: "La parte de normalización de bases de datos",
    fecha: "10:35 AM",
    leido: true,
  },
  {
    id: 5,
    emisor: 2,
    receptor: 0,
    texto: "Vamos a repasar eso. La normalización es un proceso para organizar una base de datos de manera eficiente.",
    fecha: "10:36 AM",
    leido: true,
  },
  {
    id: 6,
    emisor: 2,
    receptor: 0,
    texto: "¿Te parece si programamos una sesión de tutoría para mañana?",
    fecha: "10:37 AM",
    leido: false,
  },
]

export default function ChatDocente() {
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(2) // ID del docente seleccionado
  const [mensajes, setMensajes] = useState(mensajesIniciales)
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [busqueda, setBusqueda] = useState("")

  const mensajesFiltrados = mensajes.filter(
    (m) =>
      (m.emisor === docenteSeleccionado && m.receptor === 0) || (m.emisor === 0 && m.receptor === docenteSeleccionado),
  )

  const docentesFiltrados = docentes.filter(
    (d) =>
      d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.materia.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll al último mensaje cuando cambian los mensajes
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [mensajes, docenteSeleccionado])

  const enviarMensaje = () => {
    if (nuevoMensaje.trim() === "") return

    const nuevoId = mensajes.length + 1
    const mensaje = {
      id: nuevoId,
      emisor: 0, // 0 representa al estudiante actual
      receptor: docenteSeleccionado,
      texto: nuevoMensaje,
      fecha: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      leido: false,
    }

    setMensajes([...mensajes, mensaje])
    setNuevoMensaje("")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  const docenteActual = docentes.find((d) => d.id === docenteSeleccionado)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Chat con Docentes</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de docentes */}
        <Card className="md:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar docente..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y">
              {docentesFiltrados.map((docente) => (
                <div
                  key={docente.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                    docenteSeleccionado === docente.id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setDocenteSeleccionado(docente.id)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={docente.avatar} alt={docente.nombre} />
                      <AvatarFallback>{docente.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {docente.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{docente.nombre}</p>
                    <p className="text-sm text-gray-500 truncate">{docente.materia}</p>
                  </div>
                  {mensajes.some((m) => m.emisor === docente.id && m.receptor === 0 && !m.leido) && (
                    <Badge className="bg-blue-500">Nuevo</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Área de chat */}
        <Card className="md:col-span-3 flex flex-col overflow-hidden">
          {docenteSeleccionado ? (
            <>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={docenteActual?.avatar} alt={docenteActual?.nombre} />
                    <AvatarFallback>{docenteActual?.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{docenteActual?.nombre}</CardTitle>
                    <p className="text-sm text-gray-500">{docenteActual?.materia}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video size={20} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={20} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {mensajesFiltrados.map((mensaje) => (
                  <div key={mensaje.id} className={`flex ${mensaje.emisor === 0 ? "justify-end" : "justify-start"}`}>
                    {mensaje.emisor !== 0 && (
                      <Avatar className="mr-2 mt-1">
                        <AvatarImage src={docenteActual?.avatar} alt={docenteActual?.nombre} />
                        <AvatarFallback>{docenteActual?.nombre.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-md ${
                          mensaje.emisor === 0 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p>{mensaje.texto}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{mensaje.fecha}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip size={20} />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={enviarMensaje} disabled={nuevoMensaje.trim() === ""} size="icon">
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Selecciona un docente para iniciar una conversación</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}