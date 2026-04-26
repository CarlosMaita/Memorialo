# Inventario Actual

> **ACTUALIZACION — 2025-06 (re-inventario completo):**
> Las secciones 1–10 a continuacion documentan el estado inicial del proyecto ANTES del desarrollo backend.
> A partir de la seccion 11 se documenta el **estado real y completo actual** del backend Laravel operativo.

---

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

---

## 11. Inventario Real del Backend Laravel (Re-inventario 2025-06)

### 11.1 Estructura de directorios relevante
```
laravel/
├── app/
│   ├── Console/
│   ├── Events/
│   │   └── ChatMessageCreated.php          # Evento broadcast Reverb
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AdminController.php
│   │       ├── AuthController.php
│   │       ├── BillingController.php
│   │       ├── BookingController.php
│   │       ├── ChatConversationController.php
│   │       ├── ChatMessageController.php
│   │       ├── ContractController.php
│   │       ├── Controller.php
│   │       ├── EventController.php
│   │       ├── FavoriteController.php
│   │       ├── InterestedProviderController.php
│   │       ├── NotificationController.php
│   │       ├── ProviderController.php
│   │       ├── ReviewController.php
│   │       ├── ServiceController.php
│   │       ├── UploadController.php
│   │       └── UserController.php
│   ├── Models/                             # 18 modelos Eloquent
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Services/
│   │   ├── BillingCycleService.php         # Logica de facturacion mensual
│   │   └── NotificationDispatchService.php # Despacho multi-canal con dedupe
│   └── Support/
│       └── NotificationTypes.php           # Constantes de tipos de notificacion
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/                         # 32 archivos
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── LoadTestSeeder.php
├── resources/
│   ├── css/
│   ├── js/
│   │   ├── app.js
│   │   └── bootstrap.js
│   └── views/
│       ├── emails/
│       └── welcome.blade.php
├── routes/
│   ├── api.php                             # 50+ endpoints REST
│   ├── channels.php                        # Canales broadcast Reverb
│   ├── console.php
│   └── web.php
└── tests/
    ├── Feature/                            # 10 suites de prueba
    └── Unit/
```

### 11.2 Modelos Eloquent — Tabla de Referencia Completa

| Modelo | Tabla | PK | Tipo PK | Relaciones clave |
|---|---|---|---|---|
| User | users | id | bigint autoincrement | belongsTo Provider; hasMany Service, ChatParticipant, ChatMessage, ChatMessageRead |
| Provider | providers | id | bigint autoincrement | belongsTo User; hasMany Service |
| Service | services | id | bigint autoincrement | belongsTo User, Provider |
| Booking | bookings | id | string (UUID-like) | Sin relaciones Eloquent (join manual) |
| Contract | contracts | id | string (UUID-like) | Sin relaciones Eloquent (join manual) |
| Event | events | id | string (UUID-like) | Sin relaciones Eloquent |
| Review | reviews | id | bigint autoincrement | belongsTo Service (artist), User |
| BillingInvoice | billing_invoices | id | bigint autoincrement | belongsTo Provider |
| BillingSetting | billing_settings | id | bigint autoincrement | - |
| ChatConversation | chat_conversations | id | UUID | belongsTo User (client), User (provider), Service; hasMany ChatParticipant, ChatMessage; hasOne ChatMessage (latest) |
| ChatMessage | chat_messages | id | string UUID | belongsTo ChatConversation, User (author); hasMany ChatMessageRead, ChatMessageAttachment |
| ChatParticipant | chat_participants | id | bigint autoincrement | belongsTo ChatConversation, User |
| ChatMessageAttachment | chat_message_attachments | id | bigint autoincrement | belongsTo ChatMessage |
| Favorite | favorites | id | bigint autoincrement | belongsTo User, Service |
| InterestedProvider | interested_providers | id | bigint autoincrement | - |
| MarketplaceSetting | marketplace_settings | id | bigint autoincrement | - |
| NotificationDelivery | notification_deliveries | id | bigint autoincrement | - |

### 11.3 Campos criticos por modelo

#### User
```
id, name, email, google_id, password, phone, whatsapp_number, avatar
is_provider (bool), provider_id (FK), provider_request_status, provider_requested_at
provider_approved_at, provider_approved_by, role (user|provider|admin)
banned (bool), banned_at, banned_reason
billing_suspended_at, billing_suspension_reason
archived (bool), archived_at
```

#### Provider
```
id, user_id (FK), business_name, category, description
representative (JSON: {type, name, documentType, documentNumber})
legal_entity_type (person|company), identification_number
verified (bool), verified_at, verified_by
banned (bool), banned_at, banned_by, banned_reason, unbanned_at, unbanned_by
rating (decimal:2), total_bookings, services (JSON)
```

#### Booking
```
id (string), artist_id, artist_user_id, artist_name
user_id, client_name, client_email, client_phone
date, start_time, duration (int), event_type, location, special_requests
total_price (decimal:2), status (pending|confirmed|completed|cancelled)
plan_id, plan_name, contract_id, metadata (JSON)
```

#### Contract
```
id (string), booking_id, artist_id, artist_user_id, artist_name, artist_email, artist_whatsapp
client_id, client_name, client_email, client_whatsapp, event_id
status (draft|active|completed|cancelled)
terms (JSON), artist_signature (JSON), client_signature (JSON)
completed_at, metadata (JSON)
```

#### BillingInvoice
```
id, provider_id (FK), month (YYYY-MM), period_start, period_end
commission_rate (decimal:4), contract_count (int), total_sales (decimal:2)
amount (decimal:2), status (pending|submitted|approved|rejected|overdue|empty)
due_date, grace_period_end, payment_reference, payment_submitted_at
paid_at, payment_reviewed_at, payment_reviewed_by, payment_rejection_reason
billing_snapshot (JSON), generated_at
```

#### BillingSetting
```
id, closure_day (tinyint), payment_grace_days (tinyint)
commission_rate (decimal:4), last_closed_month (YYYY-MM)
```

#### ChatConversation
```
id (UUID), booking_id, service_id (FK), client_user_id (FK), provider_user_id (FK)
requires_admin_intervention (bool), intervention_requested_at
intervention_requested_by (FK), last_message_at, expires_at
```

### 11.4 Migraciones — Listado Completo Ordenado

| # | Archivo | Descripcion |
|---|---|---|
| 01 | 0001_01_01_000000_create_users_table | Tabla base users, password_reset_tokens, sessions |
| 02 | 0001_01_01_000001_create_cache_table | Cache en base de datos |
| 03 | 0001_01_01_000002_create_jobs_table | Queue jobs y batches |
| 04 | 2026_03_21_034017_create_personal_access_tokens_table | Sanctum tokens |
| 05 | 2026_03_21_050000_create_providers_table | Tabla providers base |
| 06 | 2026_03_21_050100_create_services_table | Tabla services |
| 07 | 2026_03_21_050200_add_migration_fields_to_users_table | Campos provider/role/banned/archived en users |
| 08 | 2026_03_21_060000_create_reviews_table | Tabla reviews |
| 09 | 2026_03_21_070000_create_contracts_table | Tabla contracts (PK string, JSON terms/signatures) |
| 10 | 2026_03_21_070100_add_bookings_completed_to_services_table | bookings_completed en services |
| 11 | 2026_03_21_071000_create_bookings_table | Tabla bookings (PK string) |
| 12 | 2026_03_21_072000_create_events_table | Tabla events del cliente (PK string) |
| 13 | 2026_03_21_073000_create_billing_invoices_table | Tabla billing_invoices base |
| 14 | 2026_03_21_074000_add_admin_fields_to_providers_table | Campos admin (verified, banned) en providers |
| 15 | 2026_03_21_080000_create_notifications_table | Notificaciones nativas Laravel |
| 16 | 2026_03_21_080100_create_notification_deliveries_table | Auditoria de entrega por canal |
| 17 | 2026_03_22_210000_add_google_id_to_users_table | OAuth Google: google_id, avatar en users |
| 18 | 2026_03_22_220000_create_favorites_table | Tabla favorites |
| 19 | 2026_03_22_230000_add_provider_access_fields_to_users_table | Campos de solicitud proveedor en users |
| 20 | 2026_03_23_120000_create_chat_conversations_table | Conversaciones de chat (UUID) |
| 21 | 2026_03_23_120100_create_chat_participants_table | Participantes por conversacion |
| 22 | 2026_03_23_120200_create_chat_messages_table | Mensajes de chat (UUID) |
| 23 | 2026_03_23_120300_create_chat_message_reads_table | Lectura de mensajes |
| 24 | 2026_03_24_090000_add_expires_at_to_chat_conversations_table | Vencimiento de conversaciones |
| 25 | 2026_03_24_090100_create_chat_message_attachments_table | Adjuntos en mensajes |
| 26 | 2026_03_25_000100_create_billing_settings_table | Configuracion global de facturacion |
| 27 | 2026_03_25_000200_expand_billing_invoices_table | Expansion billing: period, grace, review |
| 28 | 2026_03_25_000300_add_billing_suspension_fields_to_users_table | Suspension por mora en users |
| 29 | 2026_03_25_120000_add_legal_fields_to_providers_table | Campos legales en providers |
| 30 | 2026_03_30_000000_create_interested_providers_table | Formulario interes de proveedores |
| 31 | 2026_04_02_000100_create_marketplace_settings_table | Configuracion de ciudades del marketplace |
| 32 | 2026_04_03_150000_add_representative_json_to_providers_table | JSON representative en providers |

### 11.5 API Routes — Mapa Completo

#### Publicas (sin auth)
```
GET  /api/health
GET  /api/users/{id}
GET  /api/providers
GET  /api/providers/user/{userId}
GET  /api/services
GET  /api/services/{id}
GET  /api/marketplace/config
GET  /api/events
GET  /api/billing/config
GET  /api/reviews

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/google/redirect
GET  /api/auth/google/callback
POST /interested-providers    [web route]
```

#### Autenticadas (auth:sanctum)
```
GET  /api/auth/me
POST /api/auth/logout
GET  /api/user

PUT    /api/users/{id}
POST   /api/users/{id}/provider-request

POST   /api/providers
PUT    /api/providers/{id}

POST   /api/services
PUT    /api/services/{id}
DELETE /api/services/{id}

POST   /api/contracts
GET    /api/contracts
PUT    /api/contracts/{id}

POST   /api/bookings
GET    /api/bookings
PUT    /api/bookings/{id}

POST   /api/events
PUT    /api/events/{id}
DELETE /api/events/{id}

GET    /api/billing/provider/{providerId}
POST   /api/billing/provider/{providerId}/pay
GET    /api/billing/admin/overview
PATCH  /api/billing/admin/config
POST   /api/billing/admin/invoices/{invoiceId}/approve
POST   /api/billing/admin/invoices/{invoiceId}/reject

GET    /api/admin/users
GET    /api/admin/interested-providers
PATCH  /api/admin/marketplace-config
POST   /api/admin/providers/{id}/verify
POST   /api/admin/providers/{id}/ban
POST   /api/admin/providers/{id}/unban
POST   /api/admin/users/{id}/ban
POST   /api/admin/users/{id}/unban
POST   /api/admin/users/{id}/archive
POST   /api/admin/users/{id}/unarchive
POST   /api/admin/users/{id}/provider-access/approve
POST   /api/admin/users/{id}/provider-access/revoke
DELETE /api/admin/users/{id}

POST   /api/upload-image
POST   /api/reviews

GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/{id}/read
PATCH  /api/notifications/read-all

GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/{serviceId}

GET    /api/chat/conversations
POST   /api/chat/conversations
GET    /api/chat/conversations/{id}
PATCH  /api/chat/conversations/{id}/intervention
GET    /api/chat/conversations/{conversationId}/messages
POST   /api/chat/conversations/{conversationId}/messages
PATCH  /api/chat/conversations/{conversationId}/read
```

#### Canales Broadcast (Reverb / auth:sanctum)
```
App.Models.User.{id}               → privado por usuario
chat.user.{id}                     → privado por usuario (mensajes)
chat.admin                         → privado solo admin
chat.conversation.{conversationId} → presencia: participantes + admin con intervencion
```

### 11.6 Servicios y soporte

#### BillingCycleService
- `getSettings()` — obtiene o crea configuracion global
- `syncExpiredBookingsAndContracts()` — completa bookings cuya fecha paso
- `buildOpenPeriodPreview()` — preview de facturacion del periodo abierto
- `submitInvoicePayment()` — registra pago del proveedor
- `approveInvoice()` — admin aprueba pago
- `rejectInvoice()` — admin rechaza con razon
- `resolveNextClosureDate()` — calcula proximo cierre de ciclo
- `formatInvoice()` — formatea invoice para API response

#### NotificationDispatchService
- `dispatchToUser(User $recipient, string $type, array $payload)` — despacha a canales `database` y/o `mail`
- Deduplicacion por `dedupe_key + channel + recipient_key`
- Trazabilidad en `notification_deliveries`
- Envio de mail con template Blade `emails.notification`
- Flag `NOTIFICATIONS_MAIL_ENABLED` para habilitar/deshabilitar correos

#### NotificationTypes (constantes)
```
welcome, service_request_created, contract_approved, review_requested,
review_received, provider_role_activated, chat_message_received,
chat_intervention_requested, billing_invoice_generated,
billing_payment_submitted, billing_payment_approved,
billing_payment_rejected, billing_account_suspended
```

### 11.7 Tests existentes

| Archivo | Suite | Descripcion |
|---|---|---|
| ApiPhaseOneSmokeTest.php | Feature | Smoke test endpoints principales |
| BillingLifecycleTest.php | Feature | Ciclo completo de facturacion |
| ChatApiTest.php | Feature | API de chat y mensajes |
| ExampleTest.php | Feature | Test de ejemplo base |
| FavoriteApiTest.php | Feature | CRUD de favoritos |
| GoogleAuthTest.php | Feature | Flujo OAuth Google |
| MarketplaceCityAvailabilityTest.php | Feature | Configuracion de ciudades |
| NotificationApiTest.php | Feature | API de notificaciones |
| NotificationGenerationTest.php | Feature | Generacion de notificaciones |
| ProviderAccessWorkflowTest.php | Feature | Flujo de solicitud/aprobacion proveedor |
| ExampleTest.php | Unit | Test unit base |

### 11.8 Como ejecutar la aplicacion

#### Setup inicial
```bash
cd laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
npm install
npm run build
```

#### Desarrollo (todo en paralelo via concurrently)
```bash
composer run dev
# Equivale a:
# php artisan serve
# php artisan queue:listen --tries=1 --timeout=0
# php artisan pail --timeout=0
# npm run dev
```

#### Solo artisan serve
```bash
php artisan serve
```

#### Migraciones
```bash
php artisan migrate              # aplicar pendientes
php artisan migrate:fresh        # borrar y recrear todo
php artisan migrate:rollback     # revertir ultimo batch
php artisan migrate:status       # ver estado
```

#### Seeders
```bash
php artisan db:seed                           # crea usuario test@example.com
LOAD_TEST_SEED=true php artisan db:seed       # incluye datos de carga de prueba
```

#### Tests
```bash
composer run test
# Equivale a:
php artisan config:clear && php artisan test

# Solo una suite
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Un archivo especifico
php artisan test tests/Feature/BillingLifecycleTest.php

# Con cobertura (requiere Xdebug o PCOV)
php artisan test --coverage
```

#### Queue worker
```bash
php artisan queue:listen --tries=1 --timeout=0
php artisan queue:work
```

#### Reverb (WebSockets)
```bash
php artisan reverb:start
php artisan reverb:start --host=0.0.0.0 --port=8080
```

#### Variables de entorno criticas
```
APP_KEY=           # Requerido (key:generate)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=marketplaceappforartists
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback

REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=

MAIL_MAILER=log    # smtp / postmark / resend / ses en produccion
NOTIFICATIONS_MAIL_ENABLED=true

FRONTEND_URL=http://127.0.0.1:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

ADMIN_DEFAULT_EMAIL=admin@memorialo.local
ADMIN_DEFAULT_PASSWORD=Admin12345!
```
