import type { Metadata } from "next"
import ConciliacionClient from "./conciliacion-client"

export const metadata: Metadata = {
  title: "Conciliación de Pagos | Blue Atlas",
  description: "Gestión y conciliación de recibos de pago",
}

export default function ConciliacionPage() {
  return <ConciliacionClient />
}

