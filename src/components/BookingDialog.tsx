import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Check, FileText, FolderOpen } from 'lucide-react';
import { Artist, ServicePlan, Contract, User, Booking, Event } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ContractView } from './ContractView';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BookingDialogProps {
  artist: Artist | null;
  selectedPlan?: ServicePlan | null;
  open: boolean;
  onClose: () => void;
  onContractCreated?: (contract: Contract) => void;
  onBookingCreated?: (booking: Booking) => void;
  onBookingUpdate?: (booking: Booking) => void;
  user: User | null;
  onLoginRequired?: () => void;
  events?: Event[]; // Lista de eventos del usuario
}

export function BookingDialog({ artist, selectedPlan, open, onClose, onContractCreated, onBookingCreated, onBookingUpdate, user, onLoginRequired, events = [] }: BookingDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [formData, setFormData] = useState({
    clientName: user?.name || '',
    clientEmail: user?.email || '',
    clientPhone: user?.phone || '',
    date: '',
    startTime: '',
    duration: selectedPlan?.duration.toString() || '2',
    eventType: '',
    location: '',
    specialRequests: '',
    planId: selectedPlan?.id || ''
  });

  const [showContract, setShowContract] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        duration: selectedPlan.duration.toString(),
        planId: selectedPlan.id
      }));
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: user.phone || prev.clientPhone
      }));
    }
  }, [user]);

  // Mapear el tipo de evento del Event a los valores del select
  const mapEventType = (eventType?: string): string => {
    if (!eventType) return '';
    const type = eventType.toLowerCase();
    if (type.includes('boda')) return 'wedding';
    if (type.includes('corporativ')) return 'corporate';
    if (type.includes('cumpleaños') || type.includes('birthday')) return 'birthday';
    if (type.includes('quinceañera') || type.includes('quince')) return 'quinceanera';
    if (type.includes('concierto') || type.includes('concert')) return 'concert';
    if (type.includes('privada') || type.includes('private')) return 'private';
    return 'other';
  };

  // Auto-llenar campos cuando se selecciona un evento
  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'new') {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (selectedEvent) {
        setFormData(prev => ({
          ...prev,
          date: selectedEvent.eventDate || prev.date,
          eventType: mapEventType(selectedEvent.eventType) || prev.eventType,
          location: selectedEvent.location || prev.location
        }));
      }
    }
  }, [selectedEventId, events]);

  if (!artist) return null;

  const selectedServicePlan = selectedPlan || (formData.planId ? artist.servicePlans?.find(p => p.id === formData.planId) : null);
  const totalPrice = selectedServicePlan ? selectedServicePlan.price : artist.pricePerHour * parseInt(formData.duration || '0');
  const isEventSelected = selectedEventId && selectedEventId !== 'new';
  const userEvents = events.filter(e => e.userId === user?.id && e.status !== 'cancelled');

  const generateContract = (): Contract => {
    const bookingId = `BK-${Date.now()}`;
    const contractId = `CT-${Date.now()}`;
    
    const serviceDescription = selectedServicePlan
      ? `${selectedServicePlan.name}: ${selectedServicePlan.description}\n\nIncluye:\n${selectedServicePlan.includes.map(item => `• ${item}`).join('\n')}`
      : `Servicio de ${artist.category} - ${formData.eventType || 'Evento personalizado'}`;

    // Use custom terms from service, or fallback to default
    const serviceTerms = artist.customTerms || {
      paymentTerms: 'Se requiere un depósito del 50% para confirmar la reserva. El saldo restante debe pagarse 7 días antes del evento. Los pagos pueden realizarse mediante transferencia bancaria, tarjeta de crédito o efectivo.',
      cancellationPolicy: 'Cancelaciones con más de 30 días de anticipación: reembolso completo del depósito. Cancelaciones entre 15-30 días: reembolso del 50%. Cancelaciones con menos de 15 días: sin reembolso. En caso de emergencia o enfermedad grave, se evaluarán excepciones caso por caso.',
      additionalTerms: [
        'El proveedor se compromete a llegar al lugar del evento con 30 minutos de anticipación para preparación.',
        'El cliente debe proporcionar un espacio adecuado y acceso a electricidad si es necesario.',
        'Cualquier solicitud especial o cambio en el servicio debe comunicarse con al menos 7 días de anticipación.',
        'El proveedor se reserva el derecho de usar fotografías del evento para promoción, a menos que se acuerde lo contrario.',
        'En caso de fuerza mayor (clima extremo, emergencias), ambas partes acordarán reprogramar sin penalización.',
        'Ambas partes acuerdan resolver cualquier disputa mediante mediación antes de proceder legalmente.'
      ]
    };

    // Build additional terms array including special requests
    const additionalTerms = [...serviceTerms.additionalTerms];
    if (formData.specialRequests) {
      additionalTerms.push(`Solicitudes especiales del cliente: ${formData.specialRequests}`);
    }

    return {
      id: contractId,
      bookingId,
      artistId: artist.id,
      artistName: artist.name,
      artistEmail: artist.email,
      artistWhatsapp: artist.whatsappNumber,
      clientId: user?.id,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientWhatsapp: user?.whatsappNumber || formData.clientPhone,
      eventId: isEventSelected ? selectedEventId : undefined,
      createdAt: new Date().toISOString(),
      terms: {
        serviceDescription,
        price: totalPrice,
        duration: parseInt(formData.duration),
        date: formData.date,
        startTime: formData.startTime,
        location: formData.location,
        paymentTerms: serviceTerms.paymentTerms,
        cancellationPolicy: serviceTerms.cancellationPolicy,
        additionalTerms: additionalTerms
      },
      status: 'pending_client'
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      toast.error('Debes iniciar sesión para hacer una reserva');
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }
    
    // Check if user is trying to book their own service
    if (artist.userId === user.id) {
      toast.error('No puedes reservar tu propia publicación');
      onClose();
      return;
    }
    
    // Generate contract
    const contract = generateContract();
    setGeneratedContract(contract);
    
    // Generate booking
    const booking: Booking = {
      id: contract.bookingId,
      artistId: artist.id,
      artistName: artist.name,
      userId: user.id,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      date: formData.date,
      startTime: formData.startTime,
      duration: parseInt(formData.duration),
      eventType: formData.eventType,
      location: formData.location,
      specialRequests: formData.specialRequests,
      totalPrice: totalPrice,
      status: 'pending',
      planId: formData.planId || undefined,
      planName: selectedServicePlan?.name,
      contractId: contract.id
    };
    setGeneratedBooking(booking);
    
    // Create booking immediately
    if (onBookingCreated) {
      onBookingCreated(booking);
    }
    
    setShowContract(true);
  };

  const handleContractSigned = async (signedContract: Contract) => {
    if (onContractCreated) {
      onContractCreated(signedContract);
    }
    
    // Send notification to provider when client signs
    if (signedContract.clientSignature && signedContract.artistEmail) {
      try {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb/notifications/contract-signed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            recipientEmail: signedContract.artistEmail,
            recipientName: signedContract.artistName,
            signerName: signedContract.clientName,
            serviceName: artist.name,
            eventDate: new Date(signedContract.terms.date).toLocaleDateString('es-ES'),
            contractId: signedContract.id,
            bothPartiesSigned: false
          })
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
    
    // Booking stays in 'pending' status when client signs
    // It will be confirmed only when provider signs the contract
    
    toast.success('¡Contrato firmado! El proveedor revisará tu solicitud y confirmará la reserva.');
    
    // Cerrar ambos modales después de firmar
    setShowContract(false);
    onClose();
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar a {artist.name}</DialogTitle>
          <DialogDescription>
            Completa el formulario para solicitar una reserva. El proveedor responderá en {artist.responseTime}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Plan Info */}
          {selectedServicePlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">Plan Seleccionado</Badge>
                  </div>
                  <h4 className="text-sm mb-1">{selectedServicePlan.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{selectedServicePlan.description}</p>
                  <div className="space-y-1">
                    {selectedServicePlan.includes.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {selectedServicePlan.includes.length > 3 && (
                      <p className="text-xs text-gray-500 ml-4">
                        +{selectedServicePlan.includes.length - 3} más...
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-gray-600 text-xs">Precio</p>
                  <p className="text-green-600">${selectedServicePlan.price}</p>
                  <p className="text-xs text-gray-500">{selectedServicePlan.duration}h</p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Selection (if no plan pre-selected) */}
          {!selectedPlan && artist.servicePlans && artist.servicePlans.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="planSelect" className="mb-1 block">Seleccionar Plan (Opcional)</Label>
              <Select 
                value={formData.planId || 'custom'} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setFormData({ 
                      ...formData, 
                      planId: '',
                      duration: '2'
                    });
                  } else {
                    const plan = artist.servicePlans?.find(p => p.id === value);
                    setFormData({ 
                      ...formData, 
                      planId: value,
                      duration: plan ? plan.duration.toString() : formData.duration
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reserva personalizada o selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Reserva personalizada</SelectItem>
                  {artist.servicePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price} ({plan.duration}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client Information */}
          <div className="space-y-3">
            <h3 className="text-sm">Tu Información</h3>
            
            <div>
              <Label htmlFor="name" className="mb-1 block">Nombre Completo *</Label>
              <Input
                id="name"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Juan Pérez"
                disabled={!!user}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="mb-1 block">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="juan@ejemplo.com"
                  disabled={!!user}
                />
              </div>
              <div>
                <Label htmlFor="phone" className="mb-1 block">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm">Detalles del Evento</h3>

            {/* Event Selection */}
            {userEvents.length > 0 && (
              <div>
                <Label htmlFor="eventSelect" className="mb-1 block">Asociar a un Evento (Opcional)</Label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Select 
                    value={selectedEventId || 'new'} 
                    onValueChange={(value) => setSelectedEventId(value === 'new' ? '' : value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Nueva reserva independiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nueva reserva independiente</SelectItem>
                      {userEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} {event.eventDate ? `- ${new Date(event.eventDate).toLocaleDateString('es-ES')}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isEventSelected && (
                  <p className="text-xs text-blue-600 mt-1">
                    Los campos de fecha, tipo de evento y ubicación se tomarán del evento seleccionado
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date" className="mb-1 block">
                  Fecha del Evento *
                  {isEventSelected && <Badge variant="secondary" className="ml-2 text-xs">Del evento</Badge>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isEventSelected}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startTime" className="mb-1 block">Hora de inicio del servicio *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="startTime"
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="duration" className="mb-1 block">Duración (horas) *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Select 
                  value={formData.duration} 
                  onValueChange={(value) => setFormData({ ...formData, duration: value, planId: '' })}
                  disabled={!!selectedServicePlan}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} {hours === 1 ? 'hora' : 'horas'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="eventType" className="mb-1 block">
                Tipo de Evento *
                {isEventSelected && <Badge variant="secondary" className="ml-2 text-xs">Del evento</Badge>}
              </Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                disabled={isEventSelected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Boda</SelectItem>
                  <SelectItem value="corporate">Evento Corporativo</SelectItem>
                  <SelectItem value="birthday">Fiesta de Cumpleaños</SelectItem>
                  <SelectItem value="quinceanera">Quinceañera</SelectItem>
                  <SelectItem value="concert">Concierto</SelectItem>
                  <SelectItem value="private">Fiesta Privada</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location" className="mb-1 block">
                Ubicación del Evento *
                {isEventSelected && <Badge variant="secondary" className="ml-2 text-xs">Del evento</Badge>}
              </Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ciudad, Estado o Dirección Completa"
                disabled={isEventSelected}
              />
            </div>

            <div className="">
              <Label htmlFor="requests" className="mb-1 block">Solicitudes Especiales (Opcional)</Label>
              <Textarea
                id="requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Detalles especiales, requisitos o información que el proveedor deba saber..."
                rows={3}
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {selectedServicePlan ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span>{selectedServicePlan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duración</span>
                  <span>{selectedServicePlan.duration} {selectedServicePlan.duration === 1 ? 'hora' : 'horas'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Precio Total</span>
                  </span>
                  <span className="text-green-600">${totalPrice}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tarifa por hora</span>
                  <span>${artist.pricePerHour}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duración</span>
                  <span>{formData.duration} {parseInt(formData.duration) === 1 ? 'hora' : 'horas'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Total Estimado</span>
                  </span>
                  <span className="text-green-600">${totalPrice}</span>
                </div>
              </>
            )}
            <p className="text-xs text-gray-500 pt-2">
              {selectedServicePlan 
                ? 'El precio incluye todo lo mencionado en el plan. El proveedor confirmará los detalles finales.'
                : 'El precio final puede variar según los requisitos específicos y será confirmado por el proveedor.'
              }
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Revisar Contrato y Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Contract Review Dialog */}
      <ContractView
        contract={generatedContract}
        open={showContract}
        onClose={() => setShowContract(false)}
        userType="client"
        onSign={handleContractSigned}
      />
    </Dialog>
  );
}
