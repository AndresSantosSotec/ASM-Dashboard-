import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

export default function RevisionFichasPage() {
  return (
    <div>
      <h1>Revisión de Fichas</h1>
      {/* Aquí iría el componente Header */}
      {/* Ejemplo de tabla con botón de acciones */}
      <table>
        <thead>
          <tr>
            <th>Ficha</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>12345</td>
            <td>Juan Pérez</td>
            <td>
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2">
                    Solicitar Aprobaciones
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Solicitar Aprobaciones</DialogTitle>
                    <DialogDescription>
                      Seleccione las aprobaciones necesarias para esta ficha de inscripción.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="comercial" />
                        <label
                          htmlFor="comercial"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Comercial
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="financiera" />
                        <label
                          htmlFor="financiera"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Financiera
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="academica" />
                        <label
                          htmlFor="academica"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Académica
                        </label>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <p>
                        Las aprobaciones seleccionadas serán solicitadas a los departamentos correspondientes. El
                        proceso de inscripción no podrá continuar hasta que todas las aprobaciones requeridas sean
                        completadas.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Enviar Solicitudes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </td>
          </tr>
          {/* Más filas de la tabla */}
        </tbody>
      </table>
    </div>
  )
}

