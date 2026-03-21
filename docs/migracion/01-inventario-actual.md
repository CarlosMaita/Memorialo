# Inventario Actual

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

## 4. Evidencias Tecnicas Relevantes
- readme.md: objetivo explicito de migrar desde Figma hacia Laravel.
- figma/src/utils/useSupabase.ts: capa de integracion frontend para auth y recursos de negocio.
- figma/src/supabase/functions/server/index.tsx: API actual (Hono) con rutas de auth/users/providers y otras.
- figma/src/supabase/functions/server/kv_store.tsx: almacenamiento key-value sobre Supabase.

## 5. Hallazgos Criticos para la Migracion
- No existe aun bootstrap de Laravel 13 en laravel/.
- El modelo KV no impone integridad referencial; requerira normalizacion a tablas relacionales.
- Hay mezcla de datos reales y fallback mock en frontend; se debe definir estrategia de corte.

## 6. Supuestos de Trabajo
- Version objetivo: Laravel 13.
- Se mantendra frontend actual durante la transicion.
- Se migrara de API Supabase Functions a API Laravel de forma incremental.

## 7. Informacion Pendiente por Confirmar
- Motor de base de datos definitivo en Laravel (MySQL/PostgreSQL).
- Politica final de autenticacion (Laravel Sanctum, Passport o JWT).
- Estrategia para archivos/imagenes (mantener bucket Supabase o mover a S3/local).
- Ventana de corte a produccion y criterios de rollback de negocio.
