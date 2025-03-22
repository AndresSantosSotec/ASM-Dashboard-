"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  fecha: z.date({
    required_error: "La fecha es requerida",
  }),
  nombreCompleto: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
  correoElectronico: z.string().email("Correo electrónico inválido"),
  genero: z.string({
    required_error: "El género es requerido",
  }),
  empresaDondeLaboraActualmente: z.string().optional(),
  puesto: z.string().optional(),
  notasGenerales: z.string().optional(),
  observaciones: z.string().optional(),
  interes: z.string().optional(),
  status: z.string({
    required_error: "El status es requerido",
  }),
  nota1: z.string().optional(),
  nota2: z.string().optional(),
  nota3: z.string().optional(),
  cierre: z.string().optional(),
})

interface CapturaProspectosProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void
}

export default function CapturaProspectos({ onSubmit }: CapturaProspectosProps) {
  const form = useForm<z.infer<typeof formSchema>>({
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
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
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
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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

            {/* Selector Hombre/Mujer */}
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium">Seleccione:</span>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={form.getValues("genero") === "masculino" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => form.setValue("genero", "masculino")}
                >
                  Hombre
                </Button>
                <Button
                  type="button"
                  variant={form.getValues("genero") === "femenino" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => form.setValue("genero", "femenino")}
                >
                  Mujer
                </Button>
              </div>
            </div>

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
                  <Textarea placeholder="Ingrese notas generales" className="min-h-[100px]" {...field} />
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
                  <Textarea placeholder="Ingrese observaciones" className="min-h-[100px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interés */}
            <FormField
              control={form.control}
              name="interes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interés</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el interés" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no_interesa">No le interesa</SelectItem>
                      <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="no_respondio">No respondió</SelectItem>
                      <SelectItem value="interesa_mas_adelante">Le interesa más adelante</SelectItem>
                      <SelectItem value="inscrito">Inscrito</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nota 1 */}
            <FormField
              control={form.control}
              name="nota1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguimiento 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el seguimiento 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nota 2 */}
            <FormField
              control={form.control}
              name="nota2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguimiento 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el seguimiento 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nota 3 */}
            <FormField
              control={form.control}
              name="nota3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguimiento 3</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el seguimiento 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Cierre */}
          <FormField
            control={form.control}
            name="cierre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cierre</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ingrese el cierre" className="min-h-[100px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
          <Button type="submit">Guardar Prospecto</Button>
        </div>
      </form>
    </Form>
  )
}

