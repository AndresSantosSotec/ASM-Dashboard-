"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

interface Task {
  id: string
  title: string
  description: string
  date: Date
  status: "pendiente" | "completada"
}

// Datos de ejemplo para mostrar inicialmente
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Llamar a Juan Pérez",
    description: "Seguimiento sobre interés en programa de MBA",
    date: new Date(2023, 4, 15),
    status: "pendiente",
  },
  {
    id: "2",
    title: "Enviar información a María García",
    description: "Enviar folleto del programa de Medicina",
    date: new Date(2023, 4, 16),
    status: "pendiente",
  },
]

export function AdvisorTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    date: new Date(),
    status: "pendiente",
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewTask((prev) => ({ ...prev, date }))
    }
  }

  const handleAddTask = () => {
    if (newTask.title && newTask.date) {
      setTasks((prev) => [...prev, { ...newTask, id: Date.now().toString() }])
      setNewTask({
        title: "",
        description: "",
        date: new Date(),
        status: "pendiente",
      })
      setIsDialogOpen(false)

      toast({
        title: "Tarea agregada",
        description: "La tarea ha sido agregada correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: "Por favor complete al menos el título de la tarea",
        variant: "destructive",
      })
    }
  }

  const filteredTasks = tasks.filter((task) => task.date.toDateString() === selectedDate.toDateString())

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tareas del Asesor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={es}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Tareas para {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
            </h3>
            {filteredTasks.length === 0 ? (
              <p>No hay tareas programadas para este día.</p>
            ) : (
              <ul className="space-y-2">
                {filteredTasks.map((task) => (
                  <li key={task.id} className="bg-gray-100 p-3 rounded">
                    <span className="font-semibold">{task.title}</span>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </li>
                ))}
              </ul>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">Agregar Tarea</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Tarea</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      name="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      placeholder="Título de la tarea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={newTask.description}
                      onChange={handleInputChange}
                      placeholder="Descripción de la tarea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Calendar
                      mode="single"
                      selected={newTask.date}
                      onSelect={handleDateChange}
                      className="rounded-md border"
                      locale={es}
                    />
                  </div>
                  <Button onClick={handleAddTask} className="w-full">
                    Agregar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

