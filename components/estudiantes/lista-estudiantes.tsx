"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Tipos de datos
interface Estudiante {
  id: string
  nombre: string
  carnet: string
  programa: string
  estado: "Activo" | "Inactivo" | "Graduado" | "Suspendido"
  fechaInicio: string
  estadoPago: "Al día" | "Pendiente" | "Atrasado"
}

export function ListaEstudiantes() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  
  // Datos de ejemplo - En producción estos vendrían de una API
  const estudiantes: Estudiante[] = [
    {
      id: "est-001",
      nombre: "Juan Pérez",
      carnet: "2025-0123",
      programa: "Desarrollo Web Full Stack",
      estado: "Activo",
      fechaInicio: "15/01/2025",
      estadoPago: "Al día"
    },
    {
      id: "est-002",
      nombre: "María López",
      carnet: "2025-0124",
      programa: "Diseño UX/UI",
      estado: "Activo",
      fechaInicio: "20/01/2025",
      estadoPago: "Pendiente"
    },
    {
      id: "est-003",
      nombre: "Carlos Rodríguez",
      carnet: "2025-0125",
      programa: "Data Science",
      estado: "Activo",
      fechaInicio: "10/01/2025",
      estadoPago: "Atrasado"
    },
    {
      id: "est-004",
      nombre: "Ana Martínez",
      carnet: "2025-0126",
      programa: "Desarrollo Web Full Stack",
      estado: "Inactivo",
      fechaInicio: "05/01/2025",
      estadoPago: "Al día"
    },
    {
      id: "est-005",
      nombre: "Roberto Gómez",
      carnet: "2024-0987",
      programa: "Ciberseguridad",
      estado: "Graduado",
      fechaInicio: "10/08/2024",
      estadoPago: "Al día"
    }
  ];

  // Filtrar estudiantes según la búsqueda
  const estudiantesFiltrados = estudiantes.filter(
    (est) => 
      est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      est.carnet.toLowerCase().includes(busqueda.toLowerCase()) ||
      est.programa.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Función para ver perfil de estudiante
  const verPerfil = (id: string) => {
    router.push(`/estudiantes/perfil/${id}`);
  };

  // Función para ver estado de cuenta
  const verEstadoCuenta = (id: string) => {
    router.push(`/estudiantes/estado-cuenta?id=${id}`);
  };

  // Función para descargar estado de cuenta
  const descargarEstadoCuenta = (id: string, nombre: string) => {
    setCargando(true);
    
    // Simulación de descarga - En producción, esto generaría un PDF
    setTimeout(() => {
      setCargando(false);
      // Aquí iría la lógica real de descarga
      alert(`Estado de cuenta de ${nombre} descargado correctamente`);
    }, 1500);
  };

  // Función para obtener el color de la badge según el estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Inactivo": return "bg-gray-100 text-gray-800";
      case "Graduado": return "bg-blue-100 text-blue-800";
      case "Suspendido": return "bg-red-100 text-red-800";
      default: return "";
    }
  };

  // Función para obtener el color de la badge según el estado de pago
  const getEstadoPagoColor = (estado: string) => {

