"use client"

import { useState } from "react"
import { Bell, ChevronDown, Menu, Plus, Search } from "lucide-react"
import Sidebar from "./sidebar"
import TabNavigation from "./tab-navigation"
import CaptacionesPanel from "./captaciones-panel"
import AnalisisPanel from "./analisis-panel"
import GestorPanel from "./gestor-panel"
import LeadsResumen from "./leads-resumen"
import ProspectosPorEstado from "./prospectos-por-estado"
import LlamadasHoy from "./llamadas-hoy"
import LeadsConvertidos from "./leads-convertidos"
import IngresosPorMes from "./ingresos-por-mes"
import CorreosEnviados from "./correos-enviados"
import MisProspectos from "./mis-prospectos"
import CalendarioSemanal from "./calendario-semanal"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b bg-white">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 mr-2 text-gray-500 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-blue-600 font-semibold text-lg">BlueAtlas</h1>
          </div>

          <div className="flex items-center border rounded-md px-2 py-1 bg-white w-64">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar"
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center">
            <button className="p-1 mr-2 text-gray-500 rounded-md hover:bg-gray-100">
              <Plus size={20} />
            </button>
            <button className="p-1 mr-2 text-gray-500 rounded-md hover:bg-gray-100">
              <span className="sr-only">Toggle theme</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M12 20V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.93 4.93L6.34 6.34"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.66 17.66L19.07 19.07"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M20 12H22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.34 17.66L4.93 19.07"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.07 4.93L17.66 6.34"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="relative">
              <button className="p-1 mr-2 text-gray-500 rounded-md hover:bg-gray-100">
                <Bell size={20} />
                <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  3
                </span>
              </button>
            </div>
            <button className="flex items-center text-sm font-medium text-gray-700">
              <span>Admin Dashboard</span>
              <ChevronDown size={16} className="ml-1" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <TabNavigation />

          <div className="p-4">
            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <CaptacionesPanel />
              <AnalisisPanel />
              <GestorPanel />
            </div>

            {/* Middle row */}
            <div className="mb-4">
              <LeadsResumen />
            </div>

            {/* Bottom row */}
            <div className="mb-4">
              <ProspectosPorEstado />
            </div>

            {/* Additional rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <LlamadasHoy />
              <LeadsConvertidos />
              <IngresosPorMes />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <CorreosEnviados />
              <MisProspectos />
            </div>

            <div className="mb-4">
              <CalendarioSemanal />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

