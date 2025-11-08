# 🚨 Manejo de Errores - Famitos

## Errores de Autenticación

### ✅ Error: Email ya registrado

**Error Original**: `AuthApiError: A user with this email address has already been registered`

**Flujo de Manejo**:

```typescript
// 1. Backend (/supabase/functions/server/index.tsx)
if (error.message.includes('already been registered') || error.code === 'email_exists') {
  return c.json({ 
    error: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.' 
  }, 409);
}

// 2. apiRequest (/utils/supabase/client.ts)
if (!response.ok) {
  const errorData = await response.json();
  const errorMessage = errorData.error || errorData.message || 'Request failed';
  throw new Error(errorMessage);
}

// 3. useSupabase.signUp (/utils/useSupabase.ts)
catch (error: any) {
  if (error instanceof Error) {
    throw error; // Propaga el mensaje
  }
  throw new Error(error?.message || 'Error al crear la cuenta');
}

// 4. App.handleSignUp (/App.tsx)
catch (error) {
  throw error; // Propaga al componente
}

// 5. AuthDialog.handleRegister (/components/AuthDialog.tsx)
catch (error: any) {
  const errorMessage = error.message || 'Error al crear la cuenta';
  
  if (errorMessage.includes('ya está registrado') || 
      errorMessage.includes('already been registered')) {
    toast.error('Este correo ya tiene una cuenta. Por favor, inicia sesión en la pestaña "Iniciar Sesión".');
  } else {
    toast.error(errorMessage);
  }
}
```

**Resultado para el Usuario**:
- ✅ Mensaje claro en español
- ✅ Sugerencia de acción (usar pestaña "Iniciar Sesión")
- ✅ No se muestra error técnico

---

## Errores Comunes y Sus Códigos

| Error | Código HTTP | Mensaje Usuario | Acción |
|-------|-------------|-----------------|---------|
| Email ya existe | 409 | "Este correo ya está registrado..." | Usar "Iniciar Sesión" |
| Credenciales inválidas | 401 | "Email o contraseña incorrectos..." | Verificar credenciales |
| Contraseña muy corta | 400 | "La contraseña debe tener al menos 6 caracteres" | Usar contraseña más larga |
| Usuario no encontrado | 404 | "Usuario no encontrado" | Crear cuenta primero |
| Token expirado | 401 | "Sesión expirada" | Iniciar sesión nuevamente |

---

## Testing de Manejo de Errores

### Test 1: Email Duplicado
```
1. Registrar usuario con: test@example.com
2. Intentar registrar de nuevo con: test@example.com
3. Verificar mensaje: "Este correo ya tiene una cuenta. Por favor, inicia sesión..."
```

### Test 2: Contraseña Corta
```
1. Intentar registrar con contraseña: "123"
2. Verificar mensaje: "La contraseña debe tener al menos 6 caracteres"
```

### Test 3: Login Incorrecto
```
1. Intentar login con credenciales incorrectas
2. Verificar mensaje: "Email o contraseña incorrectos..."
```

---

## Buenas Prácticas Implementadas

✅ **Mensajes en Español**: Todos los mensajes de error están en español
✅ **Mensajes Accionables**: Cada error indica qué hacer
✅ **Códigos HTTP Correctos**: 409 para conflictos, 400 para bad request, etc.
✅ **Propagación de Errores**: Los errores se propagan correctamente desde backend a frontend
✅ **Logging**: Todos los errores se loggean en consola para debugging
✅ **UX Friendly**: Mensajes amigables en toast notifications

---

## Debugging Errores

Para ver el flujo completo de un error:

```javascript
// 1. Abrir Chrome DevTools
// 2. Tab "Console" para ver logs
// 3. Tab "Network" para ver requests
// 4. Filtrar por "make-server-5d78aefb" para ver llamadas al servidor

// Ejemplo de log en consola:
API Error [POST /auth/signup]: Este correo electrónico ya está registrado...
Error calling POST /auth/signup: Este correo electrónico ya está registrado...
Signup error: Error: Este correo electrónico ya está registrado...
```

El mensaje debería ser consistente en todos los niveles.

---

## Agregar Nuevos Errores

Para agregar manejo de un nuevo error:

1. **Backend**: Detectar el error específico y devolver mensaje claro
```typescript
if (error.code === 'nuevo_error') {
  return c.json({ error: 'Mensaje claro en español' }, codigoHTTP);
}
```

2. **Frontend**: Detectar el mensaje y mostrar toast apropiado
```typescript
if (errorMessage.includes('palabra_clave')) {
  toast.error('Mensaje amigable con acción sugerida');
}
```

3. **Documentar** en este archivo con:
   - Nombre del error
   - Código HTTP
   - Mensaje para el usuario
   - Acción sugerida
