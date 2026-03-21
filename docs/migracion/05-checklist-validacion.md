# Checklist de Validacion

## A. Preparacion (Fase 0)
- [x] Laravel 13 inicializado en laravel/.
- [ ] Entorno local y staging configurados.
- [x] Conexion a DB validada.
- [x] Politica de autenticacion decidida.
- [x] Politica de storage de imagenes decidida.

## B. Paridad Funcional por Dominio
- [ ] Auth y sesion equivalentes al comportamiento actual.
- [ ] Usuarios y perfiles operativos.
- [ ] Providers y servicios operativos.
- [ ] Contratos operativos.
- [ ] Bookings operativos.
- [ ] Reviews operativas.
- [ ] Eventos operativos.
- [ ] Funciones admin operativas.

## C. Calidad y Seguridad
- [ ] Validaciones de entrada implementadas.
- [ ] Autorizacion por roles implementada.
- [ ] Logs y trazas de errores activos.
- [ ] Pruebas de integracion para rutas criticas.
- [ ] Cobertura minima acordada alcanzada.

## D. Migracion de Datos
- [ ] Inventario de datos origen completado.
- [ ] Mapeo KV -> relacional aprobado.
- [ ] ETL probado en staging.
- [ ] Reconciliacion de conteos validada.
- [ ] Muestreo funcional post-migracion validado.

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
