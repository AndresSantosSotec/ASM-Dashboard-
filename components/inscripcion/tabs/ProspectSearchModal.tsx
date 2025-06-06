"use client"

import { useState, useMemo, useEffect } from "react"
import { Search } from "lucide-react"
import DataTable, { TableColumn } from 'react-data-table-component'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/utils/apiConfig"

import { Prospecto } from "../types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (prospecto: Prospecto) => void
}

const departamentos = [
  "Guatemala",
  "Quetzaltenango",
  "Escuintla",
  "Sacatepéquez",
]

export default function ProspectSearchModal({
  open,
  onOpenChange,
  onSelect,
}: Props) {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const [search, setSearch] = useState<string>("")
  const [filterDepto, setFilterDepto] = useState<string>("todos")

  useEffect(() => {
    if (!open) return

    const fetchProspectos = async () => {
      setLoading(true)
      setError("")

      try {
        const token = localStorage.getItem("token")
        const url = `${API_BASE_URL}/api/prospectos?status=${encodeURIComponent(
          "Preinscripción"
        )}`
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error(`Error status ${res.status}`)

        const { data } = await res.json()

        // Mapear snake_case → camelCase
        const lista: Prospecto[] = data.map((p: any) => ({
          id: p.id,
          nombreCompleto: p.nombre_completo,
          emailPersonal: p.correo_electronico,
          telefono: p.telefono,
          departamento: p.departamento,
          estado: p.status,
            // Aquí agregamos:
          empresa:             p.empresa_donde_labora_actualmente ?? "",
          puesto:              p.puesto                        ?? "",
          telefonoCorporativo: p.telefono_corporativo          ?? "",

          // …otros campos que necesites mapear
        }))

        setProspectos(lista)
      } catch (err: any) {
        setError(err.message || "Error al cargar prospectos")
      } finally {
        setLoading(false)
      }
    }

    fetchProspectos()
  }, [open])

  // Filtros cliente
  const filtered = useMemo(() => {
    const lower = search.toLowerCase()
    return prospectos
      .filter(p => filterDepto === 'todos' || p.departamento === filterDepto)
      .filter(p => {
        const name = p.nombreCompleto.toLowerCase()
        const email = p.emailPersonal.toLowerCase()
        const phone = p.telefono
        return (
          name.includes(lower) ||
          email.includes(lower) ||
          phone.includes(search)
        )
      })
  }, [prospectos, search, filterDepto])

  // Columnas para DataTable
  const columns: TableColumn<Prospecto>[] = [
    { name: 'Nombre', selector: row => row.nombreCompleto, sortable: true },
    { name: 'Email', selector: row => row.emailPersonal, sortable: true },
    { name: 'Teléfono', selector: row => row.telefono },
    { name: 'Departamento', selector: row => row.departamento },
    { name: 'Estado', cell: row => <Badge variant="outline">{row.estado}</Badge> },
    {
      name: 'Acción',
      cell: row => (
        <Button size="sm" onClick={() => onSelect(row)}>
          Seleccionar
        </Button>
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Búsqueda de Prospectos</DialogTitle>
          <DialogDescription>
            Seleccione un prospecto en preinscripción
          </DialogDescription>
        </DialogHeader>

        {/* filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar nombre, email o teléfono"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDepto} onValueChange={setFilterDepto}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los departamentos</SelectItem>
              {departamentos.map(d => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="p-4">Cargando prospectos...</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            pagination
            highlightOnHover
            responsive
            noDataComponent="No se encontraron prospectos."
            className="overflow-hidden"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
