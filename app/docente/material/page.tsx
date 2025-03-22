import type { Metadata } from "next"
import MaterialDidacticoClient from "./material-didactico-client"

export const metadata: Metadata = {
  title: "Material Didáctico | Portal Docente",
  description: "Gestión de material didáctico para cursos",
}

export default function MaterialDidactico() {
  return <MaterialDidacticoClient />
}

