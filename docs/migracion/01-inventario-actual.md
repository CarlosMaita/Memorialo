# Inventario Actual

## 1. Estructura del Repositorio
- figma/: aplicacion frontend React + Vite con logica de UI y consumo de backend.
- laravel/: carpeta reservada para backend destino (actualmente vacia).
- docs/: documentacion de migracion (creada en esta fase).

## 2. Stack Actual Detectado
- Frontend: React 18, Vite 6.
- Integracion backend: Supabase client + endpoints custom.
- Backend actual custom: Supabase Functions con Hono.
- Persistencia actual backend custom: tabla KV (kv_store_5d78aefb).

## 3. Dominios Funcionales Detectados
- Autenticacion y sesion (signup, signin, OAuth, estado de sesion).
- Usuarios y perfiles.
- Proveedores (providers).
- Servicios/publicaciones.
- Contratos.
- Bookings.
- Reviews.
- Eventos.
- Flujos admin.
- Notificaciones y correo transaccional (parcial/legacy).

## 4. Evidencias Tecnicas Relevantes
- readme.md: objetivo explicito de migrar desde Figma hacia Laravel.
- figma/src/utils/useSupabase.ts: capa de integracion frontend para auth y recursos de negocio.
- figma/src/supabase/functions/server/index.tsx: API actual (Hono) con rutas de auth/users/providers y otras.
- figma/src/supabase/functions/server/kv_store.tsx: almacenamiento key-value sobre Supabase.
- figma/src/supabase/functions/server/index.tsx: existen endpoints legacy de correo `notifications/booking-created` y `notifications/contract-signed` que hoy solo registran log y no representan un sistema integral.
- laravel/config/mail.php y laravel/config/services.php: base disponible para mailers, pero sin flujo de negocio conectado a eventos de dominio.
- laravel/app/Models/User.php: modelo ya incorpora `Notifiable`, lo que facilita adopcion de notificaciones nativas Laravel.

## 5. Hallazgos Criticos para la Migracion
- No existe aun bootstrap de Laravel 13 en laravel/.
- El modelo KV no impone integridad referencial; requerira normalizacion a tablas relacionales.
- Hay mezcla de datos reales y fallback mock en frontend; se debe definir estrategia de corte.
- No existe bandeja de notificaciones in-app en frontend ni endpoint Laravel dedicado para listar/marcar como leidas.
- Los eventos de correo actuales no estan centralizados ni son idempotentes; dependen de llamadas directas puntuales desde frontend.
- No hay evidencia de cola/queue para envio asincrono de correos; riesgo alto de acoplar latencia de mail al flujo principal si no se disena correctamente.

## 6. Supuestos de Trabajo
- Version objetivo: Laravel 13.
- Se mantendra frontend actual durante la transicion.
- Se migrara de API Supabase Functions a API Laravel de forma incremental.

## 7. Informacion Pendiente por Confirmar
- Motor de base de datos definitivo en Laravel (MySQL/PostgreSQL).
- Politica final de autenticacion (Laravel Sanctum, Passport o JWT).
- Estrategia para archivos/imagenes (mantener bucket Supabase o mover a S3/local).
- Ventana de corte a produccion y criterios de rollback de negocio.
- Proveedor transaccional de correo objetivo (SMTP, Postmark, Resend, SES).
- Politica de retencion de notificaciones in-app (ej. 90/180 dias) y archivado.
- Reglas de agrupacion y deduplicacion de notificaciones para evitar duplicados por reintentos.

## 8. Inventario Inicial del Modulo de Notificaciones
### Casos solicitados por negocio
- Usuario y proveedor deben ver icono de notificaciones en header.
- Usuario recibe correo cuando proveedor aprueba el contrato.
- Proveedor recibe correo cuando usuario solicita un servicio.
- Usuario recibe notificacion para dejar reseña al completarse el servicio.
- Proveedor recibe notificacion al recibir una reseña.
- Usuario recibe correo de bienvenida al registrarse.
- Usuario recibe notificacion al convertirse en proveedor.

### Estado actual por caso
- Icono/bandeja en header: no implementado.
- Correo de aprobacion de contrato: legado parcial por endpoint `contract-signed`, sin evidencia de integracion Laravel.
- Correo de nueva solicitud de servicio: legado parcial por endpoint `booking-created`, sin persistencia ni cola.
- Recordatorio de reseña al completar servicio: no implementado.
- Aviso al proveedor por nueva reseña: no implementado.
- Correo de bienvenida: no implementado.
- Notificacion al convertirse en proveedor: no implementado.

## 9. Diseno Objetivo N1 - Modelo de Persistencia
### 9.1 Principio de diseno
- Separar lectura UX de operacion por canal.
- Resolver in-app sobre infraestructura nativa Laravel.
- Resolver auditoria y delivery sobre una entidad operativa independiente.

### 9.2 Tabla `notifications`
- Uso objetivo: bandeja in-app, badge de no leidas, dropdown del header e historial reciente.
- Base tecnica: canal `database` de Laravel Notifications.
- Campos esperados:
	- `id` (uuid)
	- `type`
	- `notifiable_type`
	- `notifiable_id`
	- `data` (json)
	- `read_at`
	- `created_at`
	- `updated_at`

### 9.3 Payload canonico en `notifications.data`
- `notificationType`: tipo canonico de negocio.
- `title`: titulo corto para header/bandeja.
- `body`: descripcion resumida.
- `priority`: `low`, `normal` o `high`.
- `actor`: objeto opcional `{ id, name, role }`.
- `entity`: objeto `{ type, id }` para deep-link a booking, contrato, review o perfil.
- `ctaUrl`: ruta relativa del frontend.
- `channels`: lista de canales objetivo para ese evento.
- `dedupeKey`: clave estable de idempotencia.
- `meta`: bolsa controlada para datos auxiliares.

### 9.4 Tabla `notification_deliveries`
- Uso objetivo: trazabilidad por canal, reintentos, errores e idempotencia operativa.
- Campos propuestos:
	- `id` (bigint autoincremental)
	- `notification_id` (uuid nullable, referencia logica a `notifications.id`)
	- `notification_type` (string)
	- `recipient_user_id` (nullable)
	- `recipient_email` (nullable)
	- `channel` (`database|mail`)
	- `status` (`pending|sent|failed|skipped`)
	- `dedupe_key` (string indexado)
	- `provider` (`smtp|postmark|resend|ses|log`)
	- `provider_message_id` (nullable)
	- `attempts` (integer)
	- `queued_at` (nullable)
	- `sent_at` (nullable)
	- `failed_at` (nullable)
	- `error_message` (text nullable)
	- `created_at`
	- `updated_at`

### 9.5 Tipos canonicos N1
- `welcome`
- `service_request_created`
- `contract_approved`
- `review_requested`
- `review_received`
- `provider_role_activated`

### 9.6 Matriz inicial evento -> canal
- `welcome`: `mail`
- `service_request_created`: `mail` + `database`
- `contract_approved`: `mail` + `database`
- `review_requested`: `database`
- `review_received`: `database`
- `provider_role_activated`: `database`

### 9.7 Regla de idempotencia
- Cada evento debe producir una `dedupe_key` estable y deterministica.
- Formato inicial sugerido:
	- `welcome:{userId}`
	- `service_request_created:{bookingId}`
	- `contract_approved:{contractId}`
	- `review_requested:{bookingId}`
	- `review_received:{reviewId}`
	- `provider_role_activated:{userId}`
- La unicidad operativa debe evaluarse por `dedupe_key + channel + recipient_user_id|recipient_email`.

### 9.8 Rollback N1
- Desactivar flags de notificaciones in-app o mail sin borrar historico.
- Mantener persistencia creada en modo inactivo si ya se aplicaron migraciones.
- Conservar temporalmente endpoints legacy de correo mientras N3 no este validado end-to-end.

## 10. Diseno Objetivo N2 - API de Bandeja y Estado
### 10.1 Principios de contrato
- Resolver identidad de bandeja solo por usuario autenticado.
- Exponer respuestas estables para header y dropdown.
- Soportar crecimiento de volumen con paginacion por cursor.
- Evitar N+1: toda info UX debe venir en `data` sin joins frontend.

### 10.2 Endpoints propuestos
- `GET /api/notifications`
	- Objetivo: listar notificaciones para el usuario autenticado.
	- Query params:
		- `cursor` (opcional)
		- `limit` (opcional, default 20, max 50)
		- `unread` (opcional, `true|false`)
		- `type` (opcional, tipo canonico)
	- Respuesta 200:
		- `items`: arreglo de notificaciones.
		- `pageInfo`: `{ nextCursor, hasMore, limit }`.
		- `unreadCount`: entero con no leidas totales.

- `GET /api/notifications/unread-count`
	- Objetivo: obtener contador rapido para badge del icono.
	- Respuesta 200:
		- `count`: entero.

- `PATCH /api/notifications/{id}/read`
	- Objetivo: marcar una notificacion como leida.
	- Regla: solo permite ids pertenecientes al usuario autenticado.
	- Respuesta 200:
		- `id`, `readAt`.

- `PATCH /api/notifications/read-all`
	- Objetivo: marcar todas las no leidas del usuario autenticado.
	- Respuesta 200:
		- `updated`: cantidad de filas afectadas.
		- `readAt`: timestamp aplicado.

### 10.3 Forma del item de bandeja
- `id`
- `type`
- `title`
- `body`
- `priority`
- `entity`
- `ctaUrl`
- `createdAt`
- `readAt`
- `isRead`

### 10.4 Errores esperados
- `401` no autenticado.
- `403` id de notificacion fuera de ownership.
- `404` notificacion inexistente para el usuario.
- `422` query params invalidos (`limit`, `unread`, `type`).
- `429` exceso de requests para badge polling.

### 10.5 Reglas de autorizacion N2
- Middleware de auth obligatorio en los endpoints N2.
- Scope por propietario: `notifiable_id == auth()->id()` y `notifiable_type == User::class`.
- Prohibido exponer endpoints de administracion de bandeja cross-user en N2.

### 10.6 Reglas de consistencia N2
- Orden por defecto: `created_at DESC`.
- `unreadCount` debe ser consistente con `read_at IS NULL`.
- `mark-as-read` debe ser idempotente.
- `read-all` debe ser atomico por usuario.

### 10.7 Feature flags N2
- Backend: `NOTIFICATIONS_IN_APP_ENABLED=true` habilita endpoints.
- Frontend: `VITE_NOTIFICATIONS_HEADER_ENABLED=true` habilita icono y dropdown.

### 10.8 Rollback N2
- Frontend: apagar icono/dropdown via `VITE_NOTIFICATIONS_HEADER_ENABLED=false`.
- Backend: mantener endpoints disponibles solo para soporte interno o apagarlos via `NOTIFICATIONS_IN_APP_ENABLED=false`.
- Persistencia: no eliminar historico ni migraciones de N1.
