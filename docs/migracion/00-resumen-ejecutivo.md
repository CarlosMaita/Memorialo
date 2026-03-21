# Resumen Ejecutivo - Migracion a Laravel 13

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
