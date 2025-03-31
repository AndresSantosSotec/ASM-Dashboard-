export default function Login() {
    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      // Aquí iría la lógica de autenticación, por ejemplo, consultar una API y al recibir el token:
      // - Guardar el token en cookies
      // - Redirigir al usuario a la página principal
    }
  
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <form onSubmit={handleLogin}>
          <h1>Iniciar sesión</h1>
          <div>
            <input type="text" name="username" placeholder="Usuario" required />
          </div>
          <div>
            <input type="password" name="password" placeholder="Contraseña" required />
          </div>
          <button type="submit">Entrar</button>
        </form>
      </div>
    )
  }