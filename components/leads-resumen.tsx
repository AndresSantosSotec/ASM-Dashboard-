import { MoreHorizontal } from "lucide-react"

export default function LeadsResumen() {
  const leads = [
    { title: "Interesado", count: 400 },
    { title: "No le interesa", count: 300 },
    { title: "En seguimiento", count: 200 },
    { title: "No volver a contactar", count: 100 },
  ]

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Resumen de Leads</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {leads.map((lead) => (
          <div key={lead.title} className="p-4 border-r last:border-r-0">
            <div className="text-sm font-medium text-gray-500">{lead.title}</div>
            <div className="text-2xl font-bold mt-1">{lead.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

