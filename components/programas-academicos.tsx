"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, BookOpen, Users, Clock, DollarSign, CheckCircle, School } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

// Datos de ejemplo para programas académicos
const INITIAL_PROGRAMS = [
  {
    id: "1",
    code: "MBA-2025",
    name: "Maestría en Administración de Empresas",
    level: "Posgrado",
    modality: "Presencial",
    duration: "2 años",
    credits: 120,
    description: "Programa diseñado para formar líderes empresariales con visión global y habilidades directivas.",
    requirements: [
      "Título universitario",
      "Experiencia laboral mínima de 2 años",
      "Entrevista personal",
      "Examen de admisión",
    ],
    totalSpots: 30,
    availableSpots: 12,
    status: "active",
    cost: 85000,
    paymentPlans: [
      { name: "Pago único", discount: "10%", description: "Pago total al inicio del programa" },
      { name: "Semestral", installments: 4, description: "Pago al inicio de cada semestre" },
      { name: "Mensual", installments: 24, description: "Pagos mensuales durante todo el programa" },
    ],
    startDate: "2025-08-15",
  },
  {
    id: "2",
    code: "LIC-ADM-2025",
    name: "Licenciatura en Administración",
    level: "Pregrado",
    modality: "Híbrida",
    duration: "4 años",
    credits: 360,
    description: "Formación integral en administración de empresas con enfoque práctico y orientado a resultados.",
    requirements: ["Certificado de bachillerato", "Examen de admisión", "Entrevista personal"],
    totalSpots: 60,
    availableSpots: 25,
    status: "active",
    cost: 120000,
    paymentPlans: [
      { name: "Pago único", discount: "15%", description: "Pago total al inicio del programa" },
      { name: "Anual", installments: 4, description: "Pago al inicio de cada año" },
      { name: "Semestral", installments: 8, description: "Pago al inicio de cada semestre" },
      { name: "Mensual", installments: 48, description: "Pagos mensuales durante todo el programa" },
    ],
    startDate: "2025-09-01",
  },
  {
    id: "3",
    code: "ESP-FIN-2025",
    name: "Especialización en Finanzas Corporativas",
    level: "Posgrado",
    modality: "Virtual",
    duration: "1 año",
    credits: 60,
    description:
      "Programa especializado en el análisis financiero y la toma de decisiones estratégicas en entornos corporativos.",
    requirements: ["Título universitario en áreas afines", "Experiencia laboral mínima de 1 año", "Entrevista virtual"],
    totalSpots: 40,
    availableSpots: 18,
    status: "active",
    cost: 45000,
    paymentPlans: [
      { name: "Pago único", discount: "8%", description: "Pago total al inicio del programa" },
      { name: "Trimestral", installments: 4, description: "Pago al inicio de cada trimestre" },
      { name: "Mensual", installments: 12, description: "Pagos mensuales durante todo el programa" },
    ],
    startDate: "2025-07-10",
  },
  {
    id: "4",
    code: "DOC-EDU-2026",
    name: "Doctorado en Ciencias de la Educación",
    level: "Posgrado",
    modality: "Presencial",
    duration: "3 años",
    credits: 180,
    description: "Programa doctoral orientado a la investigación educativa y la innovación pedagógica.",
    requirements: [
      "Maestría en Educación o áreas afines",
      "Proyecto de investigación",
      "Entrevista con comité doctoral",
      "Publicaciones académicas (deseable)",
    ],
    totalSpots: 15,
    availableSpots: 8,
    status: "upcoming",
    cost: 120000,
    paymentPlans: [
      { name: "Pago único", discount: "12%", description: "Pago total al inicio del programa" },
      { name: "Anual", installments: 3, description: "Pago al inicio de cada año" },
      { name: "Semestral", installments: 6, description: "Pago al inicio de cada semestre" },
    ],
    startDate: "2026-02-15",
  },
  {
    id: "5",
    code: "TEC-SOFT-2025",
    name: "Técnico en Desarrollo de Software",
    level: "Técnico",
    modality: "Híbrida",
    duration: "1.5 años",
    credits: 90,
    description: "Formación técnica en programación y desarrollo de aplicaciones con enfoque práctico.",
    requirements: ["Certificado de bachillerato", "Prueba de aptitud técnica", "Entrevista personal"],
    totalSpots: 50,
    availableSpots: 0,
    status: "full",
    cost: 35000,
    paymentPlans: [
      { name: "Pago único", discount: "10%", description: "Pago total al inicio del programa" },
      { name: "Semestral", installments: 3, description: "Pago al inicio de cada semestre" },
      { name: "Mensual", installments: 18, description: "Pagos mensuales durante todo el programa" },
    ],
    startDate: "2025-03-01",
  },
]

export function ProgramasAcademicos() {
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [isViewProgramOpen, setIsViewProgramOpen] = useState(false)
  const [newProgram, setNewProgram] = useState({
    id: "",
    code: "",
    name: "",
    level: "Pregrado",
    modality: "Presencial",
    duration: "",
    credits: 0,
    description: "",
    requirements: [] as string[],
    totalSpots: 0,
    availableSpots: 0,
    status: "upcoming",
    cost: 0,
    paymentPlans: [] as any[],
    startDate: "",
  })
  const [newRequirement, setNewRequirement] = useState("")
  const [newPaymentPlan, setNewPaymentPlan] = useState({
    name: "",
    installments: 0,
    discount: "",
    description: "",
  })

  // Filtrar programas según la pestaña activa y la búsqueda
  const getFilteredPrograms = () => {
    let filtered = programs

    // Filtrar por estado
    if (activeTab !== "all") {
      filtered = filtered.filter((program) => program.status === activeTab)
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (program) =>
          program.name.toLowerCase().includes(query) ||
          program.code.toLowerCase().includes(query) ||
          program.level.toLowerCase().includes(query),
      )
    }

    return filtered
  }

  // Función para agregar un nuevo programa
  const handleAddProgram = () => {
    const programToAdd = {
      ...newProgram,
      id: Date.now().toString(),
    }
    setPrograms([...programs, programToAdd])
    setIsAddProgramOpen(false)
    resetNewProgram()
  }

  // Función para eliminar un programa
  const handleDeleteProgram = (id: string) => {
    setPrograms(programs.filter((program) => program.id !== id))
    setIsViewProgramOpen(false)
  }

  // Función para editar un programa
  const handleEditProgram = () => {
    setPrograms(programs.map((program) => (program.id === selectedProgram.id ? selectedProgram : program)))
    setIsViewProgramOpen(false)
  }

  // Función para agregar un requisito
  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      if (selectedProgram) {
        setSelectedProgram({
          ...selectedProgram,
          requirements: [...selectedProgram.requirements, newRequirement.trim()],
        })
      } else {
        setNewProgram({
          ...newProgram,
          requirements: [...newProgram.requirements, newRequirement.trim()],
        })
      }
      setNewRequirement("")
    }
  }

  // Función para eliminar un requisito
  const handleRemoveRequirement = (requirement: string) => {
    if (selectedProgram) {
      setSelectedProgram({
        ...selectedProgram,
        requirements: selectedProgram.requirements.filter((r: string) => r !== requirement),
      })
    } else {
      setNewProgram({
        ...newProgram,
        requirements: newProgram.requirements.filter((r) => r !== requirement),
      })
    }
  }

  // Función para agregar un plan de pago
  const handleAddPaymentPlan = () => {
    if (newPaymentPlan.name.trim()) {
      if (selectedProgram) {
        setSelectedProgram({
          ...selectedProgram,
          paymentPlans: [...selectedProgram.paymentPlans, { ...newPaymentPlan }],
        })
      } else {
        setNewProgram({
          ...newProgram,
          paymentPlans: [...newProgram.paymentPlans, { ...newPaymentPlan }],
        })
      }
      setNewPaymentPlan({
        name: "",
        installments: 0,
        discount: "",
        description: "",
      })
    }
  }

  // Función para eliminar un plan de pago
  const handleRemovePaymentPlan = (planName: string) => {
    if (selectedProgram) {
      setSelectedProgram({
        ...selectedProgram,
        paymentPlans: selectedProgram.paymentPlans.filter((p: any) => p.name !== planName),
      })
    } else {
      setNewProgram({
        ...newProgram,
        paymentPlans: newProgram.paymentPlans.filter((p) => p.name !== planName),
      })
    }
  }

  // Resetear el formulario de nuevo programa
  const resetNewProgram = () => {
    setNewProgram({
      id: "",
      code: "",
      name: "",
      level: "Pregrado",
      modality: "Presencial",
      duration: "",
      credits: 0,
      description: "",
      requirements: [],
      totalSpots: 0,
      availableSpots: 0,
      status: "upcoming",
      cost: 0,
      paymentPlans: [],
      startDate: "",
    })
  }

  // Obtener el color de la insignia según el estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
          >
            Activo
          </Badge>
        )
      case "upcoming":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
          >
            Próximo
          </Badge>
        )
      case "full":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700"
          >
            Cupo Lleno
          </Badge>
        )
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          >
            Inactivo
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, código o nivel..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddProgramOpen} onOpenChange={setIsAddProgramOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetNewProgram()
                setIsAddProgramOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Programa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Programa Académico</DialogTitle>
              <DialogDescription>Complete los detalles del programa para agregarlo al catálogo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="general">Información General</TabsTrigger>
                  <TabsTrigger value="requirements">Requisitos</TabsTrigger>
                  <TabsTrigger value="payment">Costos y Pagos</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        value={newProgram.code}
                        onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha de Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newProgram.startDate}
                        onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Programa</Label>
                    <Input
                      id="name"
                      value={newProgram.name}
                      onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="level">Nivel</Label>
                      <Select
                        value={newProgram.level}
                        onValueChange={(value) => setNewProgram({ ...newProgram, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Pregrado">Pregrado</SelectItem>
                          <SelectItem value="Posgrado">Posgrado</SelectItem>
                          <SelectItem value="Maestría">Maestría</SelectItem>
                          <SelectItem value="Doctorado">Doctorado</SelectItem>
                          <SelectItem value="Diplomado">Diplomado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modality">Modalidad</Label>
                      <Select
                        value={newProgram.modality}
                        onValueChange={(value) => setNewProgram({ ...newProgram, modality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Virtual">Virtual</SelectItem>
                          <SelectItem value="Híbrida">Híbrida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duración</Label>
                      <Input
                        id="duration"
                        value={newProgram.duration}
                        onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                        placeholder="Ej: 2 años"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credits">Créditos</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={newProgram.credits || ""}
                        onChange={(e) =>
                          setNewProgram({ ...newProgram, credits: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newProgram.description}
                      onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalSpots">Cupos Totales</Label>
                      <Input
                        id="totalSpots"
                        type="number"
                        value={newProgram.totalSpots || ""}
                        onChange={(e) =>
                          setNewProgram({ ...newProgram, totalSpots: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availableSpots">Cupos Disponibles</Label>
                      <Input
                        id="availableSpots"
                        type="number"
                        value={newProgram.availableSpots || ""}
                        onChange={(e) =>
                          setNewProgram({ ...newProgram, availableSpots: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={newProgram.status}
                      onValueChange={(value) => setNewProgram({ ...newProgram, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="upcoming">Próximo</SelectItem>
                        <SelectItem value="full">Cupo Lleno</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="requirements" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requisitos de Admisión</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        placeholder="Agregar requisito"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddRequirement} size="sm">
                        Agregar
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {newProgram.requirements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay requisitos definidos</p>
                      ) : (
                        newProgram.requirements.map((requirement, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{requirement}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRequirement(requirement)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="payment" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Costo Total del Programa (MXN)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={newProgram.cost || ""}
                      onChange={(e) => setNewProgram({ ...newProgram, cost: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <Label>Planes de Pago</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="planName">Nombre del Plan</Label>
                        <Input
                          id="planName"
                          value={newPaymentPlan.name}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, name: e.target.value })}
                          placeholder="Ej: Pago Mensual"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="planInstallments">Número de Pagos</Label>
                        <Input
                          id="planInstallments"
                          type="number"
                          value={newPaymentPlan.installments || ""}
                          onChange={(e) =>
                            setNewPaymentPlan({ ...newPaymentPlan, installments: Number.parseInt(e.target.value) || 0 })
                          }
                          placeholder="Ej: 12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="planDiscount">Descuento (opcional)</Label>
                        <Input
                          id="planDiscount"
                          value={newPaymentPlan.discount}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, discount: e.target.value })}
                          placeholder="Ej: 10%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="planDescription">Descripción</Label>
                        <Input
                          id="planDescription"
                          value={newPaymentPlan.description}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, description: e.target.value })}
                          placeholder="Ej: Pagos mensuales durante el programa"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={handleAddPaymentPlan} className="w-full">
                      Agregar Plan de Pago
                    </Button>
                    <div className="mt-4 space-y-2">
                      {newProgram.paymentPlans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay planes de pago definidos</p>
                      ) : (
                        newProgram.paymentPlans.map((plan, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{plan.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {plan.installments ? `${plan.installments} pagos` : ""}
                                {plan.discount ? ` • Descuento: ${plan.discount}` : ""}
                              </div>
                              {plan.description && <div className="text-sm mt-1">{plan.description}</div>}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePaymentPlan(plan.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddProgramOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddProgram}>
                Guardar Programa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="full">Cupo Lleno</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <ProgramList
            programs={getFilteredPrograms()}
            setSelectedProgram={setSelectedProgram}
            setIsViewProgramOpen={setIsViewProgramOpen}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <ProgramList
            programs={getFilteredPrograms()}
            setSelectedProgram={setSelectedProgram}
            setIsViewProgramOpen={setIsViewProgramOpen}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-6">
          <ProgramList
            programs={getFilteredPrograms()}
            setSelectedProgram={setSelectedProgram}
            setIsViewProgramOpen={setIsViewProgramOpen}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="full" className="mt-6">
          <ProgramList
            programs={getFilteredPrograms()}
            setSelectedProgram={setSelectedProgram}
            setIsViewProgramOpen={setIsViewProgramOpen}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {selectedProgram && (
        <Dialog open={isViewProgramOpen} onOpenChange={setIsViewProgramOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                {selectedProgram.name}
              </DialogTitle>
              <DialogDescription>
                {selectedProgram.code} • {selectedProgram.level} • {selectedProgram.modality}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="general">Información General</TabsTrigger>
                  <TabsTrigger value="requirements">Requisitos</TabsTrigger>
                  <TabsTrigger value="payment">Costos y Pagos</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-code">Código</Label>
                      <Input
                        id="edit-code"
                        value={selectedProgram.code}
                        onChange={(e) => setSelectedProgram({ ...selectedProgram, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-startDate">Fecha de Inicio</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={selectedProgram.startDate}
                        onChange={(e) => setSelectedProgram({ ...selectedProgram, startDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre del Programa</Label>
                    <Input
                      id="edit-name"
                      value={selectedProgram.name}
                      onChange={(e) => setSelectedProgram({ ...selectedProgram, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-level">Nivel</Label>
                      <Select
                        value={selectedProgram.level}
                        onValueChange={(value) => setSelectedProgram({ ...selectedProgram, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Pregrado">Pregrado</SelectItem>
                          <SelectItem value="Posgrado">Posgrado</SelectItem>
                          <SelectItem value="Maestría">Maestría</SelectItem>
                          <SelectItem value="Doctorado">Doctorado</SelectItem>
                          <SelectItem value="Diplomado">Diplomado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-modality">Modalidad</Label>
                      <Select
                        value={selectedProgram.modality}
                        onValueChange={(value) => setSelectedProgram({ ...selectedProgram, modality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Virtual">Virtual</SelectItem>
                          <SelectItem value="Híbrida">Híbrida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration">Duración</Label>
                      <Input
                        id="edit-duration"
                        value={selectedProgram.duration}
                        onChange={(e) => setSelectedProgram({ ...selectedProgram, duration: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-credits">Créditos</Label>
                      <Input
                        id="edit-credits"
                        type="number"
                        value={selectedProgram.credits || ""}
                        onChange={(e) =>
                          setSelectedProgram({ ...selectedProgram, credits: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descripción</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedProgram.description}
                      onChange={(e) => setSelectedProgram({ ...selectedProgram, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalSpots">Cupos Totales</Label>
                      <Input
                        id="edit-totalSpots"
                        type="number"
                        value={selectedProgram.totalSpots || ""}
                        onChange={(e) =>
                          setSelectedProgram({ ...selectedProgram, totalSpots: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-availableSpots">Cupos Disponibles</Label>
                      <Input
                        id="edit-availableSpots"
                        type="number"
                        value={selectedProgram.availableSpots || ""}
                        onChange={(e) =>
                          setSelectedProgram({
                            ...selectedProgram,
                            availableSpots: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Estado</Label>
                    <Select
                      value={selectedProgram.status}
                      onValueChange={(value) => setSelectedProgram({ ...selectedProgram, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="upcoming">Próximo</SelectItem>
                        <SelectItem value="full">Cupo Lleno</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="requirements" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requisitos de Admisión</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        placeholder="Agregar requisito"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddRequirement} size="sm">
                        Agregar
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedProgram.requirements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay requisitos definidos</p>
                      ) : (
                        selectedProgram.requirements.map((requirement: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{requirement}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRequirement(requirement)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="payment" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cost">Costo Total del Programa (MXN)</Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      value={selectedProgram.cost || ""}
                      onChange={(e) =>
                        setSelectedProgram({ ...selectedProgram, cost: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <Label>Planes de Pago</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-planName">Nombre del Plan</Label>
                        <Input
                          id="edit-planName"
                          value={newPaymentPlan.name}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, name: e.target.value })}
                          placeholder="Ej: Pago Mensual"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-planInstallments">Número de Pagos</Label>
                        <Input
                          id="edit-planInstallments"
                          type="number"
                          value={newPaymentPlan.installments || ""}
                          onChange={(e) =>
                            setNewPaymentPlan({ ...newPaymentPlan, installments: Number.parseInt(e.target.value) || 0 })
                          }
                          placeholder="Ej: 12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-planDiscount">Descuento (opcional)</Label>
                        <Input
                          id="edit-planDiscount"
                          value={newPaymentPlan.discount}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, discount: e.target.value })}
                          placeholder="Ej: 10%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-planDescription">Descripción</Label>
                        <Input
                          id="edit-planDescription"
                          value={newPaymentPlan.description}
                          onChange={(e) => setNewPaymentPlan({ ...newPaymentPlan, description: e.target.value })}
                          placeholder="Ej: Pagos mensuales durante el programa"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={handleAddPaymentPlan} className="w-full">
                      Agregar Plan de Pago
                    </Button>
                    <div className="mt-4 space-y-2">
                      {selectedProgram.paymentPlans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay planes de pago definidos</p>
                      ) : (
                        selectedProgram.paymentPlans.map((plan: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{plan.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {plan.installments ? `${plan.installments} pagos` : ""}
                                {plan.discount ? ` • Descuento: ${plan.discount}` : ""}
                              </div>
                              {plan.description && <div className="text-sm mt-1">{plan.description}</div>}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePaymentPlan(plan.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="destructive" onClick={() => handleDeleteProgram(selectedProgram.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsViewProgramOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditProgram}>
                  <Edit className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Componente para mostrar la lista de programas
function ProgramList({ programs, setSelectedProgram, setIsViewProgramOpen, getStatusBadge }: any) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <School className="mx-auto h-12 w-12 opacity-30 mb-2" />
        <p>No se encontraron programas académicos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program: any) => (
        <Card
          key={program.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setSelectedProgram(program)
            setIsViewProgramOpen(true)
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{program.name}</CardTitle>
              {getStatusBadge(program.status)}
            </div>
            <CardDescription>{program.code}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>
                  {program.level} • {program.modality}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {program.duration} • {program.credits} créditos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {program.availableSpots} de {program.totalSpots} cupos disponibles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${program.cost.toLocaleString()} MXN</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-1">Ocupación de cupos</div>
              <Progress
                value={((program.totalSpots - program.availableSpots) / program.totalSpots) * 100}
                className="h-2"
              />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

