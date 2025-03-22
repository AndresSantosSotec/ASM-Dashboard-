export default function ProspectosPorEstado() {
  const data = [
    { label: "Interesado", value: 400 },
    { label: "No le interesa", value: 300 },
    { label: "En seguimiento", value: 200 },
    { label: "No volver a contactar", value: 100 },
  ]

  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <h2 className="text-lg font-medium mb-4">Distribución de Prospectos por Estado</h2>

      <div className="h-64">
        <div className="flex h-full items-end space-x-6">
          {data.map((item) => (
            <div key={item.label} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-indigo-500 rounded-t"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              ></div>
              <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

