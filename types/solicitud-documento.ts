export type EstadoSolicitud = "pendiente" | "en_proceso" | "listo" | "rechazado";
export type TipoDocumento =
  | "certificacion_cursos"
  | "cierre_pensum"
  | "constancia_estudios";

export interface SolicitudDocumento {
  id: number;
  estudiante_id: number;
  tipo_documento: TipoDocumento;
  monto: number;
  estado: EstadoSolicitud;
  banco: string | null;
  numero_referencia: string | null;
  fecha_recibo: string | null;
  ruta_archivo_boleta: string | null;
  ruta_documento_listo: string | null;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_procesamiento: string | null;
  created_at: string;
  updated_at: string;
  prospecto?: {
    id: number;
    nombre_completo: string;
    carnet: string;
    correo_electronico: string;
  };
}

export interface SolicitudesResponse {
  success: boolean;
  data: SolicitudDocumento[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
