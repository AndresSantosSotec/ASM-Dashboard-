"use client"

import { useEffect, useState } from "react"

import { fetchWeekEvents } from '@/lib/calendar-events'
import type { Cita } from '@/services/citas'
import type { Tarea } from '@/services/tareas'



export default function CalendarioSemanal() {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const [citas, setCitas] = useState<Cita[]>([])

  const [tareas, setTareas] = useState<Tarea[]>([])
   useEffect(() => {
    const loadEvents = async () => {
      try {

        const { citas, tareas } = await fetchWeekEvents()
        setCitas(citas)
        setTareas(tareas)

      } catch (err) {
        console.error('Error fetching calendar events', err)
      }
    }
    loadEvents()
  }, [])

  const eventos = [
    ...citas.map(c => {
      const d = new Date(c.datecita)
      const diaIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
      return {
        dia: dias[diaIdx],
        hora: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        titulo: c.descricita,
        color: 'bg-blue-100 border-blue-300',
      }
    }),
    ...tareas.map(t => {
      const d = new Date(t.fecha)
      const diaIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
      return {
        dia: dias[diaIdx],
        hora: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        titulo: t.titulo,
        color: 'bg-purple-100 border-purple-300',
      }
    }),
  ]


  const hoy = dias[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <h2 className="text-lg font-medium mb-4">Calendario Semanal del Asesor</h2>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia) => (
          <div key={dia} className="border rounded-lg">
            <div
              className={`p-2 text-center font-medium text-sm border-b ${
                dia === hoy ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              {dia}
              {dia === hoy && <div className="text-xs text-blue-600">Hoy</div>}
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

