import { redirect } from "next/navigation"

export default function ProgramasAdminRedirect() {
  redirect("/academico/programas")
  return null
}

