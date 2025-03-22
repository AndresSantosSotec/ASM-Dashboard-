export default function GestorPanel() {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h2 className="text-lg font-medium mb-2">Gestor de Captaciones</h2>
      <div className="text-3xl font-bold text-gray-800">23</div>
      <div className="text-sm text-gray-500">Tareas pendientes</div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Llamadas</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">12</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Reuniones</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">5</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Seguimientos</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">6</span>
        </div>
      </div>
    </div>
  )
}

