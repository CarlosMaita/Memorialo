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
