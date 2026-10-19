# Fuelytics

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-orange?style=for-the-badge)
![Version](https://img.shields.io/github/v/release/davidcambra18/fuelytics?style=for-the-badge&color=blue)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.16-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.0-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.6-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-FFA500?logo=openjdk)](https://java.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://www.postgresql.org/)
![Last Commit](https://img.shields.io/github/last-commit/davidcambra18/fuelytics/main)

Fuelytics es una aplicación para registrar vehículos, repostajes, gastos, neumáticos y alertas de mantenimiento. Calcula consumos a partir de ciclos de llenado completos, genera informes PDF y permite publicar de forma selectiva perfiles y vehículos.

## Estructura

- `frontend/`: aplicación React y Vite.
- `backend/`: API REST con Java 17, Spring Boot y Maven.
- `database/schema.sql`: esquema completo para crear una base PostgreSQL local vacía.
- `database/docker-compose.yml`: PostgreSQL local de desarrollo.

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

La aplicación desplegada puede apuntar a Neon mediante `DB_URL`, `DB_USER` y `DB_PASS`. Los cambios de estructura en una base existente deben aplicarse manualmente. El backend no actualiza automáticamente el esquema.

Antes de aplicar un script en Neon:

1. revisa el script y comprueba que el cambio no esté aplicado ya;
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
| `GOOGLE_CLIENT_ID` | Backend | Identificador del cliente web de Google Identity Services; vacío desactiva el acceso con Google |
| `AUTH_LOGIN_MAX_ATTEMPTS` | Backend | Intentos de acceso permitidos por IP y ventana |
| `AUTH_REGISTER_MAX_ATTEMPTS` | Backend | Registros permitidos por IP y ventana |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Backend | Ventana temporal del límite de autenticación |
| `FORWARD_HEADERS_STRATEGY` | Backend | Tratamiento de la IP original detrás del proxy |
| `JPA_SHOW_SQL` | Backend | Muestra SQL cuando vale `true`; por defecto, `false` |
| `VITE_BACKEND_URL` | Frontend | URL pública de la API |

No guardes valores reales, credenciales ni secretos en el repositorio.

## Registro e inicio de sesión con Google

Fuelytics utiliza **Google Identity Services** para comprobar la identidad del usuario y
después abrir una sesión propia con el mismo JWT que el acceso con contraseña. No solicita
acceso a Gmail, Drive, Calendar ni a otros datos de Google; solo identidad básica y correo
verificado. No necesita un secreto de cliente ni configurar SMTP para iniciar sesión.

### Preparar la base de datos

Antes de arrancar esta versión con una base **ya existente**, comprueba que su estructura
incluye los cambios descritos a continuación, tanto si utilizas una base local como una
alojada en Neon. Si falta alguno, aplícalo manualmente tras hacer una copia de seguridad.
El backend no modifica automáticamente el esquema.

El cambio crea `google_accounts`, permite contraseñas nulas para cuentas creadas con Google
y amplía el correo a 254 caracteres. Las cuentas y contraseñas existentes se conservan.
La vinculación se elimina automáticamente al borrar la cuenta gracias a `ON DELETE CASCADE`.
Para una base local **nueva**, `database/schema.sql` ya incluye estos cambios. Actualizar
el archivo no modifica volúmenes Docker
que ya existan. El esquema debe estar actualizado aunque Google siga desactivado, porque
Hibernate valida todas las entidades al arrancar.

### Configurar Google Cloud

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona el proyecto
   y configura Google Auth Platform: nombre de aplicación, correo de soporte y audiencia.
   Añade los usuarios de prueba si corresponde al modo de publicación elegido.
2. Crea un cliente OAuth de tipo **Aplicación web**. En **Orígenes autorizados de JavaScript**,
   añade el origen exacto del frontend que usará el botón, incluyendo protocolo y puerto:
   `http://localhost:5173` para desarrollo y el dominio HTTPS del frontend para el despliegue.
   No pongas rutas como `/login` ni utilices comodines para los despliegues de vista previa.
3. Este flujo utiliza ventana emergente y callback JavaScript: no necesita una URI de
   redirección del backend. Copia el **ID de cliente**, terminado en `.apps.googleusercontent.com`.
4. Define en el entorno del **backend** y reinícialo:

   ```dotenv
   GOOGLE_CLIENT_ID=tu-identificador.apps.googleusercontent.com
   FRONTEND_URL=http://localhost:5173
   ```

   En producción, `FRONTEND_URL` debe ser el origen HTTPS real del frontend, sin barra final.
   Además de CORS, el backend comprueba este origen en las operaciones de Google. El mismo
   cliente debe autorizar ese origen en Google Cloud. No es necesaria una variable `VITE_*`:
   el frontend obtiene el identificador público desde `/api/auth/google/config`.

Si `GOOGLE_CLIENT_ID` está vacío, el botón no se muestra y el acceso con contraseña sigue
funcionando. Si el navegador bloquea el script o la ventana emergente de Google, permite
el servicio para ese sitio o utiliza el acceso con contraseña cuando la cuenta disponga de él.
La [guía oficial de Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
detalla la configuración, los orígenes autorizados y los requisitos de CSP/COOP si añades
esas políticas al alojamiento.

### Comportamiento de las cuentas

- En **Acceso** y **Registro**, el botón oficial de Google permite entrar con una cuenta ya
  vinculada. Si es una identidad nueva, se solicita un nombre de usuario disponible antes
  de crear la cuenta; no se genera una contraseña ficticia. El correo de bienvenida, si está
  activado, solo se solicita tras guardar correctamente la nueva cuenta.
- Si el correo ya pertenece a otra cuenta de Fuelytics, no se vincula automáticamente.
  Primero hay que iniciar sesión en la cuenta existente y conectar Google en **Ajustes →
  Cuenta → Métodos de acceso**, confirmando la contraseña local actual.
- La identidad se relaciona mediante el identificador estable `sub` de Google, no mediante
  el correo o el nombre. Vincular una cuenta de Google con otro correo no modifica el correo
  principal de Fuelytics ni combina los datos de dos cuentas.
- Una cuenta con contraseña local puede desvincular Google confirmando esa contraseña.
  Una cuenta creada únicamente con Google no puede desvincular su único método de acceso.
- Para eliminar una cuenta sin contraseña, se escribe **ELIMINAR**, se confirma la pérdida
  de datos y se vuelve a verificar la identidad de Google vinculada. Las cuentas con
  contraseña mantienen la confirmación por contraseña existente.

El backend verifica firma RS256, emisor, audiencia, caducidad, antigüedad, correo verificado
y un `nonce` aleatorio de un solo uso. No se envían credenciales ni JWT de sesión en URLs.
Las confirmaciones caducan a los 5 minutos y los registros pendientes a los 10 minutos;
se guardan en memoria con capacidad limitada. Si se reinicia el backend durante el proceso,
el usuario debe comenzar de nuevo. En un despliegue con múltiples instancias habría que
compartir ese almacenamiento entre ellas. Las pruebas automatizadas usan claves RSA y
respuestas simuladas, sin cuentas reales de Google ni cambios en la base desplegada.

## Correos de bienvenida y solicitudes de amistad

El backend envía correo directamente al servidor **SMTP** del proveedor configurado.
Se genera un aviso al registrar una cuenta y otro para el destinatario de una nueva solicitud
de amistad. Los mensajes incluyen texto plano y HTML, con enlaces al garaje o a Amigos;
no contienen contraseñas ni exponen el correo de otros usuarios.

Las variables de [backend/.env.example](backend/.env.example) permiten configurar la cuenta
de correo y el remitente por separado:

| Variable | Valor que debes configurar |
| --- | --- |
| `MAIL_ENABLED` | `true` para activar los envíos o `false` para desactivarlos. Si se omite, vale `false`. |
| `MAIL_HOST` | Nombre del servidor SMTP indicado por tu proveedor, por ejemplo `smtp.proveedor.example`. |
| `MAIL_PORT` | Puerto de envío con STARTTLS indicado por tu proveedor; habitualmente `587`. |
| `MAIL_USERNAME` | Usuario de autenticación SMTP. Puede ser una dirección de correo o un identificador proporcionado por el proveedor. |
| `MAIL_PASSWORD` | Contraseña SMTP, contraseña específica de aplicación o credencial SMTP que admita tu proveedor. |
| `MAIL_FROM` | Dirección que aparecerá como remitente. Puede ser una dirección de tu dominio personalizado, autorizada en la cuenta que utilizas para autenticarte. Si se omite, se utiliza `MAIL_USERNAME`. |
| `MAIL_FROM_NAME` | Nombre visible del remitente; por ejemplo, `Fuelytics`. |
| `MAIL_FRONTEND_URL` | URL del frontend que se usará en los enlaces del correo. Para desarrollo local: `http://localhost:5173`. Si se omite, se utiliza `FRONTEND_URL`. |

El archivo de ejemplo es una plantilla y deja `MAIL_ENABLED=false`. Reemplaza los textos
de ejemplo por tus datos y cambia el valor a `true` cuando quieras activar los envíos. Completa `MAIL_HOST`
y `MAIL_PORT` con los datos de tu proveedor; no los dejes vacíos ni dependas del servidor
preconfigurado en el backend. Un valor vacío no activa los valores por defecto;
esto también se aplica a `MAIL_FROM` y `MAIL_FRONTEND_URL`.

Define las variables en tu terminal, IDE o plataforma de despliegue: Spring no carga
`.env.example` automáticamente. El envío permanece desactivado si no defines `MAIL_ENABLED`.

Solicita al proveedor el servidor, el puerto y las credenciales para **envío SMTP autenticado
con STARTTLS**. Comprueba también qué direcciones permite utilizar como remitente y si
debes verificar tu dominio o configurar sus registros DNS antes de enviar.

Ejemplo genérico (sustituye todos los valores de ejemplo por los de tu proveedor):

```dotenv
MAIL_ENABLED=true
MAIL_HOST=smtp.proveedor.example
MAIL_PORT=587
MAIL_USERNAME=usuario-smtp-del-proveedor
MAIL_PASSWORD=credencial-smtp-del-proveedor
MAIL_FROM=notificaciones@tu-dominio.com
MAIL_FROM_NAME=Fuelytics
MAIL_FRONTEND_URL=https://tu-frontend.example
```

`MAIL_USERNAME` y `MAIL_PASSWORD` sirven para autenticar el envío; `MAIL_FROM` es la
dirección que verán los destinatarios. Pueden ser diferentes si tu proveedor lo permite.
Define siempre `MAIL_FROM` cuando el usuario SMTP sea un identificador que no sea una
dirección de correo válida. `MAIL_FRONTEND_URL` debe ser la URL pública de tu frontend,
sin parámetros ni fragmentos.

La implementación actual requiere autenticación con usuario y contraseña SMTP, **STARTTLS
obligatorio** y un certificado de servidor válido. No admite directamente proveedores que
exijan exclusivamente OAuth2 ni conexiones con TLS implícito (habitualmente en el puerto
465): cambiar solo `MAIL_PORT` no cambia el modo de conexión. Consulta la documentación
de tu proveedor para comprobar que ofrece un servicio compatible.
No guardes credenciales reales en archivos versionados ni en variables `VITE_*` del frontend.

Los avisos se encolan **después de confirmar la transacción de base de datos**. Un único
trabajador realiza el envío en segundo plano, con una cola limitada a 100 mensajes y tiempos
de espera de conexión, lectura y escritura de 5 segundos. Un fallo SMTP o una cola llena no
deshace el registro ni la solicitud. Los logs indican el tipo de aviso y el fallo, sin imprimir
destinatarios, credenciales ni contenido de los correos. El arranque y las comprobaciones
de salud no abren conexiones SMTP.

La cola reside en memoria: no hay reintentos automáticos ni recuperación de mensajes tras
un reinicio. Los avisos creados mientras `MAIL_ENABLED=false` no se guardan para enviarlos
más tarde. No son necesarios cambios en PostgreSQL, Neon ni `database/schema.sql`.

**Render gratuito bloquea las conexiones SMTP salientes a los puertos 25, 465 y 587**.
Mantén `MAIL_ENABLED=false` en esa instancia. El mismo código podrá enviar desde tu equipo
o desde un alojamiento con SMTP saliente permitido y credenciales válidas; activar el flag
no elimina el bloqueo de Render. Véanse las [limitaciones oficiales de Render](https://render.com/docs/free).

## Eliminación de cuenta

En **Ajustes → Cuenta**, el usuario puede eliminar permanentemente su cuenta tras introducir
su contraseña actual (o confirmar su identidad de Google si no tiene contraseña) y confirmar que comprende la pérdida de datos. La operación
`DELETE /api/users/account` requiere autenticación y un cuerpo JSON con `password`.
Las cuentas sin contraseña utilizan `DELETE /api/auth/google/account` con un ID token
de Google y un desafío de eliminación de un solo uso, vinculado al usuario autenticado.
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
