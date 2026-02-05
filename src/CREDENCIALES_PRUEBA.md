# 🔑 Credenciales de Prueba - Memorialo

## Inicio Rápido

Para probar rápidamente la aplicación, usa estos botones en el diálogo de inicio de sesión:

- **👑 Admin** - Acceso al panel de administrador
- **🎸 Proveedor** - Vista del proveedor de servicios
- **👤 Cliente** - Vista del cliente

## Credenciales Completas

### 👑 Usuario Administrador
```
Email: admin@memorialo.com
Contraseña: admin123
```

**Capacidades:**
- Acceso completo al panel de administrador
- Verificar proveedores
- Banear/desbanear usuarios y proveedores
- Ver todas las estadísticas de la plataforma
- Revisar todos los contratos y bookings
- Gestionar la plataforma completa

**Cómo acceder:**
1. Clic en "Iniciar Sesión"
2. Clic en el botón "👑 Admin"
3. Clic en "Iniciar Sesión"
4. En el menú de usuario (arriba derecha), selecciona "🛡️ Panel Admin"

---

### 🎸 Usuario Proveedor (Mariachi Los Gallos)
```
Email: mariachi@losgallos.com
Contraseña: provider123
```

**Información del Proveedor:**
- Nombre: Carlos Rodríguez
- Negocio: Mariachi Los Gallos
- Categoría: Música y DJs
- Estado: Verificado ✅
- Total Bookings: 342
- Rating: 4.9

**Capacidades:**
- Gestionar servicios (crear, editar, publicar, archivar)
- Ver y responder a contratos
- Administrar bookings
- Ver estadísticas de negocio
- Personalizar términos y condiciones

**Cómo acceder:**
1. Clic en "Iniciar Sesión"
2. Clic en el botón "🎸 Proveedor"
3. Clic en "Iniciar Sesión"
4. En el menú de usuario, selecciona "Mi Negocio"

---

### 👤 Usuario Cliente
```
Email: juan.perez@email.com
Contraseña: user123
```

**Información del Cliente:**
- Nombre: Juan Pérez
- Teléfono: +58-412-9876543
- Tipo: Cliente regular

**Capacidades:**
- Buscar y comparar proveedores
- Hacer reservas y contratar servicios
- Ver y firmar contratos
- Gestionar eventos
- Dejar reseñas
- Ver historial de bookings

**Cómo acceder:**
1. Clic en "Iniciar Sesión"
2. Clic en el botón "👤 Cliente"
3. Clic en "Iniciar Sesión"
4. En el menú de usuario, selecciona "Mis Reservas"

---

### 🎵 Usuario Proveedor 2 (DJ Mike Thompson)
```
Email: dj@mikethompson.com
Contraseña: provider123
```

**Información del Proveedor:**
- Nombre: Mike Thompson
- Negocio: DJ Mike Thompson Pro
- Categoría: Música y DJs
- Estado: Pendiente de verificación ⏳
- Total Bookings: 215
- Rating: 4.8

**Ideal para probar:**
- Proceso de verificación de proveedores (desde el panel de admin)
- Vista de proveedor no verificado
- Solicitudes de verificación

---

## Proveedores en el Sistema (para referencia)

### Verificados ✅
1. **Mariachi Los Gallos** (ID: 1)
   - Usuario: mariachi@losgallos.com
   - Categoría: Música y DJs

### Pendientes de Verificación ⏳
2. **DJ Mike Thompson Pro** (ID: 2)
   - Usuario: dj@mikethompson.com
   - Categoría: Música y DJs

### Baneados 🚫
3. **Fotógrafo Express** (ID: 3)
   - Sin cuenta de usuario activa
   - Razón: "Incumplimiento repetido de contratos y quejas de clientes"
   - Ideal para probar el desbaneo desde el panel de admin

---

## Flujos de Prueba Recomendados

### 1. Flujo de Cliente → Booking
1. Inicia sesión como cliente (👤)
2. Busca proveedores por ciudad/categoría
3. Compara hasta 3 proveedores
4. Selecciona un servicio y haz una reserva
5. Firma el contrato
6. Revisa el contrato en "Mis Reservas"

### 2. Flujo de Proveedor → Gestión
1. Inicia sesión como proveedor (🎸)
2. Ve a "Mi Negocio"
3. Revisa estadísticas
4. Edita o crea servicios
5. Revisa contratos pendientes
6. Personaliza términos y condiciones

### 3. Flujo de Admin → Moderación
1. Inicia sesión como admin (👑)
2. Ve a "Panel Admin"
3. Verifica un proveedor pendiente (DJ Mike Thompson)
4. Prueba banear y desbanear proveedores
5. Revisa estadísticas de la plataforma
6. Filtra y busca proveedores/usuarios

### 4. Flujo Completo de Reserva
1. Como **Cliente**: Busca y reserva un servicio
2. Como **Proveedor**: Acepta el contrato
3. Como **Cliente**: Firma el contrato
4. Ambos: Revisen el contrato activo
5. Como **Cliente**: Deja una reseña al finalizar

---

## Notas Importantes

- **Auto-completado**: Los botones de prueba (👑 Admin, 🎸 Proveedor, 👤 Cliente) auto-completan las credenciales
- **Modo Demo**: Si la base de datos está vacía, se usan automáticamente datos de prueba
- **Persistencia**: Los cambios se guardan en Supabase cuando está conectado
- **Roles**: El sistema diferencia automáticamente entre usuarios, proveedores y admins

---

## Troubleshooting

### No puedo iniciar sesión
- Verifica que estés usando el email y contraseña correctos
- Usa los botones de prueba para auto-completar
- Revisa la consola del navegador para errores

### No veo el Panel Admin
- Solo el usuario con email `admin@memorialo.com` tiene acceso
- Asegúrate de haber iniciado sesión con las credenciales de admin

### Los cambios no se guardan
- Verifica la conexión con Supabase
- En modo demo, algunos cambios pueden ser volátiles
- Revisa la consola para errores de backend

---

## Crear Nuevos Usuarios

Si quieres crear tu propio usuario:

1. Clic en "Iniciar Sesión"
2. Ve a la pestaña "Registrarse"
3. Completa el formulario
4. Marca la casilla "Quiero ofrecer mis servicios como proveedor" si quieres ser proveedor
5. Los nuevos proveedores necesitan verificación del admin

---

**¿Necesitas más información?** Consulta [ADMIN_TESTING.md](./ADMIN_TESTING.md) para una guía detallada del panel de administrador.
