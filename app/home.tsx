// app/page.tsx
import TabNavigation from "@/components/tab-navigation"
import CaptacionesPanel from "@/components/captaciones-panel"
import AnalisisPanel from "@/components/analisis-panel"
import GestorPanel from "@/components/gestor-panel"
import LeadsResumen from "@/components/leads-resumen"
import ProspectosPorEstado from "@/components/prospectos-por-estado"
import LlamadasHoy from "@/components/llamadas-hoy"
import LeadsConvertidos from "@/components/leads-convertidos"
import IngresosPorMes from "@/components/ingresos-por-mes"
import CorreosEnviados from "@/components/correos-enviados"
import MisProspectos from "@/components/mis-prospectos"
import CalendarioSemanal from "@/components/calendario-semanal"

export default function Home() {
  return (
    <>
      <TabNavigation />
      <div className="p-4">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <CaptacionesPanel />
          <AnalisisPanel />
          <GestorPanel />
        </div>

        {/* Middle row */}
        <div className="mb-4">
          <LeadsResumen />
        </div>

        {/* Bottom row */}
        <div className="mb-4">
          <ProspectosPorEstado />
        </div>

        {/* Additional rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <LlamadasHoy />
          <LeadsConvertidos />
          <IngresosPorMes />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CorreosEnviados />
          <MisProspectos />
        </div>

        <div className="mb-4">
          <CalendarioSemanal />
        </div>
      </div>
    </>
  )
}
