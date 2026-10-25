# Fuelytics

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)
![Versión](https://img.shields.io/github/v/release/davidcambra18/fuelytics?style=for-the-badge&color=blue)
[![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)](LICENSE)

Aplicación web para llevar el control de tus vehículos, saber cuánto gastas y encontrar dónde repostar al mejor precio.

[Estado del servicio](https://status.davidcambra.com/status/fuelytics) · [Contribuir](CONTRIBUTING.md) · [Issues](https://github.com/DavidCambra18/fuelytics/issues)

## Qué puedes hacer

- Registrar vehículos, repostajes y gastos.
- Consultar consumos, estadísticas y exportar informes PDF.
- Planificar recordatorios y vincularlos con un mantenimiento realizado.
- Gestionar neumáticos y calcular el coste de un viaje.
- Buscar gasolineras en el mapa y comparar precios por combustible.
- Añadir amigos, consultar la clasificación y elegir qué información compartir.

**Tecnologías:** React, Vite y Tailwind CSS en el frontend; Java 17 y Spring Boot en el backend; PostgreSQL como base de datos.

## Requisitos

- Node.js 22.13+.
- Java 17 o posterior. Maven está incluido mediante Maven Wrapper.
- Docker con Docker Compose para levantar PostgreSQL en local.

## Puesta en marcha local

Desde la raíz del proyecto, utiliza terminales separadas para cada servicio.

### 1. Base de datos

```bash
docker compose -f database/docker-compose.yml up -d
```

El esquema se carga solo la primera vez que se crea el volumen. Para una base existente, aplica solo los cambios necesarios de [database/schema.sql](database/schema.sql): el backend valida la estructura, pero no la actualiza automáticamente.

### 2. Backend

Define las variables de [backend/.env.example](backend/.env.example) en tu terminal o IDE. **Spring no carga los archivos `.env` automáticamente.**

Ejemplo para desarrollo local en PowerShell:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/fuelytics"
$env:DB_USER = "postgres"
$env:DB_PASS = "postgres"
$env:FRONTEND_URL = "http://localhost:5173"
$env:JWT_SECRET = "cambia-esta-clave-local-por-una-segura-de-32-bytes-o-mas"
cd backend
.\mvnw.cmd spring-boot:run
```

En Linux o macOS, utiliza `./mvnw` en lugar de `.\mvnw.cmd` y define las variables con tu shell.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Abre **http://localhost:5173**. La API estará en **http://localhost:8080**; su dirección se configura con `VITE_BACKEND_URL` en `frontend/.env.local`.

## Configuración opcional

**Google:** crea un cliente OAuth de tipo Aplicación web y autoriza el origen exacto del frontend (`http://localhost:5173` en local). Define su identificador en `GOOGLE_CLIENT_ID` y el mismo origen en `FRONTEND_URL`, ambos en el backend, y reinícialo. No se necesita un secreto de cliente. Puedes conectar o desconectar Google desde Ajustes cuando tengas otro método de acceso disponible.

**Correo:** los avisos de bienvenida y solicitudes de amistad utilizan SMTP autenticado con STARTTLS. Configura las variables `MAIL_*` de [backend/.env.example](backend/.env.example) y activa `MAIL_ENABLED=true`. `MAIL_USERNAME` autentica el envío; `MAIL_FROM` es el remitente autorizado. El alojamiento debe permitir conexiones SMTP salientes; el correo puede permanecer desactivado sin impedir el uso de la aplicación.

No incluyas credenciales reales en Git ni en variables `VITE_*`, que son públicas.

## Validación

Backend, desde `backend/`:

```powershell
.\mvnw.cmd verify
```

Frontend, desde `frontend/`:

```bash
npm run lint
npm test
npm run build
```

Estas comprobaciones también se ejecutan en GitHub Actions.

## Estructura y colaboración

| Carpeta | Contenido |
| --- | --- |
| `frontend/` | Interfaz web |
| `backend/` | API REST y pruebas |
| `database/` | Esquema SQL y PostgreSQL local con Docker |

Para colaborar, consulta [CONTRIBUTING.md](CONTRIBUTING.md). Las propuestas y los errores se gestionan mediante issues.

Desarrollado por [David Cambra](https://github.com/DavidCambra18). Licencia [MIT](LICENSE).