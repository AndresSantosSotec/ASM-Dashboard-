"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  previewUrl: string | null
}

export function FilePreviewModal({ isOpen, onClose, file, previewUrl }: FilePreviewModalProps) {
  if (!file) return null

  const handleDownload = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = file.name
    link.click()
  }

  const isPDF = file.type === "application/pdf"
  const isImage = file.type.startsWith("image/")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate max-w-md">{file.name}</DialogTitle>
            <div className="flex gap-2">
              {previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Tipo: {file.type} • Tamaño: {(file.size / 1024).toFixed(2)} KB
          </p>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[70vh] rounded-lg border bg-muted/20 p-4">
          {isImage && previewUrl && (
            <img 
              src={previewUrl} 
              alt="Vista previa" 
              className="max-w-full h-auto mx-auto"
            />
          )}
          
          {isPDF && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-[600px] border-0 rounded"
              title="Vista previa PDF"
            />
          )}

          {!isImage && !isPDF && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vista previa no disponible para este tipo de archivo</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar archivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
