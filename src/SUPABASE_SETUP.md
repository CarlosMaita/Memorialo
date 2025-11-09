# Integración de Supabase - Memorialo

## ✅ Estado de la Integración

La plataforma Memorialo ahora está completamente integrada con Supabase para autenticación y almacenamiento de datos.

## 🎯 Características Implementadas

### Autenticación
- ✅ Registro de usuarios con email y contraseña
- ✅ Inicio de sesión
- ✅ Cierre de sesión
- ✅ Persistencia de sesión
- ✅ Verificación automática de email (configurado para desarrollo)

### Almacenamiento de Datos
Todos los datos se almacenan en el **KV Store** de Supabase:

- ✅ **Usuarios**: Información de perfil, tipo de cuenta (cliente/proveedor)
- ✅ **Proveedores**: Perfiles de negocio para artistas
- ✅ **Servicios**: Publicaciones de artistas con planes, imágenes, y detalles
- ✅ **Contratos**: Acuerdos entre clientes y artistas con firmas digitales
- ✅ **Reviews**: Reseñas de clientes sobre servicios completados
- ✅ **Bookings**: Reservas y su estado

### API Backend
El servidor Hono en `/supabase/functions/server/index.tsx` maneja:

- **Auth Routes**: `/auth/signup`, `/auth/signin`, `/auth/session`
- **User Routes**: GET/PUT `/users/:id`
- **Provider Routes**: POST/GET `/providers`, GET `/providers/user/:userId`
- **Service Routes**: POST/GET/PUT/DELETE `/services`
- **Contract Routes**: POST/GET/PUT `/contracts`
- **Review Routes**: POST/GET `/reviews`
- **Booking Routes**: POST/GET `/bookings`

## 🚀 Cómo Usar

### Para Usuarios

1. **Crear Cuenta (PRIMERA VEZ)**
   - ⚠️ **IMPORTANTE**: Debes crear una cuenta nueva la primera vez
   - Click en "Iniciar Sesión" en el header
   - Selecciona la pestaña **"Registrarse"**
   - Completa el formulario con tu información
   - Marca la casilla "Quiero ofrecer mis servicios" si deseas ser proveedor
   - Haz clic en "Crear Cuenta"

2. **Iniciar Sesión**
   - Usa el email y contraseña que acabas de crear
   - La sesión se mantendrá activa automáticamente
   - ⚠️ Si obtienes "credenciales inválidas", verifica que hayas creado la cuenta primero

3. **Como Cliente**
   - Busca y reserva artistas
   - Ve tus reservas en "Mis Reservas"
   - Firma contratos y deja reseñas

4. **Como Proveedor**
   - Accede a "Mi Negocio" para gestionar servicios
   - Crea publicaciones con imágenes
   - Gestiona contratos y reservas

### Para Desarrolladores

#### Estructura de Datos en KV Store

Todos los datos usan prefijos para organización:

```
user:{userId} -> User object
provider:{providerId} -> Provider object
service:{serviceId} -> Artist/Service object
contract:{contractId} -> Contract object
review:{reviewId} -> Review object
booking:{bookingId} -> Booking object
```

#### Hook de Supabase

Usa el hook `useSupabase()` en cualquier componente:

```typescript
import { useSupabase } from './utils/useSupabase';

function MyComponent() {
  const supabase = useSupabase();
  
  // Acceder al usuario actual
  const user = supabase.currentUser;
  
  // Crear un servicio
  const createMyService = async () => {
    await supabase.createService({...});
  };
}
```

#### Llamadas Directas a la API

```typescript
import { apiRequest } from './utils/supabase/client';

// GET request
const data = await apiRequest('/services', 'GET');

// POST request with auth
const newService = await apiRequest(
  '/services', 
  'POST', 
  { name: 'Mi Servicio' },
  accessToken
);
```

## 🔒 Seguridad

- ✅ Las contraseñas se manejan de forma segura con Supabase Auth
- ✅ Los tokens de acceso se validan en cada request protegido
- ✅ Los usuarios solo pueden modificar sus propios datos
- ✅ El Service Role Key nunca se expone al frontend

## 📝 Notas Importantes

1. **Datos de Ejemplo**: Al cargar la app por primera vez, si no hay datos en Supabase, se usan datos mock como respaldo.

2. **Email Confirmación**: Está deshabilitada para desarrollo (`email_confirm: true`). Para producción, configura un proveedor de email en Supabase.

3. **KV Store**: Todos los datos usan el KV store predefinido. No se requieren migraciones ni DDL statements.

4. **Fallback**: Si hay errores de red, la app muestra datos de ejemplo y notifica al usuario.

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
- Verifica que el servidor de Supabase esté corriendo
- Revisa la consola del navegador para más detalles

### Error: "Unauthorized"
- Cierra sesión y vuelve a iniciar
- Verifica que el token no haya expirado

### No aparecen mis datos
- Verifica que estés autenticado
- Revisa la consola para errores de API
- Asegúrate de que los datos se hayan guardado correctamente

## 🎨 Próximos Pasos Sugeridos

1. **Búsqueda Avanzada**: Agregar filtros por ubicación geográfica
2. **Notificaciones**: Implementar notificaciones en tiempo real con Supabase Realtime
3. **Pagos**: Integrar Stripe para procesar pagos
4. **Chat**: Sistema de mensajería entre clientes y proveedores
5. **Calendario**: Vista de disponibilidad en tiempo real
