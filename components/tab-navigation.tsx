"use client"

import { useState } from "react"

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState("mi-pagina")

  const tabs = [
    { id: "mi-pagina", label: "Mi Página" },
    { id: "captaciones", label: "Captaciones" },
    { id: "analisis", label: "Análisis" },
    { id: "gestor", label: "Gestor" },
  ]

  return (
    <div className="border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

