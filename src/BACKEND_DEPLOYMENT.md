# Deployment del Backend de Supabase Edge Functions

## Problema Actual

El error `BACKEND_UNAVAILABLE` indica que el servidor de Supabase Edge Functions no está desplegado o no está respondiendo. Aunque todo el código del backend está correctamente implementado en `/supabase/functions/server/index.tsx`, necesitas desplegar la función para que esté disponible en producción.

## Estado del Código

✅ **El código del backend está completo y correcto**, incluyendo todas las rutas necesarias:
- Auth (signup, session)
- Users (get, update)
- Providers (create, get, get by user)
- Services/Artists (create, get, update, delete)
- Contracts (create, get, update)
- Reviews (create, get)
- **Bookings (create, get, update)** ← Las rutas están implementadas
- Events (create, get, update, delete)

## Solución: Desplegar el Edge Function

Para que el backend funcione, necesitas desplegar la función de Supabase. Aquí están las opciones:

### Opción 1: Desplegar usando Supabase CLI (Recomendado)

1. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. **Iniciar sesión en Supabase**:
   ```bash
   supabase login
   ```

3. **Link tu proyecto**:
   ```bash
   supabase link --project-ref lpoybvmalhxlomsrssgm
   ```

4. **Desplegar las funciones**:
   ```bash
   supabase functions deploy server
   ```

### Opción 2: Desplegar desde el Dashboard de Supabase

1. Ve a tu proyecto en https://supabase.com/dashboard/project/lpoybvmalhxlomsrssgm
2. Navega a **Edge Functions** en el menú lateral
3. Crea una nueva función llamada `server`
4. Copia y pega el contenido de `/supabase/functions/server/index.tsx`
5. Asegúrate de que el archivo `kv_store.tsx` también esté disponible
6. Despliega la función

### Opción 3: Modo Demo Local (Para Desarrollo)

Si solo estás en modo de desarrollo y no quieres desplegar el backend todavía, puedes habilitar el modo demo en la aplicación que usa datos mock en lugar del backend.

**Nota importante**: En el código ya hay manejo para el error `BACKEND_UNAVAILABLE` en las funciones de lectura (get), que retornan arrays vacíos silenciosamente. Sin embargo, para las operaciones de escritura (create, update), el error se propaga al usuario con un mensaje más amigable.

## Verificar que el Backend está Funcionando

Una vez desplegado, puedes verificar que funciona visitando:

```
https://lpoybvmalhxlomsrssgm.supabase.co/functions/v1/make-server-5d78aefb/health
```

Deberías ver: `{"status":"ok"}`

## Variables de Entorno Necesarias

El Edge Function necesita estas variables de entorno (ya configuradas automáticamente por Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Estas se configuran automáticamente cuando despliegas con la CLI o desde el dashboard.

## Mejoras Implementadas

He agregado mejor manejo de errores en `/utils/useSupabase.ts` para que cuando el backend no esté disponible, el usuario vea mensajes más claros en español en lugar de errores técnicos.
