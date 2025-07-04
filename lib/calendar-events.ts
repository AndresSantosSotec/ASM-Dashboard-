import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { fetchCurrentUser } from '@/services/users'
import { fetchCitas, type Cita } from '@/services/citas'
import { fetchTareas, type Tarea } from '@/services/tareas'

export interface WeekEvents {
  citas: Cita[]
  tareas: Tarea[]
}

export const fetchWeekEvents = async (): Promise<WeekEvents> => {
  const [user, citas, tareas] = await Promise.all([
    fetchCurrentUser(),
    fetchCitas(),
    fetchTareas(),
  ])

  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  const end = endOfWeek(new Date(), { weekStartsOn: 1 })

  const filterOwn = <T extends { created_by?: number; user_id?: number; [k: string]: any }>(
    arr: T[],
    getDate: (item: T) => string,
  ) =>
    arr.filter((item) => {
      const d = new Date(getDate(item))
      const inWeek = isWithinInterval(d, { start, end })
      const owned =
        user?.rol === 'Administrador' ||
        item.created_by === user?.id ||
        item.user_id === user?.id
      return inWeek && owned
    })

  return {
    citas: filterOwn(citas, (c) => c.datecita),
    tareas: filterOwn(tareas, (t) => t.fecha),
  }
}
