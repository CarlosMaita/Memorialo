# Funcionalidad de Eventos

## Descripción

Ahora los clientes pueden agrupar múltiples reservas de servicios en eventos, facilitando la organización de celebraciones complejas como bodas, cumpleaños, o fiestas corporativas.

## Características

### 1. Creación de Eventos
- Los usuarios pueden crear eventos con:
  - Nombre del evento (ej: "Boda María y Juan")
  - Tipo de evento (Boda, Cumpleaños, Aniversario, etc.)
  - Fecha del evento
  - Ubicación
  - Presupuesto total
  - Descripción

### 2. Agrupación de Reservas
- Las reservas (contratos) pueden asignarse a eventos específicos
- Cada contrato puede pertenecer a un solo evento
- Los contratos sin asignar se muestran en una sección separada

### 3. Vista de Eventos
- Vista agrupada en el ClientDashboard
- Cada evento muestra:
  - Número de servicios contratados
  - Total gastado vs presupuesto
  - Fecha y ubicación
  - Estado del evento (Planificando, Confirmado, Completado, Cancelado)
  - Lista de todos los contratos asociados

### 4. Gestión
- Crear nuevos eventos
- Editar eventos existentes
- Eliminar eventos (las reservas no se eliminan, solo se desagrupan)
- Reasignar contratos entre eventos
- Expandir/contraer vista de cada evento

## Tipos de Eventos Predefinidos

- Boda
- Cumpleaños
- Aniversario
- Graduación
- Baby Shower
- Fiesta Corporativa
- Conferencia
- Concierto
- Festival
- Otro

## Flujo de Usuario

1. **Cliente navega a "Mis Reservas"**
2. **Pestaña "Por Eventos":**
   - Click en "Crear Nuevo Evento"
   - Completar formulario con detalles del evento
   - Guardar evento
3. **Asignar Reservas:**
   - En cada tarjeta de contrato, usar el selector "Asignar a Evento"
   - Seleccionar el evento correspondiente
   - El contrato se mueve automáticamente al grupo del evento
4. **Gestionar Evento:**
   - Expandir evento para ver todos los servicios
   - Ver total gastado y comparar con presupuesto
   - Editar o eliminar evento según sea necesario

## Datos de Ejemplo

Se han creado 3 eventos de ejemplo en `/data/mockData.ts`:
- "Boda María y Juan" - Junio 2026
- "Cumpleaños 30 de Ana" - Marzo 2026
- "Aniversario 25 años" - Agosto 2026

Y 4 contratos de ejemplo en `/data/mockContracts.ts`, algunos asignados a eventos y otros sin asignar.

## Archivos Modificados

### Nuevos Archivos
- `/components/EventManager.tsx` - Componente para crear/editar eventos
- `/data/mockContracts.ts` - Datos de ejemplo de contratos
- `/data/mockEvents.ts` - Integrado en mockData.ts

### Archivos Actualizados
- `/types/index.ts` - Agregado interface `Event` y campo `eventId` en `Contract`
- `/components/ClientDashboard.tsx` - Vista agrupada por eventos
- `/App.tsx` - Gestión de estado de eventos
- `/data/mockData.ts` - Agregados eventos de ejemplo

## Próximas Mejoras

- Integración con Supabase para persistir eventos
- Notificaciones cuando se acerca la fecha del evento
- Vista de calendario de eventos
- Compartir eventos con otros usuarios
- Plantillas de eventos precargadas
- Estimador de costos por tipo de evento
