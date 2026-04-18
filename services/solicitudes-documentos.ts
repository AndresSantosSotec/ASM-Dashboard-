import { api } from "./api";
import type {
  SolicitudDocumento,
  SolicitudesResponse,
  EstadoSolicitud,
} from "@/types/solicitud-documento";
import { API_BASE_URL } from "@/utils/apiConfig";

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud | "";
  tipo_documento?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getSolicitudesDocumentos(
  filtros: FiltrosSolicitudes = {}
): Promise<SolicitudesResponse> {
  const params: Record<string, string | number> = {};
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.tipo_documento) params.tipo_documento = filtros.tipo_documento;
  if (filtros.search) params.search = filtros.search;
  if (filtros.page) params.page = filtros.page;
  if (filtros.per_page) params.per_page = filtros.per_page;

  const response = await api.get<SolicitudesResponse>(
    "/admin/solicitudes-documentos",
    { params }
  );
  return response.data;
}

export async function updateEstadoSolicitud(
  id: number,
  estado: EstadoSolicitud,
  observaciones?: string
): Promise<SolicitudDocumento> {
  const response = await api.put<{ success: boolean; data: SolicitudDocumento }>(
    `/admin/solicitudes-documentos/${id}/estado`,
    { estado, observaciones }
  );
  return response.data.data;
}

export async function subirDocumentoListo(
  id: number,
  file: File,
  observaciones?: string
): Promise<SolicitudDocumento> {
  const form = new FormData();
  form.append("documento_file", file);
  if (observaciones) form.append("observaciones", observaciones);

  const response = await api.post<{ success: boolean; data: SolicitudDocumento }>(
    `/admin/solicitudes-documentos/${id}/subir-documento`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/** Descarga un archivo protegido con Sanctum usando fetch + Bearer header */
export async function downloadConAuth(
  url: string,
  nombreArchivo: string
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Error al descargar (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export function getAdminBoletaUrl(id: number): string {
  return `${API_BASE_URL}/api/admin/solicitudes-documentos/${id}/boleta`;
}

export function getAdminDocumentoListoUrl(id: number): string {
  return `${API_BASE_URL}/api/admin/solicitudes-documentos/${id}/documento-listo`;
}

export function getEstudianteDocumentoListoUrl(id: number): string {
  return `${API_BASE_URL}/api/estudiante/documentos/${id}/documento-listo`;
}
