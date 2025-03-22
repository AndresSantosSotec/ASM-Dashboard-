export default function IngresosPorMes() {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Ingresos por mes y leads</h2>
        <select className="text-sm border-none bg-transparent text-gray-500 focus:outline-none">
          <option>Todos los asesores</option>
          <option>Mi equipo</option>
        </select>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-3xl font-bold text-blue-500">Q 27.6K</div>
          <div className="text-sm text-gray-500">Total de leads: 79</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Q3k</span>
            <span>15</span>
          </div>

          <div className="h-24 relative">
            <svg viewBox="0 0 100 40" className="w-full h-full">
              <path
                d="M0,20 L10,15 L20,25 L30,10 L40,20 L50,15 L60,5 L70,15 L80,10 L90,5 L100,10"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              <path
                d="M0,30 L10,25 L20,35 L30,20 L40,30 L50,25 L60,15 L70,25 L80,20 L90,15 L100,20"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Q2k</span>
            <span>5</span>
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Ingresos</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Leads</span>
          </div>
          <div className="text-gray-500">Jun 2024</div>
        </div>
      </div>
    </div>
  )
}

