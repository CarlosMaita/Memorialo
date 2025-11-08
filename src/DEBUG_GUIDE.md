# 🔧 Guía de Debugging - Famitos + Supabase

## ✅ Errores Corregidos

### Error: "Invalid login credentials"
**Causa**: Usuario intentando iniciar sesión sin haber creado una cuenta primero.

**Solución**: 
1. Asegúrate de crear una cuenta nueva usando la pestaña "Registrarse"
2. Luego usa esas credenciales para iniciar sesión

**Flujo Correcto**:
```
Primera vez:
1. Click "Iniciar Sesión" → Tab "Registrarse"
2. Llenar formulario → "Crear Cuenta"
3. Automáticamente se inicia sesión

Siguientes veces:
1. Click "Iniciar Sesión" → Tab "Iniciar Sesión"  
2. Usar email y contraseña creados
```

## 🔍 Cómo Verificar el Estado

### Ver Usuario Actual
Abre la consola del navegador (F12) y ejecuta:
```javascript
// Ver si hay sesión activa
const { data } = await (await fetch('https://YOUR_PROJECT.supabase.co/auth/v1/user', {
  headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
})).json();
console.log(data);
```

### Ver Logs del Servidor
Los logs del servidor Supabase mostrarán:
- Errores de autenticación
- Operaciones de KV store
- Requests y responses

### Ver Datos en KV Store
Los datos se almacenan con estos prefijos:
- `user:{userId}` - Datos de usuario
- `service:{serviceId}` - Servicios/artistas
- `contract:{contractId}` - Contratos
- `review:{reviewId}` - Reviews
- `booking:{bookingId}` - Reservas
- `provider:{providerId}` - Proveedores

## 🐛 Problemas Comunes y Soluciones

### 1. "Invalid login credentials"
- ✅ **Causa**: Cuenta no existe
- ✅ **Solución**: Crear cuenta primero

### 2. Usuario no persiste después de refresh
- **Causa**: Session no se está guardando
- **Solución**: Verificar que `supabase.auth.getSession()` funcione
- **Check**: Abrir DevTools → Application → Local Storage → buscar `supabase.auth.token`

### 3. Datos no se guardan
- **Causa**: Error en el servidor o falta de autenticación
- **Solución**: 
  1. Verificar que el usuario esté autenticado (`currentUser` no es null)
  2. Revisar consola para errores de API
  3. Verificar que el access token sea válido

### 4. "Unauthorized" en requests
- **Causa**: Token expirado o inválido
- **Solución**: 
  1. Cerrar sesión
  2. Iniciar sesión nuevamente
  3. Verificar que el token se esté pasando correctamente

### 5. No aparecen los servicios creados
- **Causa**: Datos no se cargaron o usuario no tiene servicios
- **Solución**:
  1. Verificar que el servicio se creó correctamente (ver consola)
  2. Hacer refresh de la página
  3. Si es proveedor, ir a "Mi Negocio" para ver sus servicios

## 🔧 Debugging Tools

### Console Commands Útiles

```javascript
// Ver usuario actual
console.log(window.localStorage.getItem('supabase.auth.token'));

// Limpiar sesión completamente
window.localStorage.removeItem('supabase.auth.token');
window.location.reload();

// Ver fetch requests en Network tab
// Chrome DevTools → Network → Filter: Fetch/XHR
```

### Backend Debugging

En el servidor (`/supabase/functions/server/index.tsx`), todos los requests se loggean automáticamente gracias a:
```typescript
app.use('*', logger(console.log));
```

Los errores se loggean con:
```typescript
console.error('Error description:', error);
```

## 📋 Checklist de Verificación

Antes de reportar un bug, verifica:

- [ ] ¿Creaste una cuenta nueva?
- [ ] ¿Usaste las credenciales correctas al iniciar sesión?
- [ ] ¿Hay errores en la consola del navegador?
- [ ] ¿El servidor de Supabase está respondiendo? (ver Network tab)
- [ ] ¿Tu sesión está activa? (currentUser no es null)
- [ ] ¿Intentaste cerrar sesión y volver a iniciar?

## 🎯 Testing Flow Recomendado

### Test Completo del Sistema

1. **Registro de Cliente**
   ```
   - Ir a "Iniciar Sesión"
   - Tab "Registrarse"
   - Llenar datos (NO marcar checkbox de proveedor)
   - Crear cuenta
   - Verificar que se muestre nombre en header
   ```

2. **Registro de Proveedor**
   ```
   - Cerrar sesión
   - Ir a "Iniciar Sesión"
   - Tab "Registrarse"  
   - Llenar datos (SÍ marcar checkbox de proveedor)
   - Crear cuenta
   - Verificar que aparezca "Mi Negocio" en header
   ```

3. **Crear Servicio (como Proveedor)**
   ```
   - Click "Mi Negocio"
   - Click "Crear Nuevo Servicio"
   - Llenar información del servicio
   - Agregar imagen principal (URL)
   - Agregar imágenes de portafolio
   - Agregar planes de servicio
   - Guardar
   - Verificar que aparezca en la lista
   ```

4. **Contratar Servicio (como Cliente)**
   ```
   - Cerrar sesión
   - Iniciar sesión como cliente
   - Buscar artista
   - Click "Ver Perfil"
   - Click "Seleccionar Plan"
   - Llenar formulario de reserva
   - Crear contrato
   - Firmar contrato
   - Verificar en "Mis Reservas"
   ```

## 🚨 Escalación

Si después de todos estos pasos aún hay problemas:

1. **Capturar información**:
   - Screenshot del error
   - Console logs completos
   - Network tab (requests fallidos)
   - Pasos exactos para reproducir

2. **Información del sistema**:
   - Navegador y versión
   - ¿Mobile o Desktop?
   - URL del proyecto Supabase

3. **Estado de la aplicación**:
   - ¿Usuario autenticado o no?
   - ¿Qué acción estaba intentando hacer?
   - ¿Funcionó antes y dejó de funcionar?
