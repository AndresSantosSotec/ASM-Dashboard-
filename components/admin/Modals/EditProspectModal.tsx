"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect, useState, useMemo } from "react"

export interface EditProspectModalProps {
    isOpen: boolean
    onClose: () => void
    /** Prospecto individual, si no se usa update masivo */
    prospect?: {
        id: string
        asesor_id: number | null
    }
    /** Lista de IDs para actualización masiva, opcional */
    bulkIds?: string[]
    /** Lista de todos los asesores (rol=7) */
    asesores: { id: number; nombre: string }[]
    /** Callback opcional para recargar en el padre tras guardar */
    onSaved?: () => void
}

export default function EditProspectModal({
    isOpen,
    onClose,
    prospect,
    bulkIds,
    asesores,
    onSaved,
}: EditProspectModalProps) {
    const [selectedAsesor, setSelectedAsesor] = useState<string>("")
    const [search, setSearch] = useState<string>("")

    const visibleAsesores = useMemo(() => {
        const term = search.toLowerCase()
        return asesores.filter(a =>
            a.nombre.toLowerCase().includes(term)
        )
    }, [asesores, search])

    useEffect(() => {
        if (prospect) {
            setSelectedAsesor(
                prospect.asesor_id != null ? String(prospect.asesor_id) : ""
            )
        } else {
            // Si se usa modo bulk, limpiar el valor inicial
            setSelectedAsesor("")
        }
        setSearch("")
    }, [prospect, bulkIds])

    if (!isOpen) return null

    const handleGuardar = async () => {
        if (!selectedAsesor) return

        try {
            if (bulkIds && bulkIds.length > 0) {
                // Actualización masiva usando el endpoint bulk-assign
                const res = await fetch(
                    `${API_BASE_URL}/api/prospectos/bulk-assign`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            prospecto_ids: bulkIds.map(id => Number(id)),
                            created_by: Number(selectedAsesor),
                        }),
                    }
                )
                if (!res.ok) {
                    // Extrae el error del servidor
                    const errorBody = await res.text();
                    console.error("Error en bulkAssign:", errorBody);
                    throw new Error(`Status ${res.status}`);
                }
            } else if (prospect) {
                // Actualización individual
                const res = await fetch(
                    `${API_BASE_URL}/api/prospectos/${prospect.id}/assign`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ created_by: Number(selectedAsesor) }),
                    }
                )
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Error asignando prospecto:", errorText);
                    throw new Error(`Status ${res.status}`);
                }
            }
            onSaved?.()
            onClose()
        } catch (err) {
            console.error("Error reasignando prospectos:", err)
            alert("No se pudo reasignar. Revisa la consola para más detalles.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {bulkIds ? "Reasignar asesores (masivo)" : "Reasignar asesor"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Muestra el asesor actual solo en modo individual */}
                    {prospect && (
                        <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                            <span className="text-sm text-gray-600 mr-2">Actual:</span>
                            <span className="font-medium">
                                {
                                    asesores.find(a => a.id === prospect.asesor_id)?.nombre
                                    || "Sin asignar"
                                }
                            </span>
                        </div>
                    )}

                    {/* Buscador */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Buscar asesor
                        </label>
                        <Input
                            placeholder="Filtrar lista..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {bulkIds ? "Nuevo asesor para los prospectos" : "Nuevo asesor"}
                        </label>
                        <Select
                            value={selectedAsesor}
                            onValueChange={(val: string) => setSelectedAsesor(val)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona un asesor" />
                            </SelectTrigger>
                            <SelectContent>
                                {visibleAsesores.map(a => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleGuardar} disabled={!selectedAsesor}>
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}