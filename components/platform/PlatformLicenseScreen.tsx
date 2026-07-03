"use client"

import type { PlatformLicenseStatus } from "@/services/platformLicense"

type Props = {
  status: PlatformLicenseStatus
}

export default function PlatformLicenseScreen({ status }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0c1220] p-6">
      <div className="w-full max-w-xl rounded-xl border border-red-500/30 bg-white p-8 shadow-2xl dark:bg-[#111827]">
        <div className="mb-6 text-center">
          <p className="mb-3 inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Sistema funcionando en modo prueba
          </p>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <span className="text-3xl">⛔</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e264d] dark:text-white">
            Sistema suspendido
          </h1>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <p>
            Su sistema se encuentra deshabilitado. Estará en modo de prueba 5 días.
          </p>
          <p>Contacte con el proveedor para renovar su licencia.</p>

          {status.tamper_detected && (
            <p className="font-semibold text-red-600">
              Se detectó una alteración no autorizada de la licencia. Se requiere
              restablecimiento por el proveedor del sistema.
            </p>
          )}

          {status.reason && !status.reason.includes("Modo prueba") && (
            <p className="text-xs text-slate-500">{status.reason}</p>
          )}
        </div>
      </div>
    </div>
  )
}
