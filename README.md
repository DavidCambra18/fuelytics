# Fuelytics

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-orange)
![Java](https://img.shields.io/badge/Java-17-FFA500?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green)](LICENSE)

Fuelytics es una aplicación para registrar vehículos, repostajes, gastos, neumáticos y alertas de mantenimiento. Calcula consumos a partir de ciclos de llenado completos, genera informes PDF y permite publicar de forma selectiva perfiles y vehículos.

## Estructura

- `frontend/`: aplicación React y Vite.
- `backend/`: API REST con Java 17, Spring Boot y Maven.
- `database/schema.sql`: esquema completo para crear una base PostgreSQL local vacía.
- `database/docker-compose.yml`: PostgreSQL local de desarrollo.
- `database/neon/`: cambios SQL manuales para una base Neon ya existente.

El esquema local y los scripts de Neon tienen propósitos distintos. El backend usa `ddl-auto=validate`: comprueba la estructura, pero no crea ni modifica tablas al arrancar.

## Requisitos

- Node.js 22 o posterior.
- Docker con Docker Compose para la base local.
- Java 17 o posterior. El repositorio incluye Maven Wrapper, por lo que no hace falta instalar Maven.

## Puesta en marcha local

1. Arranca PostgreSQL:

   ```bash
   cd database
   docker compose up -d
   ```

   `schema.sql` solo se ejecuta cuando Docker crea el volumen por primera vez. Para reconstruir una base local desde cero hay que eliminar expresamente el volumen local antes de volver a arrancar el servicio.

2. Configura el backend con las variables documentadas en [backend/.env.example](backend/.env.example). Spring no carga ese archivo automáticamente; debes definirlas en tu terminal, IDE o plataforma de despliegue.

   Ejemplo en PowerShell:

   ```powershell
   $env:DB_URL = "jdbc:postgresql://localhost:5432/fuelytics"
   $env:DB_USER = "postgres"
   $env:DB_PASS = "postgres"
   $env:FRONTEND_URL = "http://localhost:5173"
   $env:JWT_SECRET = "una-clave-local-de-al-menos-32-caracteres"
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

3. Crea `frontend/.env.local` a partir de [frontend/.env.example](frontend/.env.example) e inicia el frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

La aplicación estará en `http://localhost:5173` y la API en `http://localhost:8080`.

## Neon y cambios de base de datos

La aplicación desplegada puede apuntar a Neon mediante `DB_URL`, `DB_USER` y `DB_PASS`. Los archivos de `database/neon/` son scripts versionados para aplicar manualmente y en orden. No se ejecutan desde el backend, Docker ni CI.

Antes de aplicar un script en Neon:

1. revisa las consultas previas incluidas en el propio archivo;
2. crea una copia o rama de la base;
3. ejecuta el script en una ventana de mantenimiento;
4. valida el esquema y arranca el backend con `ddl-auto=validate`.

## Variables

| Variable | Servicio | Uso |
| --- | --- | --- |
| `DB_URL` | Backend | URL JDBC de PostgreSQL |
| `DB_USER` | Backend | Usuario de la base |
| `DB_PASS` | Backend | Contraseña de la base |
| `FRONTEND_URL` | Backend | Origen permitido por CORS |
| `JWT_SECRET` | Backend | Clave de firma JWT de 32 bytes como mínimo |
| `JWT_EXPIRATION_MS` | Backend | Duración de sesión; por defecto, una hora |
| `AUTH_LOGIN_MAX_ATTEMPTS` | Backend | Intentos de acceso permitidos por IP y ventana |
| `AUTH_REGISTER_MAX_ATTEMPTS` | Backend | Registros permitidos por IP y ventana |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Backend | Ventana temporal del límite de autenticación |
| `FORWARD_HEADERS_STRATEGY` | Backend | Tratamiento de la IP original detrás del proxy |
| `JPA_SHOW_SQL` | Backend | Muestra SQL cuando vale `true`; por defecto, `false` |
| `VITE_BACKEND_URL` | Frontend | URL pública de la API |

No guardes valores reales, credenciales ni secretos en el repositorio.

## Eliminación de cuenta

En **Ajustes → Cuenta**, el usuario puede eliminar permanentemente su cuenta tras introducir
su contraseña actual y confirmar que comprende la pérdida de datos. La operación
`DELETE /api/users/account` requiere autenticación y un cuerpo JSON con `password`.
El backend identifica la cuenta desde la sesión, limita los intentos y realiza el borrado
en una transacción. Las relaciones `ON DELETE CASCADE` del esquema eliminan los vehículos,
repostajes, gastos, neumáticos, insignias obtenidas y amistades asociados.

Los JWT incluyen el identificador de la cuenta para impedir que una sesión de una cuenta
eliminada acceda a otra registrada después con el mismo correo. Las sesiones anteriores
a este cambio deben iniciar sesión de nuevo. No se requieren cambios del esquema si las
relaciones de borrado coinciden con `database/schema.sql`.

## Validación

```bash
cd backend
./mvnw verify
```

```bash
cd frontend
npm ci
npm run lint
npm test
npm run build
```

GitHub Actions ejecuta estas comprobaciones en cada `push` y cada pull request.

## Contenedor del backend

```bash
docker build -t fuelytics-backend backend
```

La imagen ejecuta las pruebas durante la construcción y arranca la aplicación con un usuario sin privilegios.

Desarrollado por [David Cambra](https://github.com/DavidCambra18).
