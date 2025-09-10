
import type { Metadata } from "next"
import DashboardClient from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard | Blue Atlas",
  description: "Panel de control principal",
}

export default function DashboardPage() {
  return <DashboardClient />
}
