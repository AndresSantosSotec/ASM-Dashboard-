import React from "react"
import type { Metadata } from "next"
import ConciliacionClient from "./conciliacion-client"
import RouteGuard from "@/permissions/RouteGuard"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: "Conciliación de Pagos | Blue Atlas",
  description: "Gestión y conciliación de recibos de pago",
}

export default function ConciliacionPage() {
  return (
    <RouteGuard routePath={ROUTES.conciliacion}>
      <ConciliacionClient />
    </RouteGuard>
  )
}

