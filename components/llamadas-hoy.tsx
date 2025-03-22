import { MoreHorizontal } from "lucide-react"

export default function LlamadasHoy() {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Llamadas de hoy</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="p-8 flex justify-center items-center">
        <div className="text-6xl font-bold text-blue-500">4</div>
      </div>
    </div>
  )
}

