import { ChevronRight, MoreHorizontal } from "lucide-react"

export default function MisProspectos() {
  const prospectos = [
    {
      name: "Andrew Peterson",
      email: "andrew.peterson@example.com",
      phone: "+12197604114",
      status: "Interesado",
      source: "Formulario Web",
    },
    {
      name: "Nina Thomson",
      email: "nina.thomson@example.com",
      phone: "+10794476017",
      status: "En seguimiento",
      source: "Facebook",
    },
    {
      name: "George Barrios",
      email: "george.barrios@demo.com",
      phone: "+16330617624",
      status: "No le interesa",
      source: "Instagram",
    },
    {
      name: "Mirella Bruno",
      email: "mirella.bruno@example.com",
      phone: "+14567890123",
      status: "No volver a contactar",
      source: "LinkedIn",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Interesado":
        return "bg-green-100 text-green-800"
      case "En seguimiento":
        return "bg-blue-100 text-blue-800"
      case "No le interesa":
        return "bg-yellow-100 text-yellow-800"
      case "No volver a contactar":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Mis Prospectos
        </h2>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="divide-y">
        {prospectos.map((prospecto) => (
          <div key={prospecto.email} className="p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <ChevronRight size={16} className="mr-2 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium">{prospecto.name}</div>
                <div className="text-sm text-gray-500">{prospecto.email}</div>
                <div className="text-sm text-gray-500">{prospecto.phone}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(prospecto.status)}`}>
                  {prospecto.status}
                </span>
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{prospecto.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

