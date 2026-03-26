# Plan de Fases - Migracion a Laravel 13

## Objetivo del Plan
Reducir riesgo operativo moviendo la logica backend a Laravel 13 por dominios, con pruebas y compatibilidad progresiva.

## Estandar Transversal de Implementacion
- Todo desarrollo de backend durante la migracion debe respetar principios SOLID.
- Cada lote debe evidenciar separacion de responsabilidades, extensibilidad sin modificar comportamiento existente y dependencias hacia abstracciones cuando aplique.
- Las revisiones de codigo y pruebas deben validar cumplimiento de este estandar antes de cerrar cada fase.

## Fase 0 - Preparacion y Bootstrap
### Objetivos
- Inicializar proyecto Laravel 13 en laravel/.
- Definir estandares de arquitectura, entornos y convenciones.
- Preparar CI minima y pipeline de calidad.

### Entregables
- Estructura base Laravel 13.
- Archivo de arquitectura tecnica inicial.
- Entornos local/staging documentados.

### Criterio de salida
- API de health en Laravel operativa.
- Conexion a DB de destino validada.

## Fase 1 - Modelo de Datos y Auth Base
### Objetivos
- Disenar esquema relacional inicial.
- Implementar autenticacion y usuarios base.
- Definir tabla-equivalencia desde KV.

### Entregables
- Migraciones Laravel para users y tablas nucleares.
- Seed admin inicial.
- Endpoints auth/session equivalentes.

### Criterio de salida
- Flujo login/signup funcional sobre Laravel en entorno de prueba.

## Fase 2 - Providers y Servicios
### Objetivos
- Migrar proveedores y catalogo de servicios.
- Implementar CRUD con validaciones y autorizacion.

### Entregables
- Endpoints providers/services en Laravel.
- Politicas de acceso por rol.
- Pruebas de integracion de CRUD principal.

### Criterio de salida
- Frontend puede leer/crear/editar providers y services consumiendo Laravel.

## Fase 3 - Contratos, Bookings, Reviews, Eventos
### Objetivos
- Migrar modulos transaccionales principales.
- Preservar reglas de negocio y consistencia entre entidades.
- Preparar eventos de dominio que disparen notificaciones de negocio.

### Entregables
- Endpoints y servicios de dominio para contratos, bookings, reviews y eventos.
- Relaciones y constraints en DB.
- Casos de prueba de escenarios criticos.
- Puntos de emision de eventos para: solicitud de servicio, aprobacion de contrato, servicio completado y review creada.

### Criterio de salida
- Flujos end-to-end de contratacion y valoracion estables en staging.

## Fase 4 - Admin y Operacion
### Objetivos
- Migrar operaciones administrativas.
- Implementar trazabilidad de acciones criticas.
- Implementar sistema de notificaciones in-app y correo transaccional sobre Laravel.

### Entregables
- Endpoints admin (gestion de usuarios, estados, moderacion).
- Auditoria basica de operaciones sensibles.
- Tabla/canal de notificaciones y endpoint de bandeja para header.
- Plantillas de correo para onboarding y flujos operativos.
- Estrategia de colas/reintentos documentada.

### Criterio de salida
- Panel admin funcional y validado por pruebas de aceptacion.
- Header frontend con badge de no leidas y bandeja operativa; correos criticos enviados de forma asincrona y verificable.

## Lote Especifico - Notificaciones
### Lote N1 - Modelo y persistencia
- Crear modelo de notificacion de aplicacion apoyado en tabla `notifications` de Laravel o tabla dedicada si se requiere payload extendido.
- Definir tipos canonicos: `welcome`, `service_request_created`, `contract_approved`, `review_requested`, `review_received`, `provider_role_activated`.
- Definir campos minimos: destinatario, actor, tipo, titulo, cuerpo, payload, canal, estado, `read_at`, `sent_at`, `failed_at`, `dedupe_key`.
- Rollback: desactivar consumo frontend del endpoint y mantener envio legacy de correo si existiera.

#### Decision N1 adoptada
- Implementar modelo hibrido:
	- `notifications` para UX in-app.
	- `notification_deliveries` para auditoria y canales.

#### Entregables N1
- Diseno de tabla `notifications` como bandeja fuente para header.
- Diseno de tabla `notification_deliveries` para delivery por canal.
- Catalogo canonico de tipos de negocio.
- Regla formal de `dedupe_key` por evento.
- Definicion de flags operativas:
	- `NOTIFICATIONS_IN_APP_ENABLED`
	- `NOTIFICATIONS_MAIL_ENABLED`

#### Criterio de salida N1
- Persistencia objetivo documentada y lista para implementacion.
- Todos los casos de negocio tienen tipo canonico y canal asignado.
- Idempotencia definida por caso.
- Rollback por canal documentado.

#### Validacion N1
- Cada caso solicitado por negocio debe tener:
	- tipo canonico,
	- canal asociado,
	- entidad origen,
	- `dedupe_key` definida,
	- estrategia de lectura (`database`) o entrega (`mail`) clara.

### Lote N2 - Backend de lectura y estado
- Exponer endpoints Laravel para listar notificaciones, obtener conteo no leido y marcar como leidas.
- Reglas de autorizacion: cada usuario solo ve su bandeja.
- Validacion de salida: header puede pintar badge y dropdown sin mock.
- Rollback: volver a ocultar icono frontend y conservar persistencia sin consumo.

#### Decision N2 adoptada
- Definir contrato API bajo prefijo `/api/notifications` con cuatro operaciones:
	- `GET /api/notifications`
	- `GET /api/notifications/unread-count`
	- `PATCH /api/notifications/{id}/read`
	- `PATCH /api/notifications/read-all`

#### Entregables N2
- Contrato API documentado con payloads de respuesta y codigos de error.
- Reglas de ownership y autorizacion por usuario autenticado.
- Definicion de paginacion por cursor y limites de `limit`.
- Definicion de feature flags backend/frontend para activacion gradual.
- Estrategia de rollback sin perdida de historico N1.

#### Criterio de salida N2
- Header frontend puede construir badge y dropdown usando solo datos reales de API.
- Operaciones de lectura y marcado no exponen datos de otros usuarios.
- Marcado individual y masivo validan idempotencia.
- Contrato estable y versionable para evolucion de N4.

#### Validacion N2
- Pruebas de autorizacion:
	- usuario A no puede leer ni marcar notificaciones de usuario B.
- Pruebas de consistencia:
	- `unread-count` coincide con `read_at IS NULL` tras `read` y `read-all`.
- Pruebas de UX contract:
	- `items` incluye `isRead`, `createdAt`, `ctaUrl`, `type`, `title`, `body`.

### Lote N3 - Eventos de correo transaccional
- Conectar eventos de negocio a listeners/notifications Laravel para envio asincrono.
- Casos iniciales obligatorios:
	- Bienvenida tras registro.
	- Nueva solicitud de servicio para proveedor.
	- Contrato aprobado para usuario.
	- Solicitud de reseña al completar servicio.
	- Aviso de nueva reseña al proveedor.
	- Aviso al cambiar rol a proveedor.
- Rollback: desactivar listeners por feature flag y mantener solo notificacion in-app.

### Lote N4 - UX frontend header
- Agregar icono de campana para usuarios y proveedores.
- Mostrar badge con cantidad no leida.
- Dropdown/listado con acceso a historial reciente y marcado como leido.
- Validacion: estados vacio, cargando, error y no leidas.
- Rollback: ocultar icono por flag frontend sin afectar persistencia backend.

### Lote N5 - Observabilidad y operacion
- Registrar metricas de envio, errores por canal y reintentos.
- Definir runbook de reproceso manual para correos fallidos.
- Alinear retencion/cleanup de notificaciones antiguas.

## Fase 5 - Migracion de Datos y Cutover
### Objetivos
- Ejecutar migracion de datos de KV a relacional.
- Cambiar frontend a backend Laravel como origen principal.

### Entregables
- Scripts de extraccion/transformacion/carga (ETL).
- Runbook de cutover y rollback.
- Verificacion post-corte.

### Criterio de salida
- Produccion en Laravel 13 sin regresiones bloqueantes.

## Fase 6 - Estabilizacion y Cierre
### Objetivos
- Corregir incidencias residuales.
- Cerrar deuda tecnica de la migracion.

### Entregables
- Informe de cierre.
- Lista de mejoras post-migracion priorizada.

### Criterio de salida
- KPIs de estabilidad y operacion dentro de umbrales acordados.

## Backlog Inicial Priorizado
1. Inicializar Laravel 13 en laravel/.
2. Definir diagrama entidad-relacion para reemplazar KV.
3. Catalogar todos los endpoints actuales de Supabase Functions.
4. Mapear cada endpoint actual a su equivalente en Laravel.
5. Definir estrategia de autenticacion y tokens.
6. Diseñar plan de migracion de datos por lotes.

## Dependencias Externas
- Acceso al proyecto Supabase y datos existentes.
- Credenciales de entorno staging/produccion.
- Decisiones de infraestructura para despliegue Laravel 13.
- Credenciales del proveedor de correo transaccional elegido.
- Definicion de estrategia de colas (database/redis/sqs) para desacoplar envio.
