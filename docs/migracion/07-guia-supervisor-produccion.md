# Guia Paso a Paso - Supervisor en Produccion (Laravel + Reverb + Queue)

## Objetivo
Dejar procesos criticos de Memorialo bajo supervision automatica para garantizar reinicio automatico, estabilidad operativa y recuperacion rapida.

## Alcance
- Instalar y configurar Supervisor en Linux.
- Supervisar 3 procesos:
  - `laravel-reverb`
  - `laravel-queue`
  - `laravel-scheduler`
- Validar arranque automatico, reinicio automatico y logs.
- Incluir comandos de operacion diaria y recuperacion.

## Prerrequisitos
- Servidor Linux (Ubuntu/Debian recomendado).
- Laravel desplegado en ruta estable, ejemplo: `/var/www/memorialo/current`.
- PHP CLI disponible en PATH.
- Variables de entorno productivas listas (`APP_ENV`, `BROADCAST_CONNECTION`, `REVERB_*`, `QUEUE_CONNECTION`).
- Usuario de ejecucion, ejemplo: `www-data`.

## Paso 1 - Instalar Supervisor
```bash
sudo apt update
sudo apt install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
sudo systemctl status supervisor
```

Resultado esperado:
- Servicio `supervisor` en estado `active (running)`.

## Paso 2 - Crear carpeta de logs de procesos
```bash
sudo mkdir -p /var/log/memorialo
sudo chown -R www-data:www-data /var/log/memorialo
sudo chmod -R 755 /var/log/memorialo
```

Resultado esperado:
- Carpeta de logs disponible para stdout/stderr de todos los programas.

## Paso 3 - Configurar programa Reverb
Crear archivo `/etc/supervisor/conf.d/memorialo-reverb.conf`:

```ini
[program:memorialo-reverb]
process_name=%(program_name)s
command=/usr/bin/php /var/www/memorialo/current/artisan reverb:start --host=0.0.0.0 --port=8080
user=www-data
directory=/var/www/memorialo/current
autostart=true
autorestart=true
startsecs=5
startretries=10
stopwaitsecs=20
stopsignal=TERM
redirect_stderr=true
stdout_logfile=/var/log/memorialo/reverb.log
stdout_logfile_maxbytes=20MB
stdout_logfile_backups=10
environment=APP_ENV="production"
```

Notas:
- Ajustar ruta de `php` si no esta en `/usr/bin/php`.
- Ajustar puerto si en tu arquitectura Reverb usa otro listener interno.

## Paso 4 - Configurar programa Queue Worker
Crear archivo `/etc/supervisor/conf.d/memorialo-queue.conf`:

```ini
[program:memorialo-queue]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php /var/www/memorialo/current/artisan queue:work --sleep=1 --tries=3 --max-time=3600 --timeout=120
user=www-data
directory=/var/www/memorialo/current
numprocs=2
autostart=true
autorestart=true
startsecs=5
startretries=10
stopasgroup=true
killasgroup=true
stopwaitsecs=30
redirect_stderr=true
stdout_logfile=/var/log/memorialo/queue.log
stdout_logfile_maxbytes=20MB
stdout_logfile_backups=10
environment=APP_ENV="production"
```

Notas:
- `numprocs=2` es base minima; aumentar segun carga.
- Si usas Redis/SQS, mantener `QUEUE_CONNECTION` correcto en `.env`.

## Paso 5 - Configurar Scheduler (opcional recomendado)
Crear archivo `/etc/supervisor/conf.d/memorialo-scheduler.conf`:

```ini
[program:memorialo-scheduler]
process_name=%(program_name)s
command=/usr/bin/php /var/www/memorialo/current/artisan schedule:work
user=www-data
directory=/var/www/memorialo/current
autostart=true
autorestart=true
startsecs=5
startretries=10
stopwaitsecs=20
stopsignal=TERM
redirect_stderr=true
stdout_logfile=/var/log/memorialo/scheduler.log
stdout_logfile_maxbytes=20MB
stdout_logfile_backups=10
environment=APP_ENV="production"
```

## Paso 6 - Cargar configuracion en Supervisor
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

Resultado esperado:
- `memorialo-reverb` en `RUNNING`.
- `memorialo-queue:memorialo-queue_00` en `RUNNING`.
- `memorialo-queue:memorialo-queue_01` en `RUNNING`.
- `memorialo-scheduler` en `RUNNING` (si se configuro).

## Paso 7 - Verificacion funcional
1. Verificar salud API:
```bash
curl -sS https://api.tu-dominio.com/api/health
```

2. Ver logs en vivo:
```bash
tail -f /var/log/memorialo/reverb.log
tail -f /var/log/memorialo/queue.log
tail -f /var/log/memorialo/scheduler.log
```

3. Prueba de chat realtime:
- Abrir dos sesiones de usuario en frontend.
- Enviar mensaje de A -> B y validar entrega sin refresh.
- Repetir B -> A.

## Paso 8 - Operacion diaria
Comandos utiles:

```bash
sudo supervisorctl status
sudo supervisorctl restart memorialo-reverb
sudo supervisorctl restart memorialo-queue:*
sudo supervisorctl restart memorialo-scheduler
sudo supervisorctl stop memorialo-reverb
sudo supervisorctl start memorialo-reverb
```

## Paso 9 - Integracion con despliegue
Despues de cada deploy:

```bash
cd /var/www/memorialo/current
php artisan config:cache
php artisan route:cache
php artisan event:cache
sudo supervisorctl restart memorialo-reverb
sudo supervisorctl restart memorialo-queue:*
sudo supervisorctl restart memorialo-scheduler
```

Si usas `queue:restart` en release:

```bash
php artisan queue:restart
```

## Alertas Minimas Recomendadas
- Alerta critica si cualquier proceso Supervisor esta en `STOPPED`, `EXITED` o `FATAL` por mas de 60 segundos.
- Alerta warning si cola crece sostenidamente por encima de umbral esperado.
- Alerta critica si `/api/health` falla consecutivamente.

## Troubleshooting Rapido

### Caso A: Reverb no inicia
1. Revisar log:
```bash
tail -n 200 /var/log/memorialo/reverb.log
```
2. Validar puerto libre:
```bash
sudo ss -ltnp | grep 8080
```
3. Reiniciar proceso:
```bash
sudo supervisorctl restart memorialo-reverb
```

### Caso B: Workers se caen
1. Revisar errores:
```bash
tail -n 200 /var/log/memorialo/queue.log
```
2. Verificar conexion de cola y credenciales.
3. Reiniciar workers:
```bash
sudo supervisorctl restart memorialo-queue:*
```

### Caso C: Chat no entrega en tiempo real
1. Verificar `BROADCAST_CONNECTION=reverb`.
2. Verificar endpoint `api/broadcasting/auth` autenticado.
3. Verificar variables frontend `VITE_REVERB_*`.
4. Reiniciar Reverb y workers.

## Checklist Final
- [ ] Supervisor instalado y habilitado al boot.
- [ ] Reverb bajo Supervisor en `RUNNING`.
- [ ] Queue workers bajo Supervisor en `RUNNING`.
- [ ] Scheduler bajo Supervisor en `RUNNING` (si aplica).
- [ ] Logs de procesos separados y rotando.
- [ ] Smoke test realtime A/B validado.
- [ ] Alertas minimas configuradas.
- [ ] Procedimiento de reinicio probado.

## Runbook de Reinicio (resumen)
1. `sudo supervisorctl status`
2. `sudo supervisorctl restart memorialo-reverb`
3. `sudo supervisorctl restart memorialo-queue:*`
4. Validar `/api/health`
5. Validar prueba de chat realtime entre dos usuarios
