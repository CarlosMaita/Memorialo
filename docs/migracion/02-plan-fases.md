# Plan de Fases - Migracion a Laravel 13

## Objetivo del Plan
Reducir riesgo operativo moviendo la logica backend a Laravel 13 por dominios, con pruebas y compatibilidad progresiva.

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

### Entregables
- Endpoints y servicios de dominio para contratos, bookings, reviews y eventos.
- Relaciones y constraints en DB.
- Casos de prueba de escenarios criticos.

### Criterio de salida
- Flujos end-to-end de contratacion y valoracion estables en staging.

## Fase 4 - Admin y Operacion
### Objetivos
- Migrar operaciones administrativas.
- Implementar trazabilidad de acciones criticas.

### Entregables
- Endpoints admin (gestion de usuarios, estados, moderacion).
- Auditoria basica de operaciones sensibles.

### Criterio de salida
- Panel admin funcional y validado por pruebas de aceptacion.

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
