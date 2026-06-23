"use client"

import type { PlatformLicenseStatus } from "@/services/platformLicense"

type Props = {
  status: PlatformLicenseStatus
}

export default function PlatformLicenseScreen({ status }: Props) {
  const reason =
    status.reason ||
    status.message ||
    "El servicio ha sido suspendido. Contacte al proveedor para regularizar el pago de licencia."

  const phones = status.contact_phones?.filter(Boolean) ?? []

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0c1220] p-6">
      <div className="w-full max-w-xl rounded-xl border border-red-500/30 bg-white p-8 shadow-2xl dark:bg-[#111827]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <span className="text-3xl">⛔</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e264d] dark:text-white">
            Servicio suspendido
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acceso bloqueado por licencia de plataforma
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <p>{reason}</p>

          {status.tamper_detected && (
            <p className="font-semibold text-red-600">
              Se detectó una alteración no autorizada de la licencia. Se requiere
              restablecimiento por el proveedor del sistema.
            </p>
          )}

          {status.locked_at && (
            <p className="text-xs text-slate-500">
              Fecha de suspensión: {new Date(status.locked_at).toLocaleString("es-GT")}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3 text-center text-sm text-slate-600 dark:text-slate-300">
          <p>Para reactivar el sistema, regularice el pago con el proveedor de la plataforma.</p>
          {phones.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium text-[#1e264d] dark:text-white">WhatsApp</p>
              {phones.map((phone) => (
                <p key={phone} className="font-semibold">
                  {phone}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
