"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  resume: File | null
}

interface Approval {
  type: "commercial" | "financial" | "academic"
  status: "pending" | "approved" | "rejected"
  label: string
}

export function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resume: null,
  })

  const [approvals, setApprovals] = useState<Approval[]>([
    { type: "commercial", status: "pending", label: "Comercial" },
    { type: "financial", status: "pending", label: "Financiera" },
    { type: "academic", status: "pending", label: "Académica" },
  ])

  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resume: file,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // Here you would typically send the data to your backend
  }

  // Simulate approval actions (in a real app, these would be API calls)
  const handleApproval = (type: Approval["type"], approved: boolean) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.type === type ? { ...approval, status: approved ? "approved" : "rejected" } : approval,
      ),
    )
  }

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card className="border-2">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Curriculum Vitae</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("resume")?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {formData.resume ? formData.resume.name : "Seleccionar archivo"}
                </Button>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Enviar solicitud
            </Button>
          </form>

          {submitted && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold">Aprobaciones necesarias:</h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.type}>
                      <TableCell>{approval.label}</TableCell>
                      <TableCell>
                        {approval.status === "pending" && "Pendiente"}
                        {approval.status === "approved" && "Aprobado"}
                        {approval.status === "rejected" && "Rechazado"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleApproval(approval.type, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleApproval(approval.type, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {approvals.every((a) => a.status === "approved") && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>Todas las aprobaciones han sido completadas.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

