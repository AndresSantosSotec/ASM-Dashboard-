"use client"

import Swal from 'sweetalert2'
import axios from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Definimos el esquema de validación con zod
const formSchema = z.object({
  fecha: z.date({ required_error: "La fecha es requerida" }),
  nombreCompleto: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
  correoElectronico: z.string().email("Correo electrónico inválido"),
  genero: z.string({ required_error: "El género es requerido" }),
  empresaDondeLaboraActualmente: z.string().optional(),
  puesto: z.string().optional(),
  notasGenerales: z.string().optional(),
  observaciones: z.string().optional(),
  interes: z.string().optional(),
  nota1: z.string().optional(),
  nota2: z.string().optional(),
  nota3: z.string().optional(),
  cierre: z.string().optional(),
  // Campos para ubicación
  pais: z.string({ required_error: "El país es requerido" }),
  departamento: z.string({ required_error: "El departamento es requerido" }),
  municipio: z.string({ required_error: "El municipio es requerido" }),
})

type FormData = z.infer<typeof formSchema>

// Componente principal
export default function CapturaProspectos() {
  const [loading, setLoading] = useState(false)

  // Estado para almacenar los programas
  const [programas, setProgramas] = useState<
    { id: number; abreviatura: string; nombre_del_programa: string; meses: number }[]
  >([])

  // Estados para la ubicación (Guatemala)
  const [departamentos, setDepartamentos] = useState<
    { id: number; nombre: string; municipios: { id: number; nombre: string }[] }[]
  >([])
  const [municipios, setMunicipios] = useState<{ id: number; nombre: string }[]>([])

  // useForm con defaultValues para país=1 (Guatemala)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: new Date(),
      nombreCompleto: "",
      telefono: "",
      correoElectronico: "",
      genero: "",
      empresaDondeLaboraActualmente: "",
      puesto: "",
      notasGenerales: "",
      observaciones: "",
      interes: "",
      nota1: "",
      nota2: "",
      nota3: "",
      cierre: "",
      pais: "1", // Guatemala
      departamento: "",
      municipio: "",
    },
  })

  // Obtener la lista de programas
  useEffect(() => {
    const fetchProgramas = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/programas")
        setProgramas(response.data)
      } catch (error) {
        console.error("❌ Error al obtener programas:", error)
      }
    }
    fetchProgramas()
  }, [])

  // Al montar el componente, obtener la estructura de departamentos y municipios de Guatemala
  useEffect(() => {
    const fetchUbicacionGuatemala = async () => {
      try {
        // Suponiendo que /api/ubicacion/1 retorna la estructura del país con sus departamentos y municipios
        const response = await axios.get("http://localhost:8000/api/ubicacion/1")
        const data = response.data
        // Guardamos en estado los departamentos
        setDepartamentos(data.departamentos)
      } catch (error) {
        console.error("❌ Error al obtener ubicación de Guatemala:", error)
      }
    }
    fetchUbicacionGuatemala()
  }, [])

  // Función para cuando el usuario seleccione un departamento
  const handleDepartamentoChange = (value: string) => {
    // Actualizamos el valor del formulario
    form.setValue("departamento", value)
    // Buscamos el departamento en nuestro estado
    const dept = departamentos.find((d) => d.id.toString() === value)
    // Actualizamos la lista de municipios
    if (dept) {
      setMunicipios(dept.municipios)
    } else {
      setMunicipios([])
    }
    // Resetear el municipio si se cambia de departamento
    form.setValue("municipio", "")
  }

  // Función para cuando el usuario seleccione un municipio
  const handleMunicipioChange = (value: string) => {
    form.setValue("municipio", value)
  }

  // Manejo de envío del formulario
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      // Convertimos la fecha a formato YYYY-MM-DD
      const fechaFormateada = data.fecha.toISOString().split("T")[0]
      const response = await axios.post("http://localhost:8000/api/prospectos", {
        ...data,
        fecha: fechaFormateada,
      })
      console.log("✅ Prospecto guardado:", response.data)
      Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'Prospecto guardado exitosamente',
      })
      form.reset()
    } catch (error: any) {
      console.error("❌ Error al guardar prospecto:", error.response?.data || error.message)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al guardar el prospecto',
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          {/* Campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha */}
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP", { locale: es })
                            : "Seleccione una fecha"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre Completo */}
            <FormField
              control={form.control}
              name="nombreCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Correo Electrónico */}
            <FormField
              control={form.control}
              name="correoElectronico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el correo electrónico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Género */}
            <FormField
              control={form.control}
              name="genero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el género" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                      <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Empresa donde labora */}
            <FormField
              control={form.control}
              name="empresaDondeLaboraActualmente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa donde labora</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese la empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Puesto */}
            <FormField
              control={form.control}
              name="puesto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el puesto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notas generales */}
          <FormField
            control={form.control}
            name="notasGenerales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas generales</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ingrese notas generales" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Observaciones */}
          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ingrese observaciones" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Programa de Interés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="interes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa de Interés</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un programa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id.toString()}>
                          {programa.abreviatura} - {programa.nombre_del_programa} ({programa.meses} meses)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seguimientos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["nota1", "nota2", "nota3"].map((name, idx) => (
              <FormField
                key={name}
                control={form.control}
                name={name as keyof FormData}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{`Seguimiento ${idx + 1}`}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Ingrese el seguimiento ${idx + 1}`}
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString() : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Cierre */}
          <FormField
            control={form.control}
            name="cierre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cierre</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ingrese el cierre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sección de Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* País (Fijo Guatemala) */}
            <FormField
              control={form.control}
              name="pais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select disabled value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Guatemala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Guatemala</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Departamento (Elegible por el usuario) */}
            <FormField
              control={form.control}
              name="departamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={(value) => handleDepartamentoChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Municipio (Elegible por el usuario) */}
            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <Select
                    onValueChange={(value) => handleMunicipioChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un municipio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipios.map((mun) => (
                        <SelectItem key={mun.id} value={mun.id.toString()}>
                          {mun.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => form.reset()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Prospecto"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
