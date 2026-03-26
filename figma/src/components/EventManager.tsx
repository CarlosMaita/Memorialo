import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, DollarSign, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { Event } from '../types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ConfirmDialog } from './ConfirmDialog';

interface EventManagerProps {
  events: Event[];
  onCreateEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<Event>) => void;
  onDeleteEvent: (eventId: string) => void;
  eventToEdit?: Event | null;
  onEditComplete?: () => void;
}

const EVENT_TYPES = [
  { value: 'wedding', label: 'Boda' },
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'other', label: 'Aniversario' },
  { value: 'other', label: 'Graduación' },
  { value: 'other', label: 'Baby Shower' },
  { value: 'corporate', label: 'Fiesta Corporativa' },
  { value: 'corporate', label: 'Conferencia' },
  { value: 'concert', label: 'Concierto' },
  { value: 'other', label: 'Festival' },
  { value: 'other', label: 'Otro' },
];

const normalizeText = (value?: string): string => {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const normalizeEventTypeValue = (value?: string): string => {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  if (['wedding', 'corporate', 'birthday', 'quinceanera', 'concert', 'private', 'other'].includes(normalized)) {
    return normalized;
  }

  if (normalized.includes('boda') || normalized.includes('wedding')) return 'wedding';
  if (normalized.includes('corporativ') || normalized.includes('corporate') || normalized.includes('conferencia')) return 'corporate';
  if (normalized.includes('cumpleanos') || normalized.includes('birthday')) return 'birthday';
  if (normalized.includes('quinceanera') || normalized.includes('quince')) return 'quinceanera';
  if (normalized.includes('concierto') || normalized.includes('concert')) return 'concert';
  if (normalized.includes('privad') || normalized.includes('private')) return 'private';

  return 'other';
};

export function EventManager({ events, onCreateEvent, onUpdateEvent, onDeleteEvent, eventToEdit, onEditComplete }: EventManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    eventType: '',
    location: '',
    budget: '',
    status: 'planning' as Event['status']
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      eventDate: '',
      eventType: '',
      location: '',
      budget: '',
      status: 'planning'
    });
    setEditingEvent(null);
  };

  // Handle external event edit request
  useEffect(() => {
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setFormData({
        name: eventToEdit.name,
        description: eventToEdit.description || '',
        eventDate: eventToEdit.eventDate || '',
        eventType: normalizeEventTypeValue(eventToEdit.eventType),
        location: eventToEdit.location || '',
        budget: eventToEdit.budget?.toString() || '',
        status: eventToEdit.status
      });
      setIsDialogOpen(true);
    }
  }, [eventToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...(editingEvent ? {} : { userId: 'current-user-id' }), // Only include userId when creating new event
      name: formData.name,
      description: formData.description || undefined,
      eventDate: formData.eventDate || undefined,
      eventType: normalizeEventTypeValue(formData.eventType) || undefined,
      location: formData.location || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      status: formData.status,
      contractIds: editingEvent?.contractIds || []
    };

    if (editingEvent) {
      onUpdateEvent(editingEvent.id, eventData);
    } else {
      onCreateEvent(eventData);
    }

    setIsDialogOpen(false);
    resetForm();
    if (onEditComplete) {
      onEditComplete();
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      eventDate: event.eventDate || '',
      eventType: normalizeEventTypeValue(event.eventType),
      location: event.location || '',
      budget: event.budget?.toString() || '',
      status: event.status
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = () => {
    if (eventToDelete) {
      onDeleteEvent(eventToDelete);
      setEventToDelete(null);
    }
  };

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
          if (onEditComplete) {
            onEditComplete();
          }
        }
      }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo Evento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? 'Actualiza la información de tu evento' 
                : 'Crea un evento para agrupar todas las reservas de servicios'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Evento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Boda de María y Juan"
                required
              />
            </div>

            <div>
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type, index) => (
                    <SelectItem key={`${type.value}-${index}`} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eventDate">Fecha del Evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="[color-scheme:light] text-[#0A1F44]"
              />
            </div>

            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Salón de Eventos Los Jardines"
              />
            </div>

            <div>
              <Label htmlFor="budget">Presupuesto Total</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles adicionales sobre el evento..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value: Event['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planificando</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingEvent ? 'Actualizar' : 'Crear'} Evento
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirmed}
        title="¿Eliminar este evento?"
        description="¿Estás seguro de que deseas eliminar este evento? Las reservas no se eliminarán, solo se desagruparán del evento."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
