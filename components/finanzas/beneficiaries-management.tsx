"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Wallet, 
  CreditCard, 
  Building2,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Monitor,
  Loader2
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { BeneficiariesService, Beneficiary, AddBeneficiaryPayload } from "@/services/beneficiaries"
import { useAuth } from "@/contexts/AuthContext"

export function BeneficiariesManagement() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [ownAccounts, setOwnAccounts] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const isMobile = useMobile()
  const { token } = useAuth()

  // Form state
  const [formData, setFormData] = useState<AddBeneficiaryPayload>({
    ccodaho: '',
    alias: '',
    account_type: 'savings',
    bank_name: '',
    account_holder: ''
  })

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Load data on mount
  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [beneficiariesData, ownAccountsData] = await Promise.all([
        BeneficiariesService.getBeneficiaries().catch(() => []),
        BeneficiariesService.getOwnAccounts().catch(() => [])
      ])
      
      setBeneficiaries(beneficiariesData)
      setOwnAccounts(ownAccountsData)
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos. Verifique su conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBeneficiary = async () => {
    try {
      setError(null)
      const newBeneficiary = await BeneficiariesService.addBeneficiary(formData)
      setBeneficiaries(prev => [...prev, newBeneficiary])
      setSuccess('Beneficiario agregado exitosamente')
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err: any) {
      console.error('Error adding beneficiary:', err)
      if (err.code === 'ERR_NETWORK') {
        setError('Error de conexión. Verifique que el servidor esté ejecutándose y sea accesible desde este dispositivo.')
      } else {
        setError('Error al agregar beneficiario. Por favor intente nuevamente.')
      }
    }
  }

  const handleEditBeneficiary = async () => {
    if (!selectedBeneficiary?.id) return
    
    try {
      setError(null)
      const updatedBeneficiary = await BeneficiariesService.updateBeneficiary(
        selectedBeneficiary.id, 
        formData
      )
      setBeneficiaries(prev => 
        prev.map(b => b.id === selectedBeneficiary.id ? updatedBeneficiary : b)
      )
      setSuccess('Beneficiario actualizado exitosamente')
      setIsEditDialogOpen(false)
      setSelectedBeneficiary(null)
      resetForm()
    } catch (err: any) {
      console.error('Error updating beneficiary:', err)
      setError('Error al actualizar beneficiario. Por favor intente nuevamente.')
    }
  }

  const handleDeleteBeneficiary = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este beneficiario?')) return
    
    try {
      setError(null)
      await BeneficiariesService.deleteBeneficiary(id)
      setBeneficiaries(prev => prev.filter(b => b.id !== id))
      setSuccess('Beneficiario eliminado exitosamente')
    } catch (err: any) {
      console.error('Error deleting beneficiary:', err)
      setError('Error al eliminar beneficiario. Por favor intente nuevamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      ccodaho: '',
      alias: '',
      account_type: 'savings',
      bank_name: '',
      account_holder: ''
    })
  }

  const openEditDialog = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary)
    setFormData({
      ccodaho: beneficiary.ccodaho,
      alias: beneficiary.alias,
      account_type: beneficiary.account_type,
      bank_name: beneficiary.bank_name || '',
      account_holder: beneficiary.account_holder || ''
    })
    setIsEditDialogOpen(true)
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <Wallet className="h-4 w-4" />
      case 'current':
        return <CreditCard className="h-4 w-4" />
      case 'credit':
        return <Building2 className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'savings':
        return 'Ahorro'
      case 'current':
        return 'Corriente'
      case 'credit':
        return 'Crédito'
      default:
        return type
    }
  }

  const BeneficiaryForm = ({ 
    isEdit = false, 
    onSubmit, 
    onCancel 
  }: { 
    isEdit?: boolean
    onSubmit: () => void
    onCancel: () => void 
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ccodaho">Número de Cuenta</Label>
          <Input
            id="ccodaho"
            value={formData.ccodaho}
            onChange={(e) => setFormData(prev => ({ ...prev, ccodaho: e.target.value }))}
            placeholder="Ingrese el número de cuenta"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alias">Alias</Label>
          <Input
            id="alias"
            value={formData.alias}
            onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
            placeholder="Ingrese un alias para la cuenta"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_type">Tipo de Cuenta</Label>
          <Select
            value={formData.account_type}
            onValueChange={(value: 'savings' | 'current' | 'credit') => 
              setFormData(prev => ({ ...prev, account_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
              <SelectItem value="current">Cuenta Corriente</SelectItem>
              <SelectItem value="credit">Cuenta de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_name">Banco</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
            placeholder="Nombre del banco"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_holder">Titular de la Cuenta</Label>
        <Input
          id="account_holder"
          value={formData.account_holder}
          onChange={(e) => setFormData(prev => ({ ...prev, account_holder: e.target.value }))}
          placeholder="Nombre del titular de la cuenta"
        />
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={!formData.ccodaho || !formData.alias}>
          {isEdit ? 'Actualizar' : 'Agregar'} Beneficiario
        </Button>
      </DialogFooter>
    </div>
  )

  const BeneficiaryCard = ({ beneficiary, isOwnAccount = false }: { beneficiary: Beneficiary; isOwnAccount?: boolean }) => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              {getAccountTypeIcon(beneficiary.account_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{beneficiary.alias}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {beneficiary.ccodaho}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getAccountTypeLabel(beneficiary.account_type)}
                </Badge>
                {isOwnAccount && (
                  <Badge variant="outline" className="text-xs">
                    Propia
                  </Badge>
                )}
              </div>
              {beneficiary.bank_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  {beneficiary.bank_name}
                </p>
              )}
            </div>
          </div>
          {!isOwnAccount && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(beneficiary)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => beneficiary.id && handleDeleteBeneficiary(beneficiary.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const BeneficiaryTable = ({ data, isOwnAccounts = false }: { data: Beneficiary[]; isOwnAccounts?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Alias</TableHead>
          <TableHead>Número de Cuenta</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>Titular</TableHead>
          {!isOwnAccounts && <TableHead className="w-[70px]">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((beneficiary) => (
          <TableRow key={beneficiary.id || beneficiary.ccodaho}>
            <TableCell className="font-medium">{beneficiary.alias}</TableCell>
            <TableCell>{beneficiary.ccodaho}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getAccountTypeIcon(beneficiary.account_type)}
                {getAccountTypeLabel(beneficiary.account_type)}
              </div>
            </TableCell>
            <TableCell>{beneficiary.bank_name || '-'}</TableCell>
            <TableCell>{beneficiary.account_holder || '-'}</TableCell>
            {!isOwnAccounts && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(beneficiary)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => beneficiary.id && handleDeleteBeneficiary(beneficiary.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow>
            <TableCell colSpan={isOwnAccounts ? 5 : 6} className="text-center text-muted-foreground py-8">
              {isOwnAccounts ? 'No hay cuentas propias registradas' : 'No hay beneficiarios registrados'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  if (!token) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Autenticación requerida</AlertTitle>
        <AlertDescription>
          Debe iniciar sesión para gestionar beneficiarios.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Beneficiarios</h1>
          <p className="text-muted-foreground">
            Administre sus cuentas propias y beneficiarios para transferencias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isMobile ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
            {isMobile ? 'Móvil' : 'Escritorio'}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Add Beneficiary Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Beneficiario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Beneficiario</DialogTitle>
              <DialogDescription>
                Complete la información del beneficiario para transferencias.
              </DialogDescription>
            </DialogHeader>
            <BeneficiaryForm 
              onSubmit={handleAddBeneficiary}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <Tabs defaultValue="beneficiaries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="beneficiaries">
              Beneficiarios ({beneficiaries.length})
            </TabsTrigger>
            <TabsTrigger value="own-accounts">
              Cuentas Propias ({ownAccounts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beneficiaries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Beneficiarios Registrados</CardTitle>
                <CardDescription>
                  Cuentas de terceros registradas para transferencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-3">
                    {beneficiaries.map((beneficiary) => (
                      <BeneficiaryCard 
                        key={beneficiary.id || beneficiary.ccodaho} 
                        beneficiary={beneficiary} 
                      />
                    ))}
                    {beneficiaries.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay beneficiarios registrados
                      </div>
                    )}
                  </div>
                ) : (
                  <BeneficiaryTable data={beneficiaries} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="own-accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cuentas Propias</CardTitle>
                <CardDescription>
                  Sus cuentas disponibles para transferencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-3">
                    {ownAccounts.map((account) => (
                      <BeneficiaryCard 
                        key={account.id || account.ccodaho} 
                        beneficiary={account} 
                        isOwnAccount={true}
                      />
                    ))}
                    {ownAccounts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay cuentas propias registradas
                      </div>
                    )}
                  </div>
                ) : (
                  <BeneficiaryTable data={ownAccounts} isOwnAccounts={true} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Beneficiario</DialogTitle>
            <DialogDescription>
              Modifique la información del beneficiario.
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryForm 
            isEdit={true}
            onSubmit={handleEditBeneficiary}
            onCancel={() => {
              setIsEditDialogOpen(false)
              setSelectedBeneficiary(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}