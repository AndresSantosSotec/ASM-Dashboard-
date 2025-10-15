# Usa una imagen base oficial de Node.js
FROM node:18-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente al contenedor
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Usa una imagen base ligera para servir la aplicación
FROM nginx:alpine AS production

# Copia los archivos construidos desde la etapa anterior
COPY --from=builder /app/out /usr/share/nginx/html

# Copia un archivo de configuración de Nginx personalizado si es necesario
# COPY nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 80 para el servidor
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

