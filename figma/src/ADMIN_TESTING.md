# Guía de Prueba del Sistema de Administración

Esta guía te ayudará a probar todas las funcionalidades del panel de administrador en Memorialo.

## Usuarios de Prueba

Hemos creado varios usuarios de prueba que puedes usar para explorar diferentes funcionalidades:

### 1. Usuario Administrador 👑
- **Email:** `admin@memorialo.com`
- **Contraseña:** `admin123`
- **Permisos:** Acceso completo al panel de administrador
- **Puede:**
  - Ver todos los proveedores y usuarios
  - Verificar proveedores
  - Banear/desbanear proveedores y usuarios
  - Ver estadísticas de la plataforma
  - Revisar contratos y bookings

### 2. Usuario Proveedor (Mariachi Los Gallos) 🎸
- **Email:** `mariachi@losgallos.com`
- **Contraseña:** `provider123`
- **Tipo:** Proveedor verificado
- **Puede:**
  - Gestionar sus servicios
  - Ver sus contratos
  - Administrar bookings
  - Acceder al panel "Mi Negocio"

### 3. Usuario Cliente 👤
- **Email:** `juan.perez@email.com`
- **Contraseña:** `user123`
- **Tipo:** Cliente regular
- **Puede:**
  - Buscar proveedores
  - Hacer reservas
  - Ver sus contratos
  - Acceder al panel "Mis Reservas"

## Datos de Prueba Incluidos

### Proveedores:
1. **Mariachi Los Gallos** (ID: 1)
   - Estado: Verificado ✅
   - Usuario: provider-user-1
   - Servicios activos: 1

2. **DJ Mike Thompson Pro** (ID: 2)
   - Estado: NO verificado ⏳
   - Usuario: provider-user-2
   - Servicios activos: 1
   - *Ideal para probar la verificación*

3. **Fotógrafo Express** (ID: 3)
   - Estado: Baneado 🚫
   - Razón: "Incumplimiento repetido de contratos y quejas de clientes"
   - *Ideal para probar el desbaneo*

## Cómo Probar el Panel de Administrador

### Paso 1: Iniciar Sesión como Admin

1. Haz clic en el botón "Iniciar Sesión" en la esquina superior derecha
2. En el diálogo de autenticación, haz clic en el botón **"👑 Admin"**
   - Esto auto-completará el email y contraseña del administrador
3. Haz clic en "Iniciar Sesión"

### Paso 2: Acceder al Panel de Administrador

Una vez autenticado:
1. Haz clic en tu avatar/nombre en la esquina superior derecha
2. En el menú desplegable, selecciona **"🛡️ Panel Admin"**
3. Se abrirá el Dashboard de Administrador

### Paso 3: Explorar las Pestañas del Panel

#### 📊 Resumen (Overview)
Muestra estadísticas generales:
- Total de proveedores registrados
- Proveedores pendientes de verificación
- Total de usuarios
- Total de contratos
- Contratos activos
- Ingresos generados
- Promedio de calificaciones
- Usuarios baneados

#### 🏢 Proveedores
Muestra lista de todos los proveedores con:
- Estado de verificación (Verificado/Pendiente)
- Estado de baneo (Activo/Baneado)
- Información del negocio
- Categoría
- Total de reservas
- Calificación promedio

**Acciones disponibles:**
- **Verificar proveedor:** Marca el proveedor como verificado
- **Banear proveedor:** Bloquea el proveedor (requiere razón)
- **Desbanear proveedor:** Desbloquea un proveedor previamente baneado

#### 👥 Usuarios
Muestra lista de todos los usuarios con:
- Rol (Admin/Proveedor/Cliente)
- Email y teléfono
- Estado de baneo
- Fecha de registro

**Acciones disponibles:**
- **Banear usuario:** Bloquea un usuario (requiere razón)
- **Desbanear usuario:** Desbloquea un usuario previamente baneado

#### 📋 Contratos
Muestra lista de todos los contratos con:
- Cliente y proveedor
- Servicio contratado
- Precio
- Fecha del evento
- Estado (Draft/Pending/Active/Completed/Cancelled)

#### 📈 Análisis (Analytics)
Muestra gráficos y estadísticas avanzadas:
- Distribución de proveedores por categoría
- Evolución de contratos en el tiempo
- Análisis de ingresos

## Escenarios de Prueba

### Escenario 1: Verificar un Proveedor Nuevo
1. Ve a la pestaña "Proveedores"
2. Busca "DJ Mike Thompson Pro" (estado: Pendiente)
3. Haz clic en el botón "Verificar"
4. El proveedor ahora debe mostrar el badge "Verificado ✅"

### Escenario 2: Banear un Proveedor Problemático
1. Ve a la pestaña "Proveedores"
2. Selecciona cualquier proveedor activo
3. Haz clic en el botón "Banear Proveedor"
4. En el diálogo, ingresa una razón (ej: "Incumplimiento de términos de servicio")
5. Confirma el baneo
6. El proveedor ahora debe mostrar el badge "Baneado 🚫"

### Escenario 3: Desbanear un Proveedor
1. Ve a la pestaña "Proveedores"
2. Busca "Fotógrafo Express" (ya está baneado)
3. Haz clic en el botón "Desbanear"
4. Confirma la acción
5. El proveedor ahora debe mostrar "Activo"

### Escenario 4: Filtrar Proveedores
En la pestaña "Proveedores", prueba los filtros:
- **Todos:** Muestra todos los proveedores
- **Verificados:** Solo proveedores verificados
- **Pendientes:** Solo proveedores pendientes de verificación
- **Baneados:** Solo proveedores baneados

### Escenario 5: Buscar Proveedores o Usuarios
1. Usa la barra de búsqueda en la pestaña "Proveedores" o "Usuarios"
2. Escribe un nombre, email o categoría
3. Los resultados se filtran en tiempo real

### Escenario 6: Ver Detalles de Contratos
1. Ve a la pestaña "Contratos"
2. Revisa los contratos listados
3. Observa los diferentes estados y detalles

## Funcionalidades Clave del Admin

### ✅ Verificación de Proveedores
- Los administradores pueden verificar proveedores manualmente
- Los proveedores verificados obtienen un badge especial
- La verificación queda registrada con fecha y usuario admin que verificó

### 🚫 Sistema de Baneo
- Banear proveedores o usuarios requiere una razón obligatoria
- Los usuarios/proveedores baneados no pueden:
  - Crear nuevos contratos
  - Publicar servicios
  - Acceder a ciertas funcionalidades
- El baneo queda registrado con fecha y razón
- Los admins pueden desbanear en cualquier momento

### 📊 Estadísticas en Tiempo Real
- El dashboard muestra estadísticas actualizadas
- Gráficos interactivos de contratos e ingresos
- Análisis por categoría de servicio

### 🔍 Búsqueda y Filtrado
- Búsqueda en tiempo real por nombre, email, categoría
- Filtros por estado (verificado, pendiente, baneado)
- Ordenamiento por diferentes criterios

## Notas Importantes

1. **Modo Demo:** Si la base de datos está vacía, el sistema usa automáticamente datos de prueba
2. **Persistencia:** Los cambios realizados en el panel de admin se guardan en Supabase (si está conectado)
3. **Permisos:** Solo usuarios con `role: 'admin'` pueden acceder al panel de administrador
4. **Auditoría:** Todas las acciones de moderación quedan registradas (verificación, baneo)

## Troubleshooting

### No veo el botón "Panel Admin"
- Verifica que hayas iniciado sesión con la cuenta de administrador
- Solo los usuarios con `role: 'admin'` tienen acceso

### Los datos no se guardan
- Verifica la conexión con Supabase
- Revisa la consola del navegador para errores
- En modo demo, los datos son volátiles

### No puedo banear/verificar
- Asegúrate de estar usando la cuenta de administrador
- Verifica que el backend esté funcionando correctamente

## Próximos Pasos

Después de probar el panel de admin, puedes:
1. Crear más usuarios de prueba
2. Probar el flujo completo de reserva desde un cliente
3. Verificar cómo se ve la plataforma para proveedores baneados
4. Explorar las estadísticas y análisis

---

¿Necesitas ayuda? Revisa la consola del navegador para logs detallados de las acciones del administrador.
