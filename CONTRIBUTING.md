# Contribuir a Fuelytics

Gracias por tu interés en colaborar con Fuelytics. Las correcciones, propuestas y nuevas funcionalidades son bienvenidas.

Esta guía explica cómo coordinar y entregar una contribución. Para instalar el proyecto, configurar sus servicios y conocer los comandos disponibles, consulta el [README](README.md).

## Antes de empezar

Antes de trabajar en un cambio:

1. Revisa las issues abiertas para comprobar si ya existe una propuesta similar.
2. Si se trata de un error, abre una issue explicando cómo reproducirlo.
3. Si quieres añadir una funcionalidad o realizar un cambio amplio, abre primero una issue para acordar el alcance y evitar trabajo duplicado.

Las correcciones pequeñas y claramente delimitadas pueden enviarse directamente mediante una pull request.

## Flujo de trabajo

1. Haz un fork del repositorio y clónalo en tu equipo.
2. Crea tu rama a partir de `develop`.
3. Realiza cambios centrados en un único objetivo.
4. Ejecuta las comprobaciones indicadas en la sección [Validación](README.md#validación) del README.
5. Envía una pull request hacia `develop`.

Utiliza nombres de rama breves y descriptivos:

```text
feat/nombre-de-la-funcionalidad
fix/problema-corregido
docs/documentacion-actualizada
refactor/parte-modificada
```

No incluyas en la misma pull request refactorizaciones, cambios visuales o correcciones que no estén relacionados con su objetivo principal.

## Commits

Los mensajes de commit se escriben en español y siguen este formato:

```text
tipo: descripción breve en minúsculas
```

Tipos habituales:

- `feat`: nueva funcionalidad.
- `fix`: corrección de un error.
- `style`: cambio visual o de formato que no altera la lógica.
- `refactor`: reorganización interna sin cambiar el comportamiento esperado.
- `test`: incorporación o modificación de pruebas.
- `docs`: cambios de documentación.
- `chore`: mantenimiento de herramientas, dependencias o configuración.

Ejemplos:

```text
feat: añade nuevos combustibles al buscador
fix: corrige el bloqueo al arrastrar el mapa
style: mejora la presentación del menú de gasolineras
docs: aclara la puesta en marcha local
```

Procura que cada commit represente un cambio completo, comprensible y revisable.

## Criterios para los cambios

### Frontend

- Mantén la apariencia y el comportamiento coherentes con el resto de la aplicación.
- Reutiliza los componentes y utilidades existentes antes de crear otros nuevos.
- Conserva los estilos compartidos en `frontend/src/index.css` y utiliza las clases del JSX para los estilos propios de cada componente.
- Crea un archivo CSS adicional únicamente cuando el cambio no pueda expresarse de forma clara con la estructura existente y explica el motivo en la pull request.
- Comprueba la interfaz tanto en escritorio como en móvil.
- Mantén la accesibilidad mediante etiquetas, navegación por teclado y estados de foco visibles.

### Backend

- Mantén separadas las responsabilidades de controladores, servicios, repositorios y DTO.
- Valida los datos recibidos y devuelve errores comprensibles sin revelar información interna.
- Añade o actualiza pruebas cuando cambie la lógica de negocio.
- Evita registrar credenciales, tokens o datos personales.

### Base de datos

- `database/schema.sql` representa la estructura completa utilizada para levantar PostgreSQL en local.
- Coordina previamente cualquier cambio de esquema que pueda afectar a datos existentes.
- Mantén el esquema local reproducible desde una base vacía.
- No incluyas credenciales, copias de seguridad, exportaciones de datos ni información de la base desplegada.

## Pull requests

La descripción de la pull request debe permitir entender el cambio sin revisar primero todos los archivos. Incluye:

- el problema o necesidad que resuelve;
- el comportamiento final;
- los pasos utilizados para comprobarlo;
- capturas o vídeos cuando exista un cambio visual;
- cualquier limitación o decisión relevante.

Antes de enviarla, comprueba que:

- la aplicación compila correctamente;
- las pruebas y el análisis de código pasan;
- no hay archivos generados ni cambios accidentales;
- no se han añadido secretos o datos privados;
- la documentación sigue siendo correcta.

Puedes abrir una pull request como borrador si quieres recibir comentarios antes de terminarla.

## Informar de un error

Una buena issue de error debería incluir:

- una descripción clara del problema;
- los pasos exactos para reproducirlo;
- el resultado esperado y el resultado obtenido;
- el navegador, sistema o entorno donde ocurre;
- capturas, vídeos o mensajes de error relevantes, sin información sensible.

## Proponer una funcionalidad

Explica qué necesidad resuelve, cómo debería comportarse y qué partes del proyecto podrían verse afectadas. Las propuestas pueden cambiar durante la conversación antes de comenzar su desarrollo.

## Convivencia

Mantén un trato respetuoso y constructivo. Las revisiones deben centrarse en el código y en el producto. Si no estás de acuerdo con una decisión, explica sus consecuencias y propone una alternativa concreta.

