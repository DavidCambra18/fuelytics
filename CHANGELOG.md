# Registro de cambios

Todos los cambios importantes de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen [Semantic Versioning](https://semver.org/lang/es/).

## [v1.1.0] — 2026-10-25

### Añadido

- **Acceso con Google**, con gestión de la cuenta vinculada desde Ajustes.
- **Amigos y clasificación entre amigos**: busca usuarios mientras escribes, envía solicitudes y compara consumos.
- **Recordatorios independientes** por fecha o kilometraje, que puedes vincular al gasto del mantenimiento realizado.
- **Nuevas estadísticas** de consumo, precio y distancia, con filtros por fechas o últimos repostajes, consumo mensual y desglose de gastos por categoría.
- **Recorrido guiado** para las cuentas nuevas, disponible también desde el menú de usuario.
- Opción para **eliminar tu cuenta** y sus datos desde Ajustes.
- Correos de bienvenida y solicitudes de amistad cuando el envío de correo está activado.

### Mejorado

- **Interfaz renovada en toda la aplicación**, con navegación lateral, menú móvil y formularios más cómodos en pantallas pequeñas.
- **Mapa de gasolineras más claro**: etiquetas con el precio del combustible elegido, fichas de estación mejor organizadas y más combustibles disponibles.
- Ubicación personal en el mapa, botón para volver a ella y distancias calculadas desde tu posición cuando está disponible.
- **Registro en tres pasos**, con comprobación de disponibilidad del correo y del usuario, y requisitos de contraseña más claros.
- Historiales de repostajes y gastos paginados, manteniendo los resúmenes de todo el historial.
- Navegación y estados de carga más fluidos, mejores controles por teclado y animaciones que respetan la preferencia de movimiento reducido.

### Corregido

- Cálculos de consumo que podían perder repostajes parciales o mezclar unidades, e informes PDF que perdían la referencia anterior al filtrar fechas.
- Kilometraje desactualizado en el resumen del vehículo y al montar neumáticos después de registrar o modificar un repostaje.
- Recordatorios que podían cerrarse por registrar otro mantenimiento, y errores al sustituir neumáticos o vincular gastos de otro vehículo.
- Cierres de sesión causados por respuestas antiguas y falta de sincronización al entrar o salir desde otra pestaña.
- Problemas de privacidad en las estadísticas y datos de vehículos públicos, y conflictos entre cambios simultáneos de perfil o vehículo.
- Fechas que aparecían en el día anterior, resultados inválidos en la calculadora y unidades incorrectas en vehículos eléctricos, de gas y agrícolas.
- Fallos al cargar gasolineras, mover rápidamente el mapa o abrir sus fichas, además de avisos temporales de «Vehículo no encontrado» y estadísticas a cero durante la carga.

## [v1.0.0] - 2026-06-11

Versión estable publicada sin notas de cambios en GitHub.

## [v0.2.0-beta] - 2026-05-23

### Añadido

- Soporte para vehículos eléctricos y agrícolas.
- Pantalla de ajustes unificada para editar datos personales y gestionar la visibilidad de la cuenta.
- Perfil público de usuario con acceso controlado: se puede ver el propio perfil aunque la cuenta sea privada, pero no el de otros usuarios privados.
- Privacidad por vehículo con controles independientes para publicar o ocultar cada coche y sus datos asociados.
- Buscador y acordeón en la sección de vehículos para administrar cómodamente cuentas con muchos coches.
- Iconografía nueva con `lucide-react` para mejorar la navegación, los accesos rápidos y las opciones visuales de repostaje.
- Tarjetas visuales con iconos y microdescripciones para las condiciones de conducción en la pantalla de repostajes.

### Cambiado

- Unidades y textos adaptados para vehículos eléctricos y agrícolas.
- Se ajusta la etiqueta `allseason` de neumáticos en `vehicleLabels.js` a "Neumáticos 4 estaciones".
- El backend valida que el nombre de usuario no esté duplicado al actualizar el perfil.
- La matrícula deja de exponerse en respuestas y vistas públicas.
- Cuando un vehículo deja de ser público, también se ocultan automáticamente sus repostajes, gastos y estadísticas.
- Se mejora el aspecto visual de las opciones de condiciones de conducción en repostajes con tarjetas más legibles y cohesionadas.

### Corregido

- El token expirado redirige correctamente al login.
- Se corrige el cálculo del consumo y la visualización de estadísticas del coche.
- Se ajusta la configuración de conexión a la base de datos para evitar errores de arranque.
- Se corrige el comportamiento del selector personalizado para que cierre al seleccionar una opción y con un cierre suave al perder el foco.

## [v0.1.0-beta] - 2026-05-19

- Lanzamiento inicial (beta).

[v1.0.0]: https://github.com/DavidCambra18/fuelytics/releases/tag/v1.0.0
[v0.2.0-beta]: https://github.com/DavidCambra18/fuelytics/releases/tag/v0.2.0-beta
[v0.1.0-beta]: https://github.com/DavidCambra18/fuelytics/releases/tag/v0.1.0-beta
