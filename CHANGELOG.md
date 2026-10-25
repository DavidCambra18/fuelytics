# Registro de cambios

Todos los cambios importantes de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen [Semantic Versioning](https://semver.org/lang/es/).

Las fechas corresponden a la publicación de cada versión en GitHub.

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
