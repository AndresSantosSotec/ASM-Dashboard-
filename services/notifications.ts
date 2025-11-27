import { api } from './api';

export interface InternalNotification {
  id: number;
  user_id: number;
  prospecto_id: number | null;
  type: string;
  title: string;
  message: string;
  route: string | null;
  data: {
    prospecto_id?: number;
    prospecto_nombre?: string;
    prospecto_carnet?: string;
    from_status?: string;
    to_status?: string;
    performed_by_id?: number;
    performed_by_name?: string;
    programa?: string;
    comentario?: string;
  } | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  prospecto?: {
    id: number;
    nombre_completo: string;
    carnet: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface NotificationResponse {
  success: boolean;
  data: InternalNotification[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  meta: {
    unread_count: number;
    total_count: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

/**
 * Obtiene las notificaciones del usuario autenticado
 */
export async function fetchNotifications(
  page: number = 1,
  perPage: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationResponse> {
  const response = await api.get('/notificaciones', {
    params: { page, per_page: perPage, unread_only: unreadOnly },
  });
  return response.data;
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(id: number): Promise<void> {
  await api.post(`/notificaciones/${id}/marcar-leida`);
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  const response = await api.post('/notificaciones/marcar-todas-leidas');
  return response.data;
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>('/notificaciones/unread-count');
  return response.data.count;
}

/**
 * Limpia las notificaciones del usuario
 * @param todas - Si es true, elimina TODAS las notificaciones (leídas y no leídas). Si es false, solo elimina las leídas.
 */
export async function limpiarNotificaciones(todas: boolean = false): Promise<{ count: number }> {
  const response = await api.delete('/notificaciones/limpiar', {
    params: { todas },
  });
  return response.data;
}

/**
 * Elimina una notificación individual
 */
export async function eliminarNotificacion(id: number): Promise<void> {
  await api.delete(`/notificaciones/${id}`);
}

