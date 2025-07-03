import api from './api'

export interface User {
  id: number
  name: string
  email: string
}

export const fetchUsers = async (): Promise<User[]> => {
  const res = await api.get('/users', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as User[]
}
