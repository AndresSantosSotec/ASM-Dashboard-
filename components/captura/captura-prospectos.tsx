"use client"

import Swal from 'sweetalert2'
import axios from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Textarea } from "@/components/ui/textarea"
import { geoNamesService, type Country, type Region, type Municipality } from "@/services/geonames"
import { Clock, Calendar, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import CargaMasivaProspectos from "./tabs/CargaMasivaProspectos"

// Definimos el esquema de validación con zod
const formSchema = z.object({
  fecha: z.date({ required_error: "La fecha es requerida" }),
  nombreCompleto: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().optional(),
  correoElectronico: z.string().optional(),
  genero: z.string({ required_error: "El género es requerido" }),
  empresaDondeLaboraActualmente: z.string().optional(),
  puesto: z.string().optional(),
  Origen: z.string().optional(),
  notasGenerales: z.string().optional(),
  observaciones: z.string().optional(),
  interes: z.string().optional(),
  mesesPrograma: z.string().optional(), // Nuevo campo para los meses
  nota1: z.string().optional(),
  nota2: z.string().optional(),
  nota3: z.string().optional(),
  cierre: z.string().optional(),
  // Campos para ubicación
  pais: z.string({ required_error: "El país es requerido" }),
  departamento: z.string({ required_error: "El departamento es requerido" }),
  municipio: z.string({ required_error: "El municipio es requerido" }),
}).refine(
  (data) => {
    // Validación: Debe tener al menos correo O teléfono
    const tieneCorreo = data.correoElectronico && data.correoElectronico.trim().length > 0;
    const tieneTelefono = data.telefono && data.telefono.trim().length >= 8;
    return tieneCorreo || tieneTelefono;
  },
  {
    message: "Debe ingresar al menos el correo electrónico o el teléfono",
    path: ["correoElectronico"], // Muestra el error en el campo de correo
  }
).refine(
  (data) => {
    // Si ingresa correo, debe ser válido
    if (data.correoElectronico && data.correoElectronico.trim().length > 0) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correoElectronico);
    }
    return true;
  },
  {
    message: "El correo electrónico no es válido",
    path: ["correoElectronico"],
  }
)


type FormData = z.infer<typeof formSchema>

// Función para traducir nombres de campos al español
function traducirCampo(campo: string): string {
  const traducciones: Record<string, string> = {
    'nombre_completo': 'Nombre Completo',
    'nombreCompleto': 'Nombre Completo',
    'correo_electronico': 'Correo Electrónico',
    'correoElectronico': 'Correo Electrónico',
    'telefono': 'Teléfono',
    'genero': 'Género',
    'fecha': 'Fecha',
    'empresa_donde_labora_actualmente': 'Empresa',
    'empresaDondeLaboraActualmente': 'Empresa',
    'puesto': 'Puesto',
    'pais': 'País',
    'pais_origen': 'País de Origen',
    'departamento': 'Departamento',
    'municipio': 'Municipio',
    'interes': 'Programa de Interés',
    'medio_conocimiento_institucion': 'Medio de Conocimiento',
    'Origen': 'Origen/Canal',
    'notas_generales': 'Notas Generales',
    'notasGenerales': 'Notas Generales',
    'observaciones': 'Observaciones',
    'mesesPrograma': 'Meses del Programa',
  }
  return traducciones[campo] || campo.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
}

// Componente principal
export default function CapturaProspectos() {
  const [loading, setLoading] = useState(false)

  // Estado para almacenar los programas
  const [programas, setProgramas] = useState<
    { id: number; abreviatura: string; nombre_del_programa: string; meses: number }[]
  >([])

  // Estados para GeoNames
  const [paises, setPaises] = useState<Country[]>([])
  const [departamentos, setDepartamentos] = useState<Region[]>([])
  const [municipios, setMunicipios] = useState<Municipality[]>([])
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false)
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  
  // Estados para búsqueda/filtrado
  const [searchPais, setSearchPais] = useState("")
  const [searchDepartamento, setSearchDepartamento] = useState("")
  const [searchMunicipio, setSearchMunicipio] = useState("")

  const [empresas, setEmpresas] = useState<{ id: number; nombre: string; descripcion: string | null; activo: boolean }[]>([])

  const [showOtherCompany, setShowOtherCompany] = useState(false);
  const [showOtherOrigin, setShowOtherOrigin] = useState(false);

  // Estados para selector de asesor
  const [asesores, setAsesores] = useState<{ id: number; nombre: string }[]>([])
  const [selectedAsesorId, setSelectedAsesorId] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<{ id: number; rol: string; nombre: string } | null>(null)

  // Estados para la sección de tareas
  const [showTareaSection, setShowTareaSection] = useState(false);
  const [tareaData, setTareaData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    horaInicio: "09:00",
    horaFin: "10:00",
    tipo: "tarea" as "tarea" | "reunion" | "recordatorio" | "llamada",
  });

  // useForm with GeoNames support
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: new Date(),
      nombreCompleto: "",
      telefono: "",
      correoElectronico: "",
      genero: "masculino",
      empresaDondeLaboraActualmente: "",
      puesto: "",
      Origen: "",
      notasGenerales: "",
      observaciones: "",
      interes: "",
      mesesPrograma: "",
      nota1: "",
      nota2: "",
      nota3: "",
      cierre: "",
      pais: "",
      departamento: "",
      municipio: "",
    },
  })

  // Obtener la lista de programas
  useEffect(() => {
    const fetchProgramas = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programas`)
        setProgramas(response.data)
      } catch (error) {
        console.error("❌ Error al obtener programas:", error)
      }
    }
    fetchProgramas()
  }, [])

  //obtener la lista de empresas 
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/convenios`)
        setEmpresas(response.data)
      } catch (error) {
        console.error("❌ Error al obtener empresas:", error)
      }
    }
    fetchEmpresas()
  }, [])

  // Cargar usuario actual y lista de asesores
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        const nombre = user.full_name ?? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username ?? "—")
        setCurrentUser({ id: user.id, rol: user.rol || "", nombre })
        if ((user.rol || "").toLowerCase() === "asesor") {
          setSelectedAsesorId(String(user.id))
        }
      }
    } catch (e) {
      console.error("Error parsing user:", e)
    }

    const token = localStorage.getItem("token")
    fetch(`${API_BASE_URL}/api/users/role/7`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(json => {
        const users: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
        setAsesores(
          users.map(u => ({
            id: u.id,
            nombre:
              u.full_name ??
              (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username ?? "—"),
          }))
        )
      })
      .catch(() => setAsesores([]))
  }, [])

  // Cargar países al montar el componente
  useEffect(() => {
    const loadPaises = async () => {
      try {
        const paisesData = await geoNamesService.getCountries()
        setPaises(paisesData)
        
        // 🚀 OPTIMIZACIÓN: Pre-cargar Guatemala automáticamente
        const guatemala = paisesData.find(p => p.countryCode === 'GT')
        if (guatemala) {
          form.setValue("pais", guatemala.geonameId.toString())
          await cargarGuatemalaCompleta(guatemala.geonameId)
        }
      } catch (error) {
        console.error("❌ Error al obtener países:", error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los países'
        })
      }
    }
    loadPaises()
  }, [])

  // 🚀 Función optimizada para cargar Guatemala completa
  const cargarGuatemalaCompleta = async (geonameId: number) => {
    setLoadingDepartamentos(true)
    try {
      // Usar endpoint especial que trae todo pre-cacheado
      const guatemalaData = await geoNamesService.getGuatemalaData()
      if (guatemalaData && guatemalaData.departamentos) {
        setDepartamentos(guatemalaData.departamentos)
      }
    } catch (error) {
      console.error("❌ Error al cargar Guatemala:", error)
      // Fallback a carga normal si falla
      const regionesData = await geoNamesService.getRegions(geonameId)
      setDepartamentos(regionesData)
    } finally {
      setLoadingDepartamentos(false)
    }
  }

  // Función para cuando el usuario seleccione un país
  const handlePaisChange = async (value: string) => {
    form.setValue("pais", value)
    form.setValue("departamento", "")
    form.setValue("municipio", "")
    setDepartamentos([])
    setMunicipios([])
    setSearchDepartamento("")
    setSearchMunicipio("")
    
    if (!value) return

    const geonameId = parseInt(value)
    const paisSeleccionado = paises.find(p => p.geonameId === geonameId)
    
    // 🚀 OPTIMIZACIÓN: Si es Guatemala, usar endpoint especial
    if (paisSeleccionado?.countryCode === 'GT') {
      await cargarGuatemalaCompleta(geonameId)
      return
    }

    // Para otros países, carga normal
    setLoadingDepartamentos(true)
    try {
      const regionesData = await geoNamesService.getRegions(geonameId)
      setDepartamentos(regionesData)
    } catch (error) {
      console.error("❌ Error al obtener departamentos:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los departamentos'
      })
    } finally {
      setLoadingDepartamentos(false)
    }
  }

  // Función para cuando el usuario seleccione un departamento
  const handleDepartamentoChange = async (value: string) => {
    form.setValue("departamento", value)
    form.setValue("municipio", "")
    setMunicipios([])
    setSearchMunicipio("")
    
    if (!value) return

    setLoadingMunicipios(true)
    try {
      const geonameId = parseInt(value)
      const municipiosData = await geoNamesService.getMunicipalities(geonameId)
      setMunicipios(municipiosData)
    } catch (error) {
      console.error("❌ Error al obtener municipios:", error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los municipios'
      })
    } finally {
      setLoadingMunicipios(false)
    }
  }

  // 🔍 Funciones de filtrado
  const paisesFiltrados = paises.filter(p => 
    p.countryName.toLowerCase().includes(searchPais.toLowerCase())
  )
  
  const departamentosFiltrados = departamentos.filter(d => 
    d.name.toLowerCase().includes(searchDepartamento.toLowerCase())
  )
  
  const municipiosFiltrados = municipios.filter(m => 
    m.name.toLowerCase().includes(searchMunicipio.toLowerCase())
  )

  // Función para crear tarea en el calendario
  const crearTareaCalendario = async () => {
    if (!tareaData.titulo.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El título de la tarea es requerido",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      
      // Preparar fecha en formato ISO
      const fechaISO = new Date(tareaData.fecha + "T00:00:00").toISOString()
      
      // Incluir datos del prospecto en la descripción
      const nombre = form.getValues("nombreCompleto") || ""
      const correo = form.getValues("correoElectronico") || ""
      const telefono = form.getValues("telefono") || ""
      
      let descripcionCompleta = tareaData.descripcion || ""
      if (nombre || correo || telefono) {
        const prospectInfo = [
          nombre ? `Prospecto: ${nombre}` : "",
          correo ? `Correo: ${correo}` : "",
          telefono ? `Teléfono: ${telefono}` : "",
        ].filter(Boolean).join(" | ")
        descripcionCompleta = prospectInfo + (descripcionCompleta ? `\n${descripcionCompleta}` : "")
      }
      
      const payload = {
        titulo: tareaData.titulo,
        descripcion: descripcionCompleta,
        fecha: fechaISO,
        hora_inicio: tareaData.horaInicio,
        hora_fin: tareaData.horaFin,
        tipo: tareaData.tipo,
        completada: false,
      }

      await axios.post(`${API_BASE_URL}/api/tareas`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      Swal.fire({
        icon: "success",
        title: "Tarea creada",
        text: "La tarea se agregó al calendario exitosamente",
        timer: 2000
      })

      // Limpiar formulario de tarea
      setTareaData({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        horaInicio: "09:00",
        horaFin: "10:00",
        tipo: "tarea",
      })
      setShowTareaSection(false)
    } catch (error: any) {
      console.error("❌ Error al crear tarea:", error)
      Swal.fire({
        icon: "error",
        title: "Error al crear tarea",
        text: error.response?.data?.message || "No se pudo crear la tarea",
      })
    }
  }


  // Manejo de envío del formulario
  const onSubmit = async (data: FormData) => {
    try {
      // ⚠️ Validación: Si seleccionó "Otros" en empresa, debe especificar la empresa
      if (showOtherCompany && (!data.empresaDondeLaboraActualmente || !data.empresaDondeLaboraActualmente.trim())) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Debe especificar el nombre de la empresa cuando selecciona 'Otros'.",
        });
        return;
      }

      // ⚠️ Validación adicional: Advertir si falta correo O teléfono
      const tieneCorreo = data.correoElectronico && data.correoElectronico.trim().length > 0;
      const tieneTelefono = data.telefono && data.telefono.trim().length >= 8;
      
      if (!tieneCorreo && !tieneTelefono) {
        Swal.fire({
          icon: "warning",
          title: "Información incompleta",
          html: `
            <p class="mb-3">No se ha ingresado <strong>correo electrónico</strong> ni <strong>teléfono</strong>.</p>
            <p class="text-sm text-gray-600">Es necesario al menos uno de estos datos para el seguimiento del prospecto.</p>
          `,
          showCancelButton: true,
          confirmButtonText: "Agregar datos",
          cancelButtonText: "Guardar de todos modos",
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
        }).then((result) => {
          if (result.isDismissed) {
            // Usuario decidió guardar sin correo ni teléfono
            continueSubmit(data);
          }
        });
        return;
      }

      // Si solo tiene uno, mostrar advertencia informativa
      if (!tieneCorreo || !tieneTelefono) {
        const falta = !tieneCorreo ? "correo electrónico" : "teléfono";
        const resultado = await Swal.fire({
          icon: "info",
          title: "Información opcional",
          html: `
            <p class="mb-3">No se ha ingresado <strong>${falta}</strong>.</p>
            <p class="text-sm text-gray-600">Podrá actualizar esta información después en la sección de gestión.</p>
          `,
          showCancelButton: true,
          confirmButtonText: "Continuar guardando",
          cancelButtonText: "Agregar ahora",
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#3b82f6",
        });

        if (resultado.isDismissed) {
          return; // Usuario quiere agregar el dato faltante
        }
      }

      // Continuar con el guardado
      await continueSubmit(data);
    } catch (error: any) {
      setLoading(false);
      console.error("❌ Error en onSubmit:", error);
    }
  };

  // Función auxiliar para ejecutar el guardado
  const continueSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      const fechaFormateada = data.fecha.toISOString().split("T")[0]
      const token = localStorage.getItem("token")
      
      // Obtener nombres de las ubicaciones seleccionadas
      const paisSeleccionado = paises.find(p => p.geonameId.toString() === data.pais)
      const departamentoSeleccionado = departamentos.find(d => d.geonameId.toString() === data.departamento)
      const municipioSeleccionado = municipios.find(m => m.geonameId.toString() === data.municipio)
      
      const payload = {
        ...data,
        fecha: fechaFormateada,
        medio_conocimiento_institucion: data.Origen,
        // Enviar tanto los IDs como los nombres
        pais: data.pais,
        paisNombre: paisSeleccionado?.countryName || '',
        departamento: data.departamento,
        departamentoNombre: departamentoSeleccionado?.name || '',
        municipio: data.municipio,
        municipioNombre: municipioSeleccionado?.name || '',
        // Asesor asignado (solo admin puede asignar a otro)
        ...(selectedAsesorId ? { asesor_id: Number(selectedAsesorId) } : {}),
      }
      
      await axios.post(`${API_BASE_URL}/api/prospectos`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // 🔄 Disparar evento para invalidar caché en otros componentes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("prospecto:created"))
      }
      
      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "Prospecto guardado exitosamente",
      })
      form.reset()
      // Limpiar estados de ubicación
      setDepartamentos([])
      setMunicipios([])
    } catch (error: any) {
      console.error("❌ Error completo al guardar prospecto:", error)
      console.error("❌ Response status:", error.response?.status)
      console.error("❌ Response data:", error.response?.data)
      
      let errorMessage = "Error al guardar prospecto"
      let erroresDetallados = ""
      
      // Manejar errores de validación (422)
      if (error.response?.status === 422) {
        const responseData = error.response.data
        
        // Laravel puede devolver 'errors' o 'messages'
        const errors = responseData.errors || responseData.messages || {}
        
        console.log("🔍 Errores detectados:", errors)
        
        if (Object.keys(errors).length > 0) {
          const camposConError: string[] = []
          
          Object.keys(errors).forEach(campo => {
            const mensajes = Array.isArray(errors[campo]) ? errors[campo] : [errors[campo]]
            mensajes.forEach((msg: string) => {
              // Traducir nombres de campos al español
              const campoTraducido = traducirCampo(campo)
              camposConError.push(`• <strong>${campoTraducido}:</strong> ${msg}`)
            })
          })
          
          if (camposConError.length > 0) {
            erroresDetallados = camposConError.join("<br>")
            Swal.fire({
              icon: "error",
              title: "Errores de validación",
              html: `<div class="text-left"><p class="mb-2">Por favor corrija los siguientes campos:</p>${erroresDetallados}</div>`,
              confirmButtonText: "Entendido",
            })
            console.error("❌ Errores de validación:", errors)
            setLoading(false)
            return
          }
        }
        
        // Si no hay errores específicos pero hay un mensaje general
        if (responseData.message || responseData.error) {
          errorMessage = responseData.message || responseData.error || "Error de validación"
        }
      }
      
      // Si el error contiene "has already been taken", se reemplaza por un mensaje en español
      if (errorMessage.toLowerCase().includes("has already been taken")) {
        errorMessage = "El correo electrónico ya ha sido registrado"
      }
      if (
        errorMessage.toLowerCase().includes("correo") &&
        errorMessage.toLowerCase().includes("unique")
      ) {
        Swal.fire({
          icon: "error",
          title: "Correo ya registrado",
          text:
            "El correo electrónico ya está asignado o fue registrado previamente. Detalle: " +
            errorMessage,
        })
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al guardar prospecto",
          text:
            "Ocurrió un error al guardar el prospecto. Detalle: " +
            errorMessage,
        })
      }
      console.error("❌ Error al guardar prospecto:", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="individual" className="space-y-4">
      <TabsList>
        <TabsTrigger value="individual">Captura Individual</TabsTrigger>
        <TabsTrigger value="masiva">Importar Estudiantes</TabsTrigger>
      </TabsList>

      <TabsContent value="individual">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Tu formulario completo actual */}
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
              {/* Selector de asesor */}
              {asesores.length > 0 && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2">Asesor asignado</label>
                  <Select
                    value={selectedAsesorId}
                    onValueChange={setSelectedAsesorId}
                    disabled={currentUser?.rol?.toLowerCase() === "asesor"}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue placeholder="Seleccione un asesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {asesores
                        .filter(a => currentUser?.rol?.toLowerCase() === "asesor" ? a.id === currentUser.id : true)
                        .map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Campos principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha</FormLabel>
                      <SimpleDatePicker
                        value={field.value ? field.value.toISOString().split("T")[0] : ""}
                        onChange={(v) => field.onChange(v ? new Date(v + "T00:00:00") : undefined)}
                      />
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
                      <FormLabel>
                        Teléfono <span className="text-xs text-gray-500">(Requerido si no hay correo)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese el teléfono (mínimo 8 dígitos)" {...field} />
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
                      <FormLabel>
                        Correo Electrónico <span className="text-xs text-gray-500">(Requerido si no hay teléfono)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@correo.com" {...field} />
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
                          <SelectItem value="prefiero_no_decir">
                            Prefiero no decir
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa donde labora */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="empresaDondeLaboraActualmente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa donde labora</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (value === "otros") {
                              setShowOtherCompany(true);
                              field.onChange("");
                            } else {
                              setShowOtherCompany(false);
                              field.onChange(value);
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione la empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empresas
                              .filter(empresa => empresa.activo)
                              .map((empresa) => (
                                <SelectItem key={empresa.id} value={empresa.nombre}>
                                  {empresa.nombre}
                                </SelectItem>
                              ))}
                            <SelectItem value="otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showOtherCompany && (
                    <FormField
                      control={form.control}
                      name="empresaDondeLaboraActualmente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especifique la empresa <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ingrese el nombre de la empresa"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

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

                {/* Origen */}
                <FormField
                  control={form.control}
                  name="Origen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origen</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "otros") {
                            setShowOtherOrigin(true);
                            field.onChange("");
                          } else {
                            setShowOtherOrigin(false);
                            field.onChange(value);
                          }
                        }}
                        value={showOtherOrigin ? "otros" : field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el origen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="referido">Referido</SelectItem>
                          <SelectItem value="whatsapp_corporativo">
                            WhatsApp Corporativo
                          </SelectItem>
                          <SelectItem value="pagina_web">Página Web</SelectItem>
                          <SelectItem value="actividades_escritorio">
                            Actividades de Escritorio
                          </SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showOtherOrigin && (
                  <FormField
                    control={form.control}
                    name="Origen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique el origen</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese el origen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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

              {/* Sección de Tareas para Calendario */}
              <div className="border-t pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Agregar Tarea al Calendario
                    </h3>
                    <p className="text-sm text-gray-600">
                      Crea una tarea de seguimiento asociada a este prospecto
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={showTareaSection ? "outline" : "default"}
                    onClick={() => setShowTareaSection(!showTareaSection)}
                  >
                    {showTareaSection ? "Ocultar" : <><Plus className="h-4 w-4 mr-2" /> Nueva Tarea</>}
                  </Button>
                </div>

                {showTareaSection && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Detalles de la Tarea</CardTitle>
                      <CardDescription>
                        Esta tarea aparecerá en el calendario para dar seguimiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Info del prospecto asociado */}
                      {(form.getValues("nombreCompleto") || form.getValues("telefono") || form.getValues("correoElectronico")) && (
                        <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                          <p className="text-xs font-semibold text-blue-700 mb-1">📋 Prospecto asociado:</p>
                          <div className="flex flex-wrap gap-4 text-sm text-blue-900">
                            {form.getValues("nombreCompleto") && (
                              <span className="font-medium">{form.getValues("nombreCompleto")}</span>
                            )}
                            {form.getValues("correoElectronico") && (
                              <span>📧 {form.getValues("correoElectronico")}</span>
                            )}
                            {form.getValues("telefono") && (
                              <span>📞 {form.getValues("telefono")}</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Título de la tarea */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Título de la Tarea *
                          </label>
                          <Input
                            placeholder="Ej: Llamar para seguimiento"
                            value={tareaData.titulo}
                            onChange={(e) => setTareaData({ ...tareaData, titulo: e.target.value })}
                          />
                        </div>

                        {/* Tipo de tarea */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tipo</label>
                          <Select
                            value={tareaData.tipo}
                            onValueChange={(value) =>
                              setTareaData({ ...tareaData, tipo: value as any })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tarea">📋 Tarea</SelectItem>
                              <SelectItem value="reunion">👥 Reunión</SelectItem>
                              <SelectItem value="llamada">📞 Llamada</SelectItem>
                              <SelectItem value="recordatorio">⏰ Recordatorio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Textarea
                          placeholder="Detalles de la tarea..."
                          value={tareaData.descripcion}
                          onChange={(e) =>
                            setTareaData({ ...tareaData, descripcion: e.target.value })
                          }
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Fecha */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Fecha
                          </label>
                          <SimpleDatePicker
                            value={tareaData.fecha}
                            onChange={(v) => setTareaData({ ...tareaData, fecha: v })}
                          />
                        </div>

                        {/* Hora inicio */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hora Inicio
                          </label>
                          <Input
                            type="time"
                            value={tareaData.horaInicio}
                            onChange={(e) =>
                              setTareaData({ ...tareaData, horaInicio: e.target.value })
                            }
                          />
                        </div>

                        {/* Hora fin */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hora Fin
                          </label>
                          <Input
                            type="time"
                            value={tareaData.horaFin}
                            onChange={(e) =>
                              setTareaData({ ...tareaData, horaFin: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowTareaSection(false)
                            setTareaData({
                              titulo: "",
                              descripcion: "",
                              fecha: new Date().toISOString().split("T")[0],
                              horaInicio: "09:00",
                              horaFin: "10:00",
                              tipo: "tarea",
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={crearTareaCalendario}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Guardar Tarea
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Programa de Interés */}
              {/* Programa de Interés */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="interes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programa de Interés</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Actualizar los meses cuando se selecciona un programa
                          const programaSeleccionado = programas.find(p => p.id.toString() === value);
                          if (programaSeleccionado) {
                            form.setValue("mesesPrograma", programaSeleccionado.meses.toString());
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un programa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programas.map((programa) => (
                            <SelectItem
                              key={programa.id}
                              value={programa.id.toString()}
                            >
                              {programa.abreviatura} - {programa.nombre_del_programa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo para los meses */}
                <FormField
                  control={form.control}
                  name="mesesPrograma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (meses)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Meses de duración"
                          value={field.value ?? ""}   // ← aquí el fallback
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^[1-9]\d*$/.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seguimientos */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            value={
                              field.value instanceof Date
                                ? field.value.toISOString()
                                : field.value
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div> */}

              {/* Cierre */}
              {/* <FormField
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
              /> */}

              {/* Sección de Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* País */}
                <FormField
                  control={form.control}
                  name="pais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select
                        onValueChange={handlePaisChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div className="px-2 py-1.5">
                            <Input
                              placeholder="🔍 Buscar país..."
                              value={searchPais}
                              onChange={(e) => setSearchPais(e.target.value)}
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-[200px] overflow-y-auto">
                            {paisesFiltrados.length === 0 ? (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                No se encontraron países
                              </div>
                            ) : (
                              paisesFiltrados.map((pais) => (
                                <SelectItem key={pais.geonameId} value={pais.geonameId.toString()}>
                                  {pais.countryName}
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Departamento */}
                <FormField
                  control={form.control}
                  name="departamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select
                        onValueChange={handleDepartamentoChange}
                        value={field.value}
                        disabled={!form.watch("pais") || loadingDepartamentos}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingDepartamentos 
                                ? "Cargando..." 
                                : departamentos.length === 0 
                                  ? "Seleccione un país primero" 
                                  : "Seleccione un departamento"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departamentos.length > 0 && (
                            <div className="px-2 py-1.5">
                              <Input
                                placeholder="🔍 Buscar departamento..."
                                value={searchDepartamento}
                                onChange={(e) => setSearchDepartamento(e.target.value)}
                                className="h-8"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <div className="max-h-[200px] overflow-y-auto">
                            {departamentosFiltrados.length === 0 && departamentos.length > 0 ? (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                No se encontraron departamentos
                              </div>
                            ) : (
                              departamentosFiltrados.map((dept) => (
                                <SelectItem key={dept.geonameId} value={dept.geonameId.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Municipio */}
                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue("municipio", value)}
                        value={field.value}
                        disabled={!form.watch("departamento") || loadingMunicipios}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingMunicipios 
                                ? "Cargando..." 
                                : municipios.length === 0 
                                  ? "Seleccione un departamento primero" 
                                  : "Seleccione un municipio"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {municipios.length > 0 && (
                            <div className="px-2 py-1.5">
                              <Input
                                placeholder="🔍 Buscar municipio..."
                                value={searchMunicipio}
                                onChange={(e) => setSearchMunicipio(e.target.value)}
                                className="h-8"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <div className="max-h-[200px] overflow-y-auto">
                            {municipiosFiltrados.length === 0 && municipios.length > 0 ? (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                No se encontraron municipios
                              </div>
                            ) : (
                              municipiosFiltrados.map((mun) => (
                                <SelectItem key={mun.geonameId} value={mun.geonameId.toString()}>
                                  {mun.name}
                                </SelectItem>
                              ))
                            )}
                          </div>
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
      </TabsContent>

      <TabsContent value="masiva">
        <CargaMasivaProspectos />
      </TabsContent>
    </Tabs>
  )
}
