export default function CalendarioSemanal() {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const eventos = [
    { dia: "Lunes", hora: "09:00", titulo: "Llamada con Juan Pérez", color: "bg-blue-100 border-blue-300" },
    {
      dia: "Martes",
      hora: "11:00",
      titulo: "Reunión virtual con María García",
      color: "bg-purple-100 border-purple-300",
      hoy: true,
    },
    {
      dia: "Miércoles",
      hora: "15:00",
      titulo: "Seguimiento a Carlos Rodríguez",
      color: "bg-green-100 border-green-300",
    },
    {
      dia: "Viernes",
      hora: "10:00",
      titulo: "Presentación a nuevo prospecto",
      color: "bg-orange-100 border-orange-300",
    },
  ]

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <h2 className="text-lg font-medium mb-4">Calendario Semanal del Asesor</h2>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia) => (
          <div key={dia} className="border rounded-lg">
            <div
              className={`p-2 text-center font-medium text-sm border-b ${
                dia === "Martes" ? "bg-blue-50 text-blue-600" : ""
              }`}
            >
              {dia}
              {dia === "Martes" && <div className="text-xs text-blue-600">Hoy</div>}
            </div>

            <div className="p-2 h-32">
              {eventos
                .filter((evento) => evento.dia === dia)
                .map((evento, index) => (
                  <div key={index} className={`p-1 mb-1 text-xs border-l-2 rounded ${evento.color}`}>
                    <div className="font-medium">{evento.hora}</div>
                    <div>{evento.titulo}</div>
                  </div>
                ))}

              {!eventos.some((evento) => evento.dia === dia) && (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Sin eventos</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

