import { MoreHorizontal } from "lucide-react"

export default function LeadsConvertidos() {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Leads convertidos</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.8 + 0.1})`,
              }}
            ></div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>En Proceso</span>
          <span>Reciclado</span>
        </div>
      </div>
    </div>
  )
}

