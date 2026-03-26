# Prueba de carga local (read-heavy)

Esta carpeta contiene un primer escenario de carga para detectar fallas bajo saturacion de informacion en endpoints criticos de lectura.

## 1) Preparar datos de carga

Desde `laravel/` (PowerShell):

```bash
$env:LOAD_TEST_SEED='1'; php artisan db:seed
```

Tambien puedes ajustar volumen con variables de entorno al vuelo:

```bash
$env:LOAD_TEST_SEED='1'; $env:LOAD_TEST_PROVIDERS='200'; $env:LOAD_TEST_CLIENTS='500'; $env:LOAD_TEST_SERVICES_PER_PROVIDER='25'; $env:LOAD_TEST_BOOKINGS='6000'; php artisan db:seed
```

Credenciales por defecto creadas por el seeder:

- Admin: `load.admin@memorialo.test` / `LoadTest123!`
- Provider: `load.provider.001@memorialo.test` / `LoadTest123!`
- Client: `load.client.001@memorialo.test` / `LoadTest123!`

## 2) Levantar la API

```bash
php artisan serve
```

## 3) Ejecutar carga con k6

Instala k6 localmente si aun no lo tienes.

Ejemplo base:

```bash
k6 run tests/load/read-heavy.js
```

Ejemplo con parametros de concurrencia y duracion:

```bash
$env:BASE_URL='http://127.0.0.1:8000'; $env:PUBLIC_VUS='80'; $env:ADMIN_VUS='15'; $env:PROVIDER_VUS='25'; $env:DURATION='6m'; k6 run tests/load/read-heavy.js
```

## 4) Que cubre el escenario

- `public_read`: `/api/services`, `/api/providers`, `/api/reviews`
- `admin_read`: `/api/admin/users`, `/api/billing/admin/overview`, `/api/notifications`
- `provider_read`: `/api/bookings`, `/api/contracts`, `/api/billing/provider/{id}`, `/api/chat/conversations`

## 5) Indicadores objetivo iniciales

- `http_req_failed < 5%`
- `p95 global < 1500ms`
- `p99 global < 3000ms`

Si se rompen umbrales, revisa en paralelo logs de Laravel y uso de recursos de DB para ubicar el cuello principal.
