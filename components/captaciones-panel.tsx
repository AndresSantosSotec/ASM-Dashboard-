export default function CaptacionesPanel() {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h2 className="text-lg font-medium mb-2">Mis Captaciones</h2>
      <div className="text-3xl font-bold text-gray-800">152</div>
      <div className="text-sm text-gray-500">Total de prospectos captados</div>

      <div className="mt-4 flex items-end space-x-2">
        <div className="bg-indigo-400 w-8 h-16 rounded"></div>
        <div className="bg-indigo-500 w-8 h-20 rounded"></div>
        <div className="bg-indigo-600 w-8 h-12 rounded"></div>
      </div>
    </div>
  )
}

