# 🏎️ Fuelytics

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-orange?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-0.1.0--alpha-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.10-646CFF?logo=vite)](https://vitejs.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.6-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-FFA500?logo=openjdk)](https://java.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://www.postgresql.org/)
![Last Commit](https://img.shields.io/github/last-commit/davidcambra18/fuelytics)

**Fuelytics** es una plataforma Full-Stack diseñada para conductores que quieren llevar un control riguroso de su consumo y gastos. Permite transformar los datos de repostaje en estadísticas claras para optimizar gastos y monitorizar el rendimiento real de cualquier vehículo.

---

## 🚀 Funcionalidades Principales

* **🌐 Gestión Multi-Vehículo:** Crea perfiles específicos para diferentes coches, almacenando detalles técnicos de motor y combustible.
* **⛽ Registro de Repostajes:** Historial detallado de repostajes, incluyendo precio, litros, y tipo de conducción.
* **📒 Registro de Gastos:** Historial detallado de gastos, incluyendo tipo de gasto, coste y fecha.
* **📊 Análisis de Datos:** Visualización de métricas clave como el consumo medio (L/100km) y gasto acumulado.

---

## 🛠️ Herramientas y Tecnologías

### 🎨 Frontend
* **React + Vite:** Para una interfaz rápida y una experiencia de desarrollo ágil.
* **Tailwind CSS:** Diseño moderno, limpio y totalmente responsivo.

### ⚙️ Backend
* **Java & Spring Boot:** Lógica de negocio y API REST.
* **Spring Security:** Control de acceso y protección de rutas.
* **Maven:** Gestión de dependencias.

### 💾 Base de Datos e Infraestructura
* **PostgreSQL:** Almacenamiento relacional para usuarios, vehículos, gastos y repostajes.
* **Docker:** Contenedores para asegurar un entorno de desarrollo idéntico (DB).

---

## 🏗️ Arquitectura del Proyecto

El sistema está dividido en dos grandes bloques:

1.  **Frontend SPA:** Gestiona la interacción del usuario y solicita tokens.
2.  **Backend API:** Procesa las peticiones, valida los tokens y persiste la información en la DB.

---

## 📦 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/davidcambra18/fuelytics.git
   ```
2. **Iniciar la base de datos local (Docker):**
   ```bash
   cd database
   docker-compose up -d
   ```
3. **Iniciar backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
4. **Iniciar frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

Desarrollado por [David Cambra](https://github.com/DavidCambra18) - 2026