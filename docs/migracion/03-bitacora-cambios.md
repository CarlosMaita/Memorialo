# Bitacora de Cambios de Migracion

## Formato de Registro
- Fecha:
- Fase:
- Responsable:
- Cambio ejecutado:
- Motivo:
- Evidencia:
- Riesgo generado/mitigado:
- Accion siguiente:

## Entradas

### 2026-03-20
- Fase: Inicio
- Responsable: Copilot + Carlo
- Cambio ejecutado: Creacion de base documental de migracion en docs/migracion.
- Motivo: Establecer trazabilidad y plan de trabajo para migracion a Laravel 13.
- Evidencia: Archivos 00 a 05 creados.
- Riesgo generado/mitigado: Mitigado riesgo de iniciar migracion sin control documental.
- Accion siguiente: Confirmar decisiones tecnicas pendientes (DB, auth, storage, despliegue).

### 2026-03-20
- Fase: 0.3 y 0.4 (arranque implementacion)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Bootstrap de Laravel 13 en laravel/, instalacion de Sanctum, habilitacion de rutas API y endpoint de health.
- Motivo: Iniciar implementacion tecnica con base API para transicion endpoint por endpoint.
- Evidencia: laravel/ creado, composer.lock actualizado con laravel/sanctum, rutas api/health y api/user activas.
- Riesgo generado/mitigado: Mitigado riesgo de bloqueo inicial del backend; se detectaron y resolvieron bloqueos de entorno PHP (openssl/fileinfo).
- Accion siguiente: Configurar credenciales MySQL reales, ejecutar migraciones y crear primeros endpoints de auth/session con paridad funcional.

### 2026-03-20
- Fase: 0.6 (endpoints piloto)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de endpoints auth iniciales en Laravel (register, login, me, logout) y validacion de rutas API.
- Motivo: Iniciar paridad funcional minima para reemplazo progresivo de auth actual.
- Evidencia: routes/api.php con prefijo /api/auth y controlador AuthController creado.
- Riesgo generado/mitigado: Mitigado riesgo de no tener contrato auth base para integrar frontend por endpoint.
- Accion siguiente: Conectar frontend al endpoint /api/health y luego a /api/auth/* con pruebas controladas.

### 2026-03-20
- Fase: 0 (estabilizacion entorno local)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Habilitacion de extensiones PHP (openssl, fileinfo, pdo_mysql, mbstring, curl) y ejecucion exitosa de migraciones MySQL.
- Motivo: Resolver bloqueos de entorno que impedian bootstrap y despliegue local de API.
- Evidencia: migraciones completadas (users, cache, jobs, personal_access_tokens).
- Riesgo generado/mitigado: Mitigado riesgo de arranque fallido por incompatibilidades de entorno.
- Accion siguiente: Definir provider/service/domain models para providers y services (Fase 1).

### 2026-03-20
- Fase: Gobierno tecnico transversal
- Responsable: Copilot + Carlo
- Cambio ejecutado: Incorporacion formal del uso de principios SOLID como criterio obligatorio de implementacion durante toda la migracion.
- Motivo: Reducir acoplamiento, mejorar mantenibilidad y minimizar riesgo de regresiones en la transicion a Laravel 13.
- Evidencia: Actualizacion de resumen ejecutivo, plan de fases y checklist de validacion.
- Riesgo generado/mitigado: Mitigado riesgo de crecimiento desordenado del codigo durante la migracion incremental.
- Accion siguiente: Verificar cumplimiento SOLID en cada lote de endpoints y modelos que se implemente.

### 2026-03-21
- Fase: 1 (paridad de contratos API)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Normalizacion de compatibilidad camelCase/snake_case en ServiceController para entrada y salida; consolidacion de formato de respuesta para servicios.
- Motivo: Evitar quiebres de frontend durante cutover endpoint por endpoint por diferencias de naming en payloads.
- Evidencia: app/Http/Controllers/ServiceController.php actualizado con mapeos providerId/reviews y salida userId/providerId/isActive/createdAt.
- Riesgo generado/mitigado: Mitigado riesgo de regresion funcional por contratos de API incompatibles.
- Accion siguiente: Probar integracion frontend de endpoints de servicios y completar pruebas de humo de auth/users/providers/services.

### 2026-03-21
- Fase: 1 (validacion tecnica)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Verificacion de estado del backend con revision de errores y validacion de rutas API activas.
- Motivo: Confirmar estabilidad base tras cambios de compatibilidad en controladores.
- Evidencia: get_errors sin errores en laravel/ y php artisan route:list --path=api con 16 rutas activas.
- Riesgo generado/mitigado: Mitigado riesgo de continuar implementacion sobre un estado inconsistente.
- Accion siguiente: Iniciar conexion gradual del frontend a endpoints Laravel priorizando health y auth.

### 2026-03-21
- Fase: 1 (testing y estabilizacion)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Habilitacion de extensiones sqlite en PHP CLI, generacion de APP_KEY y creacion de suite de pruebas de humo API (health/auth/providers/services).
- Motivo: Asegurar validacion automatizada reproducible del contrato API antes de continuar el cutover con frontend.
- Evidencia: tests/Feature/ApiPhaseOneSmokeTest.php y ejecucion exitosa de php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest (3 pruebas, 42 aserciones).
- Riesgo generado/mitigado: Mitigado riesgo de regresiones silenciosas en endpoints base durante migracion incremental.
- Accion siguiente: Conectar frontend a Laravel para health/auth y ejecutar smoke E2E de flujo provider/service.

### 2026-03-21
- Fase: 1 (cutover frontend incremental)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de enrutamiento hibrido en frontend para dirigir endpoints migrados (/health, /auth, /users, /providers, /services) a Laravel y mantener dominios restantes en Supabase.
- Motivo: Aplicar estrategia endpoint-by-endpoint sin romper modulos aun no migrados.
- Evidencia: figma/src/utils/supabase/client.ts con VITE_BACKEND_MODE y ruteo por prefijos; figma/src/utils/useSupabase.ts con sesion/token Laravel; figma/.env.example agregado.
- Riesgo generado/mitigado: Mitigado riesgo de big-bang migration en frontend y de indisponibilidad de dominios pendientes.
- Accion siguiente: Crear entorno figma/.env con VITE_BACKEND_MODE=laravel y ejecutar smoke manual de registro/login/provider/service.

### 2026-03-21
- Fase: 1 (estabilizacion frontend)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Activacion de figma/.env en modo laravel, reparacion de dependencias frontend (vite/clsx/tailwind-merge) y compilacion exitosa del frontend principal.
- Motivo: Confirmar que el cutover hibrido compila y es ejecutable antes de pruebas funcionales manuales.
- Evidencia: npm.cmd run build exitoso en figma/ (vite v6.3.5); backend Laravel revalidado con php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest (3 pruebas en verde, 42 aserciones).
- Riesgo generado/mitigado: Mitigado riesgo de bloqueo operativo por build fallido en frontend durante la migracion.
- Accion siguiente: Ejecutar smoke manual end-to-end en UI (signup/login/provider/service) y registrar hallazgos.

### 2026-03-21
- Fase: 1 (higiene de cambios)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Limpieza de artefactos locales de frontend para control de versiones (build/ y .env local ignorados desde figma/.gitignore).
- Motivo: Evitar ruido y riesgo de commitear archivos generados o sensibles durante la migracion.
- Evidencia: figma/.gitignore actualizado con build/ y .env.
- Riesgo generado/mitigado: Mitigado riesgo de exponer configuracion local y de ensuciar historial con artefactos de compilacion.
- Accion siguiente: Ejecutar smoke manual de UI en modo Laravel y cerrar item pendiente del checklist de Fase 1.

### 2026-03-21
- Fase: 1 (fortalecimiento de smoke backend)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Expansion de la suite ApiPhaseOneSmokeTest para cubrir login/logout, update de user, lectura/update de provider, listado de services y delete de service dentro del dominio migrado.
- Motivo: Reducir dependencia de validacion manual para la capa Laravel ya conectada al frontend hibrido y detectar regresiones de contrato antes del smoke UI.
- Evidencia: php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde (3 pruebas, 77 aserciones).
- Riesgo generado/mitigado: Mitigado riesgo de regresiones no detectadas en auth/users/providers/services pese a que el smoke manual UI siga pendiente.
- Accion siguiente: Ejecutar smoke manual frontend -> Laravel y validar UX real de signup/login/provider/service con la app corriendo en modo laravel.

### 2026-03-21
- Fase: 1 (migracion dominio reviews)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de Reviews en Laravel (migracion, modelo, controlador, rutas GET/POST), sincronizacion de agregados de rating/reviews_count en services y activacion de ruteo hibrido frontend para /reviews.
- Motivo: Continuar cutover endpoint-by-endpoint migrando un dominio funcional usado por la UI y reduciendo dependencia de Supabase.
- Evidencia: php artisan route:list --path=api muestra 18 rutas incluyendo api/reviews; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde (3 pruebas, 90 aserciones); npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de inconsistencias de rating/reseñas entre frontend y backend al consolidar write/read de reviews en Laravel.
- Accion siguiente: Ejecutar smoke manual UI en modo Laravel para validar flujo completo de reseñas (create/list) junto con auth/users/providers/services.

### 2026-03-21
- Fase: 1 (migracion dominio contracts)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de Contracts en Laravel (migracion, modelo, controlador, rutas GET/POST/PUT), normalizacion camelCase/snake_case en payloads y activacion de ruteo hibrido frontend para /contracts.
- Motivo: Continuar cutover endpoint-by-endpoint migrando el dominio de contratos usado por dashboards y firma de acuerdos.
- Evidencia: php artisan route:list --path=api muestra 21 rutas incluyendo api/contracts; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde (contracts create/list/update + side effect); npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de inconsistencia de estado de contratos al centralizar en Laravel y preservar compatibilidad de naming para la UI.
- Accion siguiente: Migrar dominio bookings en Laravel para cerrar el flujo operativo completo posterior a firma de contrato.

### 2026-03-21
- Fase: 1 (migracion dominio bookings)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de Bookings en Laravel (migracion, modelo, controlador, rutas GET/POST/PUT), normalizacion camelCase/snake_case en payloads y activacion de ruteo hibrido frontend para /bookings.
- Motivo: Continuar cutover endpoint-by-endpoint y cubrir el flujo operativo posterior a la firma de contratos en dashboards de cliente/proveedor.
- Evidencia: php artisan route:list --path=api muestra 24 rutas incluyendo api/bookings; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde con cobertura bookings create/list/update; npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de divergencia de estado de reservas entre UI y backend al centralizar operaciones de bookings en Laravel.
- Accion siguiente: Migrar dominio events en Laravel para completar gestion de agenda y asignacion contrato-evento en modo hibrido.

### 2026-03-21
- Fase: 1 (migracion dominio events)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de Events en Laravel (migracion, modelo, controlador, rutas GET/POST/PUT/DELETE), control de ownership en update/delete y normalizacion camelCase/snake_case en payloads.
- Motivo: Completar la gestion de agenda/eventos en el backend Laravel y reducir dependencia de Supabase en el flujo de cliente.
- Evidencia: php artisan route:list --path=api muestra 28 rutas incluyendo api/events; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde con cobertura events create/list/update/delete; npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de inconsistencias al asignar contratos a eventos y al editar/archivar agenda desde dashboards.
- Accion siguiente: Migrar endpoints de billing/admin para cerrar dominios restantes del modo hibrido.

### 2026-03-21
- Fase: 1 (migracion dominio billing)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de Billing en Laravel (migracion de billing_invoices, modelo y controlador), rutas /billing/config, /billing/provider/:id, /billing/provider/:id/pay y /billing/admin/overview; integracion de frontend para consumir base Laravel en modo hibrido.
- Motivo: Consolidar facturacion y pagos de comisiones en Laravel para eliminar dependencia del endpoint legacy de Supabase en el dashboard de proveedor.
- Evidencia: php artisan route:list --path=api muestra 32 rutas incluyendo api/billing/*; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde con cobertura billing; npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de discrepancia entre facturacion visual y backend al centralizar calculo mensual y registro de pagos en una capa unica.
- Accion siguiente: Migrar endpoints admin restantes (/admin/users, verify/ban/unban providers y users) para cerrar Fase 1 de dominios hibridos.

### 2026-03-21
- Fase: 1 (migracion dominio admin)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Implementacion de endpoints admin en Laravel para moderacion de providers/users (listado, verify/ban/unban de providers, ban/unban/archive/unarchive/delete de users) con control de rol admin y paridad de payload para frontend.
- Motivo: Cerrar la capa de backoffice en Laravel y completar los dominios operativos del modo hibrido de Fase 1.
- Evidencia: php artisan route:list --path=api muestra 41 rutas incluyendo api/admin/*; php artisan test --testsuite=Feature --filter=ApiPhaseOneSmokeTest en verde con cobertura admin; npm run build exitoso en figma.
- Riesgo generado/mitigado: Mitigado riesgo de desalineacion entre tablero admin y backend al centralizar acciones de moderacion en Laravel.
- Accion siguiente: Ejecutar smoke manual E2E del panel admin y facturacion en modo Laravel para validar UX/permiso real con cuentas de prueba.

### 2026-03-21
- Fase: 1 (ajustes UI marketplace)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Refactor visual de cards de resultados en frontend con layout estilo YouTube en desktop: grid a 4 columnas, miniatura rectangular (aspect-video), simplificacion de contenido (solo nombre + rating/reseñas) y ajuste fino de espaciados/alineacion del titulo.
- Motivo: Mejorar legibilidad, consistencia visual y densidad de informacion del listado de servicios sin alterar flujo funcional.
- Evidencia: figma/src/components/ArtistCard.tsx y figma/src/App.tsx actualizados; npm run build en verde.
- Riesgo generado/mitigado: Mitigado riesgo de tarjetas desalineadas y ruido visual en desktop; riesgo residual menor de ajustes CSS en breakpoints especificos.
- Accion siguiente: Ejecutar QA visual desktop/mobile para verificar alturas homogéneas de cards y comportamiento responsive.

### 2026-03-21
- Fase: 1 (planificacion modulo notificaciones)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Documentacion del proceso de implementacion del modulo de notificaciones y correo transaccional para Laravel, incluyendo inventario actual, lotes de ejecucion, riesgos, checklist de validacion y casos de negocio obligatorios.
- Motivo: Preparar una ejecucion incremental y segura del sistema de notificaciones sin introducir cambios grandes sin rollback documentado.
- Evidencia: Actualizacion de 00-resumen-ejecutivo, 01-inventario-actual, 02-plan-fases, 04-riesgos-y-mitigaciones y 05-checklist-validacion.
- Riesgo generado/mitigado: Mitigado riesgo de implementar notificaciones de forma ad-hoc y acoplada al frontend; riesgo residual de definicion pendiente de proveedor de correo y estrategia de colas.
- Accion siguiente: Ejecutar Lote N1 (modelo/persistencia) y Lote N2 (bandeja/header) con feature flags y rollback por lote.

### 2026-03-21
- Fase: 1 (ejecucion documental Lote N1)
- Responsable: Copilot + Carlo
- Cambio ejecutado: Definicion del modelo de persistencia objetivo para notificaciones mediante esquema hibrido con `notifications` para bandeja in-app y `notification_deliveries` para trazabilidad de entrega, errores, reintentos e idempotencia.
- Motivo: Preparar implementacion segura del sistema de notificaciones desacoplando UX de header y operacion de correo transaccional.
- Evidencia: Se agregaron en la documentacion tipos canonicos, matriz evento -> canal, payload canonico de bandeja, regla de `dedupe_key` y criterio de salida N1.
- Riesgo generado/mitigado: Mitigado riesgo de no poder auditar correos o controlar duplicados si se usaba solo la tabla nativa de Laravel Notifications.
- Accion siguiente: Avanzar a N2 con contrato API para listar notificaciones, obtener conteo no leido y marcar como leidas.
