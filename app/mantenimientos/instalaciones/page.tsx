"use client"

import { useState } from "react"

export default function Instalaciones() {
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo
  const instalaciones = [
    { id: 1, nombre: "Campus Principal", direccion: "Av. Universidad 1234, Ciudad Universitaria", tipo: "Campus", capacidad: 5000, estado: "Activo", aulas: 120, laboratorios: 25, oficinas: 50 },
    { id: 2, nombre: "Edificio de Ciencias", direccion: "Av. Universidad 1234, Ciudad Universitaria", tipo: "Edificio", capacidad: 1200, estado: "Activo", aulas: 30, laboratorios: 15, oficinas: 10 },
    { id: 3, nombre: "Biblioteca Central", direccion: "Av. Universidad 1234, Ciudad Universitaria", tipo: "Biblioteca", capacidad: 800, estado: "Activo", aulas: 0, laboratorios: 0, oficinas: 5 },
    { id: 4, nombre: "Centro Deportivo", direccion: "Av. Universidad 1500, Ciudad Universitaria", tipo: "Deportivo", capacidad: 1500, estado: "Activo", aulas: 5, laboratorios: \

