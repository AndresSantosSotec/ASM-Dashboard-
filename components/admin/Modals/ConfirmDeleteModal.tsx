// components/admin/modals/ConfirmDeleteModal.tsx
"use client"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  prospectName: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  prospectName,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar prospecto</DialogTitle>
        </DialogHeader>
        <p className="py-4">
          ¿Estás seguro de que quieres eliminar a <strong>{prospectName}</strong>?
        </p>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
