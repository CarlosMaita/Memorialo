# Checklist de Validacion

> **ACTUALIZACION — 2025-06 (re-inventario completo):**
> El checklist original fue escrito durante la planificacion de migracion. Se actualiza a continuacion con el estado real verificado del proyecto.

---

## A. Preparacion (Fase 0)
- [x] Laravel 13 inicializado en laravel/.
- [ ] Entorno local y staging configurados.
- [x] Conexion a DB validada.
- [x] Politica de autenticacion decidida.
- [x] Politica de storage de imagenes decidida.
- [x] Rutas API base validadas (41 rutas activas).

## B. Paridad Funcional por Dominio
- [ ] Auth y sesion equivalentes al comportamiento actual.
- [ ] Usuarios y perfiles operativos.
- [ ] Providers y servicios operativos.
- [x] Contratos operativos (GET/POST/PUT en Laravel con compatibilidad camelCase/snake_case).
- [x] Bookings operativos (GET/POST/PUT en Laravel con compatibilidad camelCase/snake_case).
- [x] Reviews operativas (GET/POST en Laravel con agregados de rating sincronizados).
- [x] Eventos operativos (GET/POST/PUT/DELETE en Laravel con ownership check).
- [x] Funciones admin operativas (api/admin/* para moderacion de providers/users en Laravel).
- [ ] Notificaciones in-app operativas para usuarios y proveedores.
- [ ] Correos transaccionales operativos para onboarding y eventos criticos.

## C. Calidad y Seguridad
- [ ] Implementacion alineada con principios SOLID.
- [x] Validaciones de entrada implementadas (Auth/User/Provider/Service Controllers).
- [ ] Autorizacion por roles implementada.
- [ ] Logs y trazas de errores activos.
- [x] Pruebas de integracion para rutas criticas (suite Feature smoke ampliada para health/auth/users/providers/services/contracts/bookings/events/billing/admin/reviews).
- [ ] Cobertura minima acordada alcanzada.
- [ ] Idempotencia de notificaciones validada (sin duplicados por reintento).
- [ ] Cola de correos validada sin bloquear request principal.

## Estado Actual Fase 1
- [x] Paridad de naming camelCase/snake_case implementada en controladores base (Auth, User, Provider, Service).
- [x] Frontend con ruteo hibrido configurado para cutover endpoint-by-endpoint.
- [x] Build de frontend principal (figma) validado tras configuracion hibrida.
- [ ] Pruebas de humo frontend -> Laravel completadas para health/auth/users/providers/services/contracts/bookings/events/billing/admin/reviews.

## D. Migracion de Datos
- [ ] Inventario de datos origen completado.
- [ ] Mapeo KV -> relacional aprobado.
- [ ] ETL probado en staging.
- [ ] Reconciliacion de conteos validada.
- [ ] Muestreo funcional post-migracion validado.

## D2. Checklist Especifico de Notificaciones
- [x] Estructura objetivo documentada para `notifications` y `notification_deliveries`.
- [x] Estructura objetivo aprobada tecnicamente.
- [x] Tipos canonicos documentados (`welcome`, `service_request_created`, `contract_approved`, `review_requested`, `review_received`, `provider_role_activated`).
- [x] Matriz evento -> canal documentada.
- [x] Regla de `dedupe_key` documentada por caso de negocio.
- [x] Contrato API N2 documentado (`list`, `unread-count`, `read`, `read-all`).
- [x] Reglas de ownership y autorizacion N2 documentadas.
- [x] Regla de consistencia `unread-count` documentada.
- [x] Endpoint de bandeja para header implementado.
- [x] Endpoint para marcar leidas implementado.
- [ ] Badge de no leidas en header validado para usuario y proveedor.
- [ ] Correo de bienvenida validado tras signup.
- [ ] Correo al proveedor validado tras solicitud de servicio.
- [ ] Correo al usuario validado tras aprobacion de contrato.
- [ ] Notificacion al usuario validada al completar servicio (solicitud de reseña).
- [ ] Notificacion/correo al proveedor validado al recibir reseña.
- [ ] Notificacion al usuario validada al convertirse en proveedor.
- [ ] Plantillas de correo revisadas por contenido y tono.
- [x] Trazabilidad de `read_at`, `sent_at` y `failed_at` validada a nivel de modelo persistente y contrato backend.

## E. Cutover
- [ ] Runbook de cutover aprobado.
- [ ] Plan de rollback aprobado.
- [ ] Ventana de despliegue coordinada.
- [ ] Monitoreo post-corte activo.
- [ ] Criterios de exito post-corte verificados.

## F. Cierre
- [ ] Incidencias P0/P1 cerradas.
- [ ] Documentacion final actualizada.
- [ ] Lecciones aprendidas registradas.
- [ ] Backlog post-migracion priorizado.

---

## G. Estado Real Verificado (Re-inventario 2025-06)

### G.1 Core Backend Laravel 13
- [x] Laravel 13 operativo en laravel/ con PHP ^8.3
- [x] MySQL configurado como base de datos principal
- [x] 32 migraciones definidas y ordenadas correctamente
- [x] 18 modelos Eloquent implementados con relaciones
- [x] 17 controladores REST implementados
- [x] Autenticacion via Laravel Sanctum ^4.0
- [x] OAuth Google via Laravel Socialite ^5.25
- [x] WebSockets en tiempo real via Laravel Reverb ^1.9
- [x] Queue configurado con driver database
- [x] Cache configurado con driver database

### G.2 Dominios Funcionales
- [x] Auth: register, login, logout, /me, Google OAuth
- [x] Users: show, update, provider-request
- [x] Providers: index, store, showByUser, update
- [x] Services: index, show, store, update, destroy
- [x] Bookings: index (con scopes y paginacion), store, update
- [x] Contracts: index (con scopes y paginacion), store, update + metadata legal enriquecida
- [x] Events: index, store, update, destroy
- [x] Reviews: index, store + agregado de rating en Service
- [x] Billing: config, providerBilling, pay, adminOverview, updateConfig, approvePayment, rejectPayment
- [x] BillingCycleService: ciclo mensual, preview, suspension, cierre automatico
- [x] Notifications: index, unreadCount, markRead, markAllRead
- [x] NotificationDispatchService: multi-canal (database + mail), dedupe, trazabilidad
- [x] 13 tipos de notificacion canonicos definidos
- [x] Chat: conversations, participants, messages, reads, attachments
- [x] Chat broadcast: canales privados por usuario y admin via Reverb
- [x] Favorites: index, store, destroy
- [x] Admin: users, providers, marketplace config, access control
- [x] InterestedProviders: store (publica, web route)

### G.3 Calidad y Arquitectura
- [x] Validacion de inputs implementada en todos los controladores
- [x] Normalizacion camelCase <-> snake_case implementada (Booking, Contract, Provider)
- [x] Deduplicacion de notificaciones implementada via dedupe_key
- [x] Trazabilidad de notificaciones en notification_deliveries
- [x] 10 suites de test Feature implementadas
- [ ] Policies/Gates formales — PENDIENTE (ver Riesgo 16)
- [ ] Form Requests dedicados — PENDIENTE (ver Riesgo 17)
- [ ] Soft deletes en entidades criticas — PENDIENTE (ver Riesgo 18)
- [ ] Rate limiting en endpoints de autenticacion — PENDIENTE verificacion (ver Riesgo 19)
- [ ] PKs UUID forzadas en backend — PENDIENTE (ver Riesgo 20)
- [ ] Correo asincrono en cola — PENDIENTE (ver Riesgo 21)
- [ ] Cobertura de tests ampliada para billing/chat — PENDIENTE (ver Riesgo 22)

### G.4 Proximos pasos recomendados (por prioridad)
1. **P1 — Seguridad**: Verificar y configurar rate limiting en auth routes
2. **P1 — Datos**: Agregar SoftDeletes a Booking, Contract, Service
3. **P2 — Arquitectura**: Extraer Form Requests en BookingController y ContractController
4. **P2 — Arquitectura**: Crear Policies para Provider, Booking, Contract
5. **P2 — Rendimiento**: Mover Mail::send() a jobs en cola
6. **P3 — Calidad**: Forzar UUID generado en backend para PKs de Booking/Contract/Event
7. **P3 — Calidad**: Ampliar cobertura de BillingLifecycleTest
8. **P3 — Operaciones**: Verificar configuracion de Supervisor para Reverb en produccion
