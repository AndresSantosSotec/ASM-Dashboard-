import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  limpiarNotificaciones,
  eliminarNotificacion,
  type InternalNotification,
} from '@/services/notifications';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
  perPage?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
    perPage = 20,
  } = options;

  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Cargar notificaciones
  const loadNotifications = useCallback(
    async (page: number = 1, unreadOnly: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchNotifications(page, perPage, unreadOnly);
        setNotifications(response.data);
        setUnreadCount(response.meta.unread_count);
        setTotalCount(response.meta.total_count);
        setCurrentPage(response.pagination.current_page);
        setTotalPages(response.pagination.last_page);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al cargar notificaciones');
        setError(error);
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [perPage]
  );

  // Cargar solo el conteo de no leídas (más rápido)
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  // Marcar una notificación como leída
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await markNotificationAsRead(id);
        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
          )
        );
        // Actualizar contador
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
        throw err;
      }
    },
    []
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllNotificationsAsRead();
      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read_at: new Date().toISOString() }))
      );
      // Actualizar contadores
      setUnreadCount(0);
      setTotalCount((prev) => Math.max(0, prev - result.count));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // Limpiar notificaciones (solo leídas por defecto, o todas si se especifica)
  const limpiar = useCallback(async (todas: boolean = false) => {
    try {
      const result = await limpiarNotificaciones(todas);
      
      if (todas) {
        // Si se eliminan todas, limpiar todo el estado
        setNotifications([]);
        setUnreadCount(0);
        setTotalCount(0);
      } else {
        // Si solo se eliminan leídas, remover solo esas del estado local
        setNotifications((prev) => prev.filter((notif) => !notif.read_at));
        setTotalCount((prev) => Math.max(0, prev - result.count));
      }
      
      // Recargar notificaciones para obtener la lista actualizada
      await loadNotifications(1, false);
      return result;
    } catch (err) {
      console.error('Error limpiando notificaciones:', err);
      throw err;
    }
  }, [loadNotifications]);

  // Eliminar notificación individual
  const eliminar = useCallback(async (id: number) => {
    try {
      await eliminarNotificacion(id);
      // Remover del estado local
      setNotifications((prev) => {
        const removed = prev.find(n => n.id === id);
        const newList = prev.filter(n => n.id !== id);
        // Si era no leída, actualizar contador
        if (removed && !removed.read_at) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setTotalCount((prev) => Math.max(0, prev - 1));
        return newList;
      });
    } catch (err) {
      console.error('Error eliminando notificación:', err);
      throw err;
    }
  }, []);

  // Cargar notificaciones al montar
  useEffect(() => {
    loadNotifications(1, false);
  }, [loadNotifications]);

  // Auto-refresh del conteo de no leídas
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    limpiar,
    eliminar,
    refresh: () => loadNotifications(currentPage, false),
    refreshUnreadCount: loadUnreadCount,
  };
}

