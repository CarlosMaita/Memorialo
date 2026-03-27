# Configuracion de Reverb en Produccion

## Objetivo
Definir una configuracion segura y operable de Laravel Reverb para el chat en tiempo real de Memorialo en entorno de produccion.

## Alcance
- Endurecimiento de configuracion Reverb (origenes permitidos, TLS, host/port, ejecucion supervisada).
- Variables de entorno requeridas para backend Laravel y frontend figma.
- Operacion en produccion (servicios a levantar y salud operativa).
- Smoke test minimo de realtime entre dos usuarios.

## Notas Criticas de Produccion
- No usar `allowed_origins` con comodin `*` en produccion.
- Las credenciales generadas localmente para Reverb (`REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`) deben rotarse y gestionarse en tu gestor de secretos.
- Reverb debe correr junto con la app Laravel y workers de cola.

## Configuracion Recomendada

### 1. Endurecer `config/reverb.php`
En produccion, reemplazar:
- `allowed_origins => ['*']`

Por una lista cerrada de dominios reales del frontend, por ejemplo:
- `https://memorialo.com`
- `https://www.memorialo.com`
- `https://app.memorialo.com`

Mantener esta lista alineada con `CORS_ALLOWED_ORIGINS` y con los dominios reales donde se sirve el frontend.

### 2. TLS y esquema
- Forzar `REVERB_SCHEME=https` en produccion.
- Exponer Reverb por TLS (directo o detras de proxy inverso con terminacion TLS).
- Evitar websocket no cifrado (`ws://`) en internet publico.

### 3. Host y puertos
- Definir host publico consistente para clientes websocket (`REVERB_HOST`).
- Definir `REVERB_PORT` segun arquitectura (443 recomendado cuando aplica proxy/TLS).
- Mantener `REVERB_SERVER_HOST` y `REVERB_SERVER_PORT` para el listener interno del proceso Reverb.

### 4. Broadcasting y canales
- Confirmar `BROADCAST_CONNECTION=reverb`.
- Mantener autenticacion de canales privados via `auth:sanctum`.
- Verificar que `api/broadcasting/auth` responda correctamente con token valido y rechace usuarios no autorizados.

## Variables de Entorno

### Backend Laravel (produccion)
Configurar via gestor de secretos (no hardcodear en repo):

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.memorialo.com
FRONTEND_URL=https://app.memorialo.com

BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=redis

CORS_ALLOWED_ORIGINS=https://app.memorialo.com,https://memorialo.com,https://www.memorialo.com

REVERB_APP_ID=<from-secret-manager>
REVERB_APP_KEY=<from-secret-manager>
REVERB_APP_SECRET=<from-secret-manager>

REVERB_HOST=ws.memorialo.com
REVERB_PORT=443
REVERB_SCHEME=https

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

Notas:
- `QUEUE_CONNECTION=redis` es recomendacion operativa para produccion.
- Si se usa otro broker de colas, ajustar segun infraestructura.

### Frontend figma (produccion)

```dotenv
VITE_BACKEND_MODE=laravel
VITE_LARAVEL_API_BASE_URL=https://api.memorialo.com/api

VITE_REVERB_APP_KEY=<public-reverb-key>
VITE_REVERB_HOST=ws.memorialo.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

## Operacion de Servicios

### Requeridos en produccion
1. API Laravel (php-fpm/nginx o equivalente).
2. Reverb server (`php artisan reverb:start`).
3. Queue workers (`php artisan queue:work`).

### Recomendacion de supervision
Usar Supervisor, systemd o equivalente para:
- Reinicio automatico ante caidas.
- Log separado por proceso (`laravel`, `queue`, `reverb`).
- Arranque en boot.

## Comandos Locales de Referencia

### En `laravel`
```bash
php artisan reverb:start
php artisan queue:work
php artisan serve
```

### En `figma`
```bash
npm run dev
```

## Checklist de Verificacion de Config
- [ ] `BROADCAST_CONNECTION=reverb` en entorno objetivo.
- [ ] `allowed_origins` restringido a dominios reales.
- [ ] `REVERB_SCHEME=https` en produccion.
- [ ] Credenciales Reverb rotadas y almacenadas en gestor de secretos.
- [ ] Endpoint `api/broadcasting/auth` protegido y funcional.
- [ ] Reverb y workers ejecutandose bajo supervisor.

## Smoke Test Realtime (2 usuarios)

### Objetivo
Validar entrega en tiempo real cross-session y autorizacion de canales.

### Escenario
1. Usuario A y usuario B inician sesion en navegadores distintos.
2. Abren la misma conversacion de chat.
3. Usuario A envia un mensaje.
4. Usuario B debe recibirlo en tiempo real (sin refresh).
5. Validar orden temporal y sincronizacion de no leidos.
6. Repetir al inverso (B -> A).

### Criterio de aceptacion
- Entrega realtime estable en ambos sentidos.
- Sin errores de autenticacion de canal para participantes validos.
- Rechazo de suscripcion para usuario no participante.

## Riesgos y Mitigaciones
- Riesgo: `allowed_origins` abierto expone superficie innecesaria.
- Mitigacion: lista cerrada por dominio productivo.

- Riesgo: credenciales de entorno local usadas en produccion.
- Mitigacion: rotacion obligatoria y secreto centralizado.

- Riesgo: Reverb/worker caidos degradan realtime.
- Mitigacion: supervisor + alertas + runbook de reinicio.

## Proximos Pasos Recomendados
1. Aplicar hardening directo en `laravel/config/reverb.php` para entorno productivo.
2. Definir manifest de despliegue/procesos (Supervisor/systemd) para `reverb` y `queue`.
3. Automatizar smoke test de chat realtime en pipeline de staging.

## Referencia Operativa
Para implementacion paso a paso de supervisores en servidor Linux:
- Ver `docs/migracion/07-guia-supervisor-produccion.md`.
