# Riesgos y Mitigaciones

> **ACTUALIZACION — 2025-06 (re-inventario completo):**
> Los riesgos 1 y 2 (falta de baseline y modelo KV) ya estan **RESUELTOS**. El backend Laravel esta completamente implementado.
> Los riesgos 3–15 se mantienen para documentacion historica y como base de analisis de los pendientes actuales.
> A partir del riesgo 16 se documentan riesgos identificados en el estado actual real del proyecto.

---

## Riesgo 1 - Falta de baseline Laravel
- Descripcion: No existe app Laravel inicializada en laravel/.
- Impacto: Alto.
- Probabilidad: Alta.
- Mitigacion: Ejecutar Fase 0 como prioridad y bloquear fases funcionales hasta tener baseline operativa.
- Senal de alerta: Retraso en bootstrap mayor a 2 dias.

## Riesgo 2 - Modelo KV a Relacional
- Descripcion: La persistencia actual en KV puede contener estructura heterogenea.
- Impacto: Alto.
- Probabilidad: Alta.
- Mitigacion: Inventario de claves, tipado por dominio y pruebas de conversion antes de ETL final.
- Senal de alerta: Registros sin campos minimos o relaciones ambiguas.

## Riesgo 3 - Regresiones funcionales en frontend
- Descripcion: El frontend depende de contratos API actuales y flujos con fallback.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Capa de compatibilidad temporal y pruebas E2E por modulo.
- Senal de alerta: Errores de contrato en auth, bookings o reviews.

## Riesgo 4 - Estrategia de autenticacion no definida
- Descripcion: Sin definicion temprana de Sanctum/Passport/JWT puede haber retrabajo.
- Impacto: Medio.
- Probabilidad: Media.
- Mitigacion: Tomar decision en Fase 0 y documentar convenciones de tokens.
- Senal de alerta: Cambios repetidos en middleware o clientes de auth.

## Riesgo 5 - Datos historicos incompletos
- Descripcion: Migracion de datos puede perder trazabilidad si no se valida por lotes.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: ETL por ventanas, reconciliacion y muestreo funcional por entidad.
- Senal de alerta: Diferencias de conteo entre origen y destino.

## Riesgo 6 - Corte sin rollback operativo
- Descripcion: Cutover directo sin plan de reversa aumenta riesgo de indisponibilidad.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Runbook de rollback y punto de restauracion verificado antes de corte.
- Senal de alerta: Ausencia de ensayo de rollback en staging.

## Riesgo 7 - Dependencias de infraestructura sin cerrar
- Descripcion: No definir hosting, colas, cache y observabilidad desde el inicio.
- Impacto: Medio.
- Probabilidad: Media.
- Mitigacion: Checklist de infraestructura en Fase 0 con responsables y fechas.
- Senal de alerta: Bloqueos recurrentes en deploy o performance.

## Riesgo 8 - Implementacion sin principios SOLID
- Descripcion: Construir endpoints y servicios sin separacion clara de responsabilidades aumenta acoplamiento y dificulta evolucion por fases.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Definir SOLID como estandar obligatorio, revisar arquitectura por lote y exigir evidencia en revisiones tecnicas.
- Senal de alerta: Controladores monoliticos, reglas de negocio duplicadas y cambios con efectos colaterales frecuentes.

## Riesgo 9 - Duplicidad de notificaciones
- Descripcion: Reintentos de eventos o doble disparo desde frontend/backend puede generar correos y avisos duplicados.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Usar `dedupe_key`, listeners idempotentes y disparo solo desde backend Laravel.
- Senal de alerta: Usuarios reportan multiples correos para una misma accion.

## Riesgo 10 - Acoplamiento del correo al flujo transaccional
- Descripcion: Enviar correos de forma sincrona desde request principal puede degradar tiempos de respuesta o provocar fallas parciales.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Mover envio a colas/listeners asincronos y registrar estado de entrega separadamente.
- Senal de alerta: Picos de latencia en signup, bookings o contratos.

## Riesgo 11 - Bandeja in-app inconsistente con el correo
- Descripcion: Si correo y notificacion in-app se disparan por caminos distintos, el usuario puede ver estados divergentes.
- Impacto: Medio.
- Probabilidad: Media.
- Mitigacion: Emitir un unico evento de dominio y resolver canales desde una capa comun de notificacion.
- Senal de alerta: Correo enviado sin registro en bandeja o viceversa.

## Riesgo 12 - Falta de retencion y limpieza
- Descripcion: La tabla de notificaciones puede crecer sin politica de archivo o expiracion.
- Impacto: Medio.
- Probabilidad: Media.
- Mitigacion: Definir retention policy y tarea programada de limpieza/archivado.
- Senal de alerta: crecimiento anomalo de tabla `notifications` y consultas lentas en header.

## Riesgo 13 - Persistencia insuficiente para auditoria de correo
- Descripcion: Si se usa solo `notifications`, no habra trazabilidad clara de envios, fallos, proveedor, reintentos ni deduplicacion operativa.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Mantener tabla complementaria `notification_deliveries` desde N1 y documentar la `dedupe_key` por caso de negocio.
- Senal de alerta: No se puede responder si un correo fue enviado, fallo o se duplico para un usuario especifico.

## Riesgo 14 - Fuga de datos por ownership deficiente en N2
- Descripcion: Un endpoint de bandeja mal filtrado puede devolver notificaciones de terceros.
- Impacto: Alto.
- Probabilidad: Media.
- Mitigacion: Forzar scope por `auth()->id()` en todas las consultas y cubrir con pruebas de autorizacion negativas.
- Senal de alerta: Usuario visualiza contenido de otro perfil al abrir dropdown o al marcar como leido.

## Riesgo 15 - Inconsistencia de contador no leido
- Descripcion: `unread-count` puede desalinearse frente al listado por condiciones de carrera o cache agresivo.
- Impacto: Medio.
- Probabilidad: Media.
- Mitigacion: Calcular sobre fuente de verdad (`read_at IS NULL`), invalidar cache en `read/read-all` y validar idempotencia.
- Senal de alerta: Badge en header muestra un numero distinto al listado de no leidas.

---

## Riesgos identificados en estado actual real (2025-06)

## Riesgo 16 - Ausencia de Policies/Gates formales (ACTIVO)
- Descripcion: La autorizacion esta implementada de forma inline en cada controlador (checks manuales de `role`, `user_id`, ownership). No existen Laravel Policies ni Gates.
- Impacto: Alto — un refactor de logica de roles puede quedar inconsistente entre endpoints.
- Probabilidad: Alta en proyectos en crecimiento.
- Mitigacion: Crear Policies para las entidades criticas (Provider, Booking, Contract, BillingInvoice) e integrar con middleware authorize.
- Senal de alerta: Nueva regla de negocio aplicada en un controlador pero omitida en otro para la misma entidad.
- Estado: ABIERTO.

## Riesgo 17 - Validaciones inline en controladores (ACTIVO)
- Descripcion: Toda la validacion de inputs vive directamente en los metodos de controlador. Los controladores BookingController y ContractController tienen bloques de validacion muy extensos (140+ lineas de reglas).
- Impacto: Medio — baja legibilidad y mayor superficie de error al actualizar validaciones.
- Probabilidad: Media.
- Mitigacion: Extraer a Form Requests dedicados por operacion. Priorizar BookingController y ContractController.
- Senal de alerta: Reglas duplicadas entre metodos `store` y `update` dentro del mismo controlador.
- Estado: ABIERTO.

## Riesgo 18 - Sin soft deletes en entidades criticas (ACTIVO)
- Descripcion: Booking, Contract, Service y Review usan hard delete. El AdminController elimina usuarios con cascade manual en Booking/Contract/Service/Provider.
- Impacto: Alto — eliminacion accidental o por mal uso produce perdida de datos de negocio.
- Probabilidad: Media.
- Mitigacion: Agregar SoftDeletes a al menos Booking, Contract y Service. Auditar delete cascade en AdminController.
- Senal de alerta: Datos de contratos o bookings irrecuperables tras operacion de admin.
- Estado: ABIERTO.

## Riesgo 19 - Sin rate limiting en endpoints de autenticacion (ACTIVO)
- Descripcion: `POST /api/auth/login` y `POST /api/auth/register` no tienen throttle declarado en rutas. Laravel tiene un throttle por defecto en `api` middleware pero debe verificarse su configuracion.
- Impacto: Alto — vulnerabilidad a ataques de fuerza bruta.
- Probabilidad: Media.
- Mitigacion: Agregar `throttle:5,1` (5 intentos por minuto) en rutas de autenticacion. Verificar configuracion del middleware api en bootstrap/app.php.
- Senal de alerta: Intentos de login masivos no bloqueados en logs.
- Estado: ABIERTO - requiere verificacion.

## Riesgo 20 - PKs string sin formato UUID validado (ACTIVO)
- Descripcion: Booking, Contract y Event usan PK string libre. El backend acepta el `id` del cliente sin validar formato UUID. Se generan IDs como `booking-{timestamp}` si el cliente no envia el campo.
- Impacto: Medio — inconsistencia de formato entre registros puede dificultar busquedas e indexes.
- Probabilidad: Alta — ya ocurre en la implementacion actual.
- Mitigacion: Forzar generacion de UUID en backend ignorando el campo `id` del cliente, o validar formato UUID cuando se recibe.
- Senal de alerta: PKs en base de datos con formatos mezclados (uuid vs booking-timestamp).
- Estado: ABIERTO.

## Riesgo 21 - Correo enviado sincronamente en request principal (PARCIALMENTE ACTIVO)
- Descripcion: NotificationDispatchService envia correos de forma sincrona via `Mail::send()` dentro del request HTTP. Si el servidor SMTP tiene latencia, el response al cliente se demora o falla.
- Impacto: Alto en produccion con volumen real.
- Probabilidad: Alta si se habilita SMTP real.
- Mitigacion: Mover envio de mail a Jobs en cola (`Mail::queue()` o Notification con `ShouldQueue`). Queue ya esta configurado con driver database.
- Senal de alerta: Endpoints de booking, contrato o registro lentos cuando hay actividad de correo.
- Estado: ACTIVO — `Mail::send()` es sincrono actualmente.

## Riesgo 22 - Sin cobertura de tests para dominio de billing y chat (ACTIVO)
- Descripcion: Aunque existen `BillingLifecycleTest` y `ChatApiTest`, la cobertura del ciclo completo de BillingCycleService (suspension, cierre de periodo, recalculo) no esta confirmada como completa.
- Impacto: Medio — regressions en logica de facturacion no detectadas.
- Probabilidad: Media.
- Mitigacion: Ampliar BillingLifecycleTest para cubrir: invoice generado, pago submitido, aprobado y rechazado. Verificar cobertura de ChatApiTest para intervencion admin y expiracion de conversacion.
- Senal de alerta: Bug en calculo de comisiones detectado en produccion.
- Estado: ABIERTO.

## Riesgo 23 - Configuracion de Reverb en produccion no documentada operativamente (ACTIVO)
- Descripcion: Reverb require proceso persistente en produccion. Sin Supervisor o equivalente el proceso cae y el chat queda inoperativo.
- Impacto: Alto en funcionalidad de chat en tiempo real.
- Probabilidad: Alta si no hay proceso manager configurado.
- Mitigacion: Ver docs/migracion/07-guia-supervisor-produccion.md (ya existe). Verificar que el runbook incluye comando de reverb en la configuracion de Supervisor.
- Senal de alerta: Mensajes de chat no llegan en tiempo real; clientes reportan delay.
- Estado: Documentado en 07. Verificar implementacion en produccion.
