"use client"

import { useEffect, useState } from "react"
import { api } from "@/services/api"

import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { fetchCurrentUser, type User } from '@/services/users'


interface Cita {
  id: number
  datecita: string
  descricita: string

  created_by?: number
  user_id?: number

}

export default function CalendarioSemanal() {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const [citas, setCitas] = useState<Cita[]>([])

  const [user, setUser] = useState<User | null>(null)


  useEffect(() => {
    const fetchCitas = async () => {
      try {

        const currentUser = await fetchCurrentUser()
        setUser(currentUser)

        const res = await api.get('/citas')
        let data = Array.isArray(res.data) ? res.data : res.data.data || []

        const start = startOfWeek(new Date(), { weekStartsOn: 1 })
        const end = endOfWeek(new Date(), { weekStartsOn: 1 })

        data = data.filter((c: Cita) => {
          const d = new Date(c.datecita)
          const inWeek = isWithinInterval(d, { start, end })
          const owned =
            currentUser?.rol === 'Administrador' ||
            c.created_by === currentUser?.id ||
            c.user_id === currentUser?.id
          return inWeek && owned
        })


        setCitas(data)
      } catch (err) {
        console.error('Error fetching citas', err)
      }
    }
    fetchCitas()
  }, [])

  const eventos = citas.map(c => {
    const d = new Date(c.datecita)
    const diaIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
    return {
      dia: dias[diaIdx],
      hora: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      titulo: c.descricita,
      color: 'bg-blue-100 border-blue-300',
    }
  })

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

