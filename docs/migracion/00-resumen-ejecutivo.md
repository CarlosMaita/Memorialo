# Resumen Ejecutivo - Migracion a Laravel 13

> **ACTUALIZACION — 2025-06 (re-inventario completo):**
> La migracion a Laravel 13 **esta COMPLETADA** en su totalidad funcional. El backend Laravel esta plenamente operativo. Los documentos anteriores describían el estado inicial del proyecto antes del desarrollo; este encabezado y la seccion de estado actual reflejan la realidad al momento del re-analisis.

---

## Objetivo
Migrar este repositorio desde una arquitectura frontend + Supabase Functions/KV a una base backend en Laravel 13, manteniendo continuidad funcional del marketplace para artistas y dejando trazabilidad completa del proceso.

## Estado Inicial Observado
- El frontend principal vive en figma/ (React + Vite).
- Hay integracion activa con Supabase y una API en Supabase Functions (Hono + KV store).
- La carpeta laravel/ existe pero actualmente no contiene una app Laravel inicializada.

## Alcance de Migracion
- Crear backend Laravel 13 desde cero en laravel/.
- Portar contratos de API, reglas de negocio y persistencia hoy implementadas en Supabase Functions.
- Definir y ejecutar migracion de datos desde modelo KV a modelo relacional (MySQL o PostgreSQL).
- Mantener frontend funcional durante una transicion por fases.
- Incorporar un modulo formal de notificaciones in-app y correo transaccional en Laravel para eventos criticos de negocio.

## Principios de Ejecucion
- Entregas incrementales con rollback por fase.
- Compatibilidad temporal de endpoints para evitar corte brusco.
- Documentacion continua en docs/migracion.
- Criterios de salida verificables en cada fase.
- Implementacion de codigo backend siguiendo principios SOLID.

## Entregables de Documentacion
- docs/migracion/01-inventario-actual.md
- docs/migracion/02-plan-fases.md
- docs/migracion/03-bitacora-cambios.md
- docs/migracion/04-riesgos-y-mitigaciones.md
- docs/migracion/05-checklist-validacion.md

## Resultado Esperado
Al finalizar, Laravel 13 sera el backend principal para autenticacion, usuarios, providers, servicios, contratos, bookings, reviews, eventos, notificaciones y funciones admin; Supabase quedara limitado a los componentes que se decida conservar explicitamente (si aplica).

---

## Estado Real al Re-inventario (2025-06)

### Conclusion
La migracion **esta completada**. Laravel 13 es el backend principal y operativo con todos los dominios de negocio implementados.

### Stack productivo confirmado
| Componente | Tecnologia | Version |
|---|---|---|
| Framework | Laravel | ^13.0 |
| Lenguaje | PHP | ^8.3 |
| Base de datos principal | MySQL | (configurado en .env) |
| Autenticacion | Laravel Sanctum | ^4.0 |
| OAuth | Laravel Socialite (Google) | ^5.25 |
| WebSockets / Tiempo real | Laravel Reverb | ^1.9 |
| Frontend assets | Vite 8 + Tailwind CSS 4 | ^8.0 / ^4.0 |
| Testing | PHPUnit | ^12.5 |
| Queue | Database driver | - |
| Cache | Database driver | - |
| Broadcast | Reverb | - |

### Dominios implementados (todos en produccion)
- Autenticacion (registro, login, Google OAuth, logout, /me)
- Usuarios y perfiles (actualizar perfil, solicitar acceso proveedor)
- Proveedores (CRUD, verificacion admin, ban/unban)
- Servicios (CRUD, filtros, paginacion)
- Contratos (CRUD, firma artista/cliente, ciclo de vida, metadata legal)
- Bookings/Reservas (CRUD, scopes por rol, paginacion)
- Eventos del cliente (CRUD, archivado, contract_ids)
- Reviews (crear, listar por servicio)
- Facturacion/Billing (invoices, ciclo mensual, comisiones, pago, aprobacion admin)
- Notificaciones in-app + email (bandeja, conteo, marcado, deduplicacion)
- Chat en tiempo real (conversaciones, mensajes, attachments, intervencion admin, Reverb)
- Favoritos (agregar, listar, eliminar)
- Admin (usuarios, providers, marketplace config, acceso proveedor)
- Interested Providers (formulario de interes publico)

### Migraciones aplicadas: 32 archivos
### Modelos: 18
### Controladores: 17
### Test suites: 10 tests de Feature + Unit base

### Pendientes identificados (post-inventario)
- Autorizacion formal via Policies o Gates (actualmente inline en controllers)
- Form Requests dedicados (validacion inline en controllers)
- Rate limiting en endpoints publicos y de autenticacion
- Soft deletes en entidades criticas (Booking, Contract, Service)
- Estrategia de archivos/imagenes (actualmente UploadController existe pero sin detalle de storage backend)
- Cobertura de tests para dominios de billing, contratos y chat
- Configuracion de Horizon o Supervisor para queue workers en produccion

## Alcance Especifico del Modulo de Notificaciones
- Notificaciones in-app visibles desde icono en header para usuarios y proveedores.
- Correos transaccionales para eventos de onboarding y operacion.
- Trazabilidad de estado: pendiente, enviada, leida, fallida.
- Integracion por eventos de dominio para evitar acoplamiento en controladores.
- Ejecucion incremental con rollback por lote funcional.

## Decision Operativa N1 - Persistencia Objetivo
- Se adopta un modelo hibrido para el modulo de notificaciones.
- La tabla `notifications` de Laravel sera la base de la bandeja in-app, badge de no leidas y lectura desde header.
- Se define una tabla complementaria `notification_deliveries` para trazabilidad de entrega por canal, idempotencia y auditoria de correo.
- Esta separacion evita sobrecargar la bandeja UX con datos operativos como `dedupe_key`, `sent_at`, `failed_at`, proveedor de envio y reintentos.
- El rollback de N1 podra ejecutarse por canal, desactivando consumo frontend y/o emision de correo sin perder trazabilidad de datos ya persistidos.

## Decision Operativa N2 - Contrato de Lectura y Estado
- El header consumira tres capacidades backend sobre `/api/notifications`:
	- listado paginado de bandeja,
	- conteo de no leidas,
	- marcado de lectura (individual y masivo).
- Todas las operaciones requieren sesion autenticada y se resuelven sobre el usuario autenticado, sin exponer `userId` por URL.
- El contrato prioriza bajo acoplamiento con frontend: payload estable, pagina por cursor, filtros minimos (`unread`, `type`) y orden descendente por fecha de creacion.
- Rollback N2: ocultar icono de header por feature flag frontend y mantener persistencia activa sin consumo UI.
