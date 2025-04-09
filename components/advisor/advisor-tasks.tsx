"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

// Clave para el localStorage
const LOCAL_STORAGE_KEY = "advisorTasks"

export function AdvisorTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    date: new Date(),
    status: "pendiente",
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Cargar tareas del localStorage al montar el componente
  useEffect(() => {
    const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        // Convertir strings de fecha a objetos Date
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          date: new Date(task.date)
        }))
        setTasks(tasksWithDates)
      } catch (error) {
        console.error("Error al cargar tareas:", error)
      }
    }
  }, [])

  // Guardar tareas en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewTask((prev) => ({ ...prev, date }))
    }
  }

  const handleAddTask = () => {
    if (newTask.title && newTask.date) {
      const taskToAdd = { 
        ...newTask, 
        id: Date.now().toString(),
        date: new Date(newTask.date) // Asegurar que es un objeto Date
      }
      
      setTasks((prev) => [...prev, taskToAdd])
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

  const handleTaskStatusChange = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "pendiente" ? "completada" : "pendiente"
            }
          : task
      )
    )
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada correctamente",
    })
  }

  const filteredTasks = tasks.filter(
    (task) => task.date.toDateString() === selectedDate.toDateString()
  )

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
                  <li 
                    key={task.id} 
                    className={`p-3 rounded ${task.status === "completada" ? "bg-green-50" : "bg-gray-100"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-semibold ${task.status === "completada" ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={task.status === "pendiente" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTaskStatusChange(task.id)}
                        >
                          {task.status === "pendiente" ? "Completar" : "Pendiente"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
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