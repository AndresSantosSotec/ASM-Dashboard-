import api from './api'

export interface User {
  id: number
  name: string
  email: string

  rol?: string

}

export const fetchUsers = async (): Promise<User[]> => {
  const res = await api.get('/users', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as User[]
}

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await api.get('/user')
    return res.data as User
  } catch (err) {
    console.error('Error fetching current user', err)
    return null
  }
}

