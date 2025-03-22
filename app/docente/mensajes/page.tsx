import type { Metadata } from "next"
import { Search, Send, Paperclip, User, CheckCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocenteHeader } from "@/components/docente/docente-header"

export const metadata: Metadata = {
  title: "Mensajes | Portal Docente",
  description: "Sistema de mensajería interna con estudiantes",
}

// Datos de ejemplo
const conversaciones = [
  {
    id: 1,
    nombre: "Ana García Martínez",
    curso: "Metodología de la Investigación",
    ultimoMensaje: "Profesor, tengo una duda sobre el trabajo final...",
    fecha: "Hoy, 10:30",
    noLeidos: 1,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez López",
    curso: "Metodología de la Investigación",
    ultimoMensaje: "Gracias por la aclaración, profesor.",
    fecha: "Ayer, 15:45",
    noLeidos: 0,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    nombre: "María Fernández Sánchez",
    curso: "Estadística Aplicada",
    ultimoMensaje: "¿Podría revisar mi avance del proyecto?",
    fecha: "12/11/2023",
    noLeidos: 0,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    nombre: "Grupo: Metodología de la Investigación",
    curso: "Mensaje grupal",
    ultimoMensaje: "Les comparto el material adicional para la próxima clase...",
    fecha: "10/11/2023",
    noLeidos: 0,
    avatar: "/placeholder.svg?height=40&width=40",
    esGrupo: true,
  },
]

const mensajesActuales = [
  {
    id: 1,
    remitente: "Ana García Martínez",
    contenido: "Profesor, tengo una duda sobre el trabajo final. ¿Podría aclarar los requisitos para la metodología?",
    fecha: "Hoy, 10:30",
    esPropio: false,
  },
  {
    id: 2,
    remitente: "Dr. Juan Docente",
    contenido:
      "Hola Ana, claro. Para la metodología necesitas incluir el enfoque de investigación, las técnicas de recolección de datos y cómo planeas analizarlos. ¿Hay algún aspecto específico que te genere dudas?",
    fecha: "Hoy, 10:45",
    esPropio: true,
  },
  {
    id: 3,
    remitente: "Ana García Martínez",
    contenido:
      "Gracias profesor. Mi duda es sobre las técnicas de recolección. ¿Es necesario incluir tanto entrevistas como encuestas, o puedo enfocarme en solo una de ellas?",
    fecha: "Hoy, 11:00",
    esPropio: false,
  },
]

export default function Mensajes() {
  return (
    <div className="container py-6">
      <DocenteHeader />
      <div className="h-[calc(100vh-12rem)]">
        <div className="flex h-full border rounded-lg overflow-hidden">
          {/* Lista de conversaciones */}
          <div className="w-full md:w-1/3 border-r bg-white">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold mb-2">Mensajes</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar conversación..." className="pl-8" />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-1 p-2">
                {conversaciones.map((conversacion) => (
                  <div
                    key={conversacion.id}
                    className={`flex items-start p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      conversacion.id === 1 ? "bg-muted" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={conversacion.avatar} alt={conversacion.nombre} />
                      <AvatarFallback>{conversacion.esGrupo ? "G" : conversacion.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium truncate">{conversacion.nombre}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {conversacion.fecha}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversacion.ultimoMensaje}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-muted-foreground">{conversacion.curso}</span>
                        {conversacion.noLeidos > 0 && (
                          <Badge className="ml-2" variant="default">
                            {conversacion.noLeidos}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <Button className="w-full">Nuevo Mensaje</Button>
            </div>
          </div>

          {/* Conversación actual */}
          <div className="hidden md:flex md:flex-col md:w-2/3 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Ana García" />
                  <AvatarFallback>AG</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Ana García Martínez</h3>
                  <p className="text-xs text-muted-foreground">Metodología de la Investigación</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mensajesActuales.map((mensaje) => (
                  <div key={mensaje.id} className={`flex ${mensaje.esPropio ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        mensaje.esPropio ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{mensaje.contenido}</p>
                      <div
                        className={`flex items-center justify-end mt-1 text-xs ${
                          mensaje.esPropio ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {mensaje.fecha}
                        {mensaje.esPropio && <CheckCircle className="ml-1 h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Textarea placeholder="Escribe un mensaje..." className="min-h-[80px]" />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" title="Adjuntar archivo">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="icon" title="Enviar mensaje">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

