# 🏥 Sistema Clínico Multi-Tenant (Healthcare SaaS Platform)

Plataforma integral de gestión médica y financiera para consultorios, clínicas y redes de salud. Desarrollada con arquitectura monorepo basada en **NestJS (API REST + TypeORM + PostgreSQL)** y **React (TypeScript + Vite + Tailwind CSS)** bajo contenedores **Docker**.

---

## 📘 Documentación Oficial y Continuidad del Proyecto

* **[Manual Maestro de Arquitectura y Operación](docs/MANUAL_MAESTRO_DEL_PROYECTO.md)**: Guía completa que describe el stack, estructura del monorepo, credenciales maestras, flujos de seguridad (Multi-Tenant y RBAC) y el procedimiento para continuar el desarrollo en nuevas sesiones de IA o con nuevos desarrolladores.

---

## 🚀 Despliegue Rápido con Docker

```bash
# Levantar todos los servicios (Base de datos, API y Frontend con Nginx)
docker compose up -d --build

# Ver contenedores en ejecución
docker ps
```

* **Frontend Web (Nginx SPA):** `http://localhost` (o IP del servidor)
* **API REST (NestJS):** `http://localhost:3000` (o `http://localhost/api`)
* **Base de Datos (PostgreSQL 16):** Puerto interno `5432`

---

## 🔑 Credenciales de Acceso Rápidas

* **Director / Admin:** `dr.carlos@test.com` / `Test1234!`
* **Médico:** `medico@test.com` / `Test1234!`
* **Recepción / Caja:** `recepcion@test.com` / `Test1234!`
* **SuperAdmin SaaS:** `superadmin@saas.com` / `AdminSeguro2026!` (Portal en `/admin`)
