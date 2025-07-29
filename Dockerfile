# Usar imagen oficial de Node.js
FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear carpeta de uploads y cambiar permisos
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

# Cambiar al usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando para ejecutar la aplicación
CMD ["npm", "start"] 