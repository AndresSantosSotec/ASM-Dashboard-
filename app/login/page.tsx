"use client"

import React, { useState } from "react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { recoverPassword } from "@/services/password-recovery"

export default function LoginPage() {
  const router = useRouter()
  const { setToken, setAllowedViews, setUser } = useAuth()
  
  // Estados del Login
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Estados para alternar vistas
  const [showRecovery, setShowRecovery] = useState(false)
  
  // Estados de recuperación
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoverySuccess, setRecoverySuccess] = useState(false)
  const [recoveryError, setRecoveryError] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Petición real a tu API
      const response = await api.post("/login", {
        email,
        password,
      })

      // Muestra la respuesta completa en consola para depuración


      // Extrae token, user y allowedViews de la respuesta
      const { id, token, user, allowedViews } = response.data

      // Almacena el token y demás datos en localStorage mediante el contexto
      setToken(token)
      setAllowedViews(allowedViews || [])
      setUser(user)
      localStorage.setItem("userId", id)
      localStorage.setItem("user", JSON.stringify(user))

      // Redirige al dashboard
      router.push("/")
    } catch (error: any) {
      // Maneja errores, por ejemplo credenciales inválidas
      setError(error.response?.data?.error || "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecoveryLoading(true)
    setRecoveryError("")
    setValidationErrors([])
    setRecoverySuccess(false)

    try {
      const response = await recoverPassword(recoveryEmail)

      if (response.success) {
        setRecoverySuccess(true)
        setRecoveryEmail("")
      } else {
        if (response.errors?.email) {
          setValidationErrors(response.errors.email)
        } else {
          setRecoveryError(response.message)
        }
      }
    } catch (err: any) {
      setRecoveryError("Error inesperado. Por favor, intenta de nuevo.")
    } finally {
      setRecoveryLoading(false)
    }
  }

  const toggleRecoveryView = () => {
    setShowRecovery(!showRecovery)
    setRecoverySuccess(false)
    setRecoveryError("")
    setValidationErrors([])
    setRecoveryEmail("")
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E2B49] p-4">
      <Card className="w-full max-w-md shadow-xl">
        {!showRecovery ? (
          // ========== VISTA DE LOGIN ==========
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gaia-light rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gaia-navy font-bold text-2xl">GBS</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gaia-navy">Bienvenido</CardTitle>
              <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo Electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Recordarme
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={toggleRecoveryView}
                    className="text-sm text-blue-600 hover:underline hover:text-blue-800"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gaia-wine hover:bg-gaia-light text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          // ========== VISTA DE RECUPERACIÓN ==========
          <>
            <CardHeader className="space-y-1">
              <div className="flex items-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecoveryView}
                  className="text-gaia-navy hover:text-gaia-wine"
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al login
                </Button>
              </div>
              <div className="w-16 h-16 bg-gaia-light rounded-full mx-auto mb-4 flex items-center justify-center">
                <Mail className="text-gaia-navy h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-gaia-navy text-center">
                Recuperar Contraseña
              </CardTitle>
              <CardDescription className="text-center">
                Ingresa tu correo electrónico y te enviaremos una contraseña temporal
              </CardDescription>
            </CardHeader>

            {recoverySuccess ? (
              // Mensaje de éxito
              <>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-green-900 mb-1">
                          Solicitud enviada exitosamente
                        </h3>
                        <p className="text-sm text-green-700">
                          Si el correo electrónico está registrado en nuestro sistema, recibirás un email 
                          con tu nueva contraseña temporal en los próximos minutos.
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                          Por favor, revisa tu bandeja de entrada y también tu carpeta de spam.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="font-medium">Próximos pasos:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Revisa tu correo electrónico</li>
                      <li>Usa la contraseña temporal para iniciar sesión</li>
                      <li>Cambia tu contraseña inmediatamente después de ingresar</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={toggleRecoveryView}
                    className="w-full bg-gaia-navy hover:bg-gaia-navy/90 text-white"
                    type="button"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Login
                  </Button>
                </CardFooter>
              </>
            ) : (
              // Formulario de recuperación
              <form onSubmit={handleRecovery}>
                <CardContent className="space-y-4">
                  {recoveryError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                          <p className="text-sm text-red-700">{recoveryError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-red-900 mb-1">Errores de validación</h3>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validationErrors.map((err, idx) => (
                              <li key={idx}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="recovery-email" className="text-sm font-medium text-gray-700">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={recoveryLoading}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Ingresa el correo electrónico con el que te registraste en el sistema
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nota de seguridad:</strong> Por razones de seguridad, recibirás el mismo 
                      mensaje independientemente de si el correo está registrado o no.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gaia-wine hover:bg-gaia-light text-white"
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Enviando solicitud...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Contraseña Temporal
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={recoveryLoading}
                    onClick={toggleRecoveryView}
                  >
                    Cancelar
                  </Button>
                </CardFooter>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
