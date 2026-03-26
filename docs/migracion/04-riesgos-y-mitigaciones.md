# Riesgos y Mitigaciones

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
