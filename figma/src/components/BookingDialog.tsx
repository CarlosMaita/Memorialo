import { useState, useEffect, type FormEvent } from 'react';
import { Calendar, Clock, DollarSign, Check, FileText, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onBookingConfirmed?: (payload: { booking: Booking; contract: Contract; artist: Artist; planName?: string }) => void;
  user: User | null;
  onLoginRequired?: () => void;
  onSaveContactDetails?: (updates: Partial<User>) => Promise<void>;
  events?: Event[]; // Lista de eventos del usuario
}

const EVENT_TYPE_OPTIONS = [
  { value: 'wedding', label: 'Boda' },
  { value: 'corporate', label: 'Evento Corporativo' },
  { value: 'birthday', label: 'Fiesta de Cumpleaños' },
  { value: 'quinceanera', label: 'Quinceañera' },
  { value: 'concert', label: 'Concierto' },
  { value: 'private', label: 'Fiesta Privada' },
  { value: 'other', label: 'Otro' },
] as const;

type BookingStep = 'plan' | 'contact' | 'event' | 'summary';

const BOOKING_STEPS: Array<{ id: BookingStep; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'contact', label: 'Contacto' },
  { id: 'event', label: 'Evento' },
  { id: 'summary', label: 'Resumen' },
];

const normalizeText = (value?: string): string => {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export function BookingDialog({ artist, selectedPlan, open, onClose, onContractCreated, onBookingCreated, onBookingUpdate, onBookingConfirmed, user, onLoginRequired, onSaveContactDetails, events = [] }: BookingDialogProps) {
  const allowCustomHourly = artist?.allowCustomHourly === true;

  const getPlanSaleType = (plan?: ServicePlan | null): 'time' | 'unit' => {
    return (plan as any)?.saleType === 'unit' ? 'unit' : 'time';
  };

  const formatPlanMeasure = (plan?: ServicePlan | null) => {
    if (!plan) return '';

    if (getPlanSaleType(plan) === 'unit') {
      return `${plan.duration} ${String((plan as any)?.unitLabel || 'unidad(es)')}`;
    }

    return `${plan.duration} ${plan.duration === 1 ? 'hora' : 'horas'}`;
  };

  const buildPlanOptionValue = (plan: ServicePlan, index: number): string => {
    const rawId = (plan as any)?.id;
    return rawId !== undefined && rawId !== null && rawId !== ''
      ? `plan:${String(rawId)}`
      : `idx:${index}`;
  };

  const getPlanByOptionValue = (value: string): ServicePlan | null => {
    if (!artist?.servicePlans?.length || value === 'custom') {
      return null;
    }

    return artist.servicePlans.find((plan, index) => buildPlanOptionValue(plan, index) === value) || null;
  };

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedPlanValue, setSelectedPlanValue] = useState<string>('custom');
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
    planId: selectedPlan?.id ? String(selectedPlan.id) : ''
  });

  const [showContract, setShowContract] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('plan');
  const [savingContactData, setSavingContactData] = useState(false);

  useEffect(() => {
    if (!open || !artist) {
      return;
    }

    if (selectedPlan) {
      const matchingOption = artist.servicePlans?.findIndex((plan) => String((plan as any)?.id) === String((selectedPlan as any)?.id));
      const planOption = matchingOption !== undefined && matchingOption !== -1
        ? buildPlanOptionValue(artist.servicePlans[matchingOption], matchingOption)
        : `plan:${String((selectedPlan as any)?.id)}`;

      setSelectedPlanValue(planOption);
      setFormData(prev => ({
        ...prev,
        duration: selectedPlan.duration.toString(),
        planId: String(selectedPlan.id)
      }));
      return;
    }

    // If custom hourly is disabled, enforce selecting an explicit service plan.
    if (open && !allowCustomHourly && artist?.servicePlans?.length) {
      const firstPlan = artist.servicePlans[0];
      setSelectedPlanValue(buildPlanOptionValue(firstPlan, 0));
      setFormData(prev => ({
        ...prev,
        duration: firstPlan.duration.toString(),
        planId: String(firstPlan.id)
      }));
      return;
    }

    setSelectedPlanValue('custom');
    setFormData(prev => ({
      ...prev,
      duration: '2',
      planId: ''
    }));
  }, [selectedPlan, open, allowCustomHourly, artist?.servicePlans]);

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

  useEffect(() => {
    if (!open) {
      setCurrentStep('plan');
      setShowContract(false);
      setGeneratedContract(null);
      setGeneratedBooking(null);
      return;
    }

    setCurrentStep('plan');
  }, [open, artist?.id, selectedPlan?.id]);

  // Mapear el tipo de evento del Event a los valores del select
  const mapEventType = (eventType?: string): string => {
    if (!eventType) return '';
    const type = normalizeText(eventType);

    if (EVENT_TYPE_OPTIONS.some((option) => option.value === type)) return type;
    if (type.includes('boda') || type.includes('wedding')) return 'wedding';
    if (type.includes('corporativ') || type.includes('corporate') || type.includes('empresa')) return 'corporate';
    if (type.includes('cumpleanos') || type.includes('birthday')) return 'birthday';
    if (type.includes('quinceanera') || type.includes('quince')) return 'quinceanera';
    if (type.includes('concierto') || type.includes('concert')) return 'concert';
    if (type.includes('privad') || type.includes('private')) return 'private';
    if (type.includes('otro') || type.includes('other')) return 'other';

    return 'other';
  };

  const selectedEvent = selectedEventId && selectedEventId !== 'new'
    ? events.find((event) => event.id === selectedEventId)
    : undefined;
  const mappedSelectedEventType = mapEventType(selectedEvent?.eventType);

  // Auto-llenar campos cuando se selecciona un evento
  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'new') {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const mappedEventType = mapEventType(selectedEvent?.eventType);

      if (selectedEvent) {
        setFormData(prev => ({
          ...prev,
          date: selectedEvent.eventDate || prev.date,
          eventType: mappedEventType || prev.eventType,
          location: selectedEvent.location || prev.location
        }));
      }
    }
  }, [selectedEventId, events]);

  if (!artist) return null;

  const selectedServicePlan = selectedPlan || getPlanByOptionValue(selectedPlanValue) || (formData.planId ? artist.servicePlans?.find(p => String((p as any).id) === formData.planId) : null);
  const selectedPlanSaleType = getPlanSaleType(selectedServicePlan);
  const selectedPlanMeasureLabel = selectedPlanSaleType === 'unit'
    ? String((selectedServicePlan as any)?.unitLabel || 'unidad(es)')
    : 'hora(s)';
  const totalPrice = selectedServicePlan ? selectedServicePlan.price : artist.pricePerHour * parseInt(formData.duration || '0');
  const isEventSelected = selectedEventId && selectedEventId !== 'new';
  const isEventTypeLocked = Boolean(isEventSelected && mappedSelectedEventType);
  const userEvents = events.filter(e => e.userId === user?.id && e.status !== 'cancelled');
  const currentStepIndex = BOOKING_STEPS.findIndex((step) => step.id === currentStep);

  const validatePlanStep = () => {
    if (!allowCustomHourly && !selectedServicePlan) {
      toast.error('Selecciona un plan para continuar');
      return false;
    }

    return true;
  };

  const validateContactStep = () => {
    if (!formData.clientName.trim()) {
      toast.error('Ingresa tu nombre completo');
      return false;
    }

    if (!formData.clientEmail.trim()) {
      toast.error('Ingresa tu correo electrónico');
      return false;
    }

    if (!formData.clientPhone.trim()) {
      toast.error('Ingresa tu teléfono de contacto');
      return false;
    }

    return true;
  };

  const validateEventStep = () => {
    if (!formData.date) {
      toast.error('Selecciona la fecha del evento');
      return false;
    }

    if (!formData.startTime) {
      toast.error('Indica la hora de inicio');
      return false;
    }

    if (!selectedServicePlan && !formData.duration) {
      toast.error('Selecciona la duración del servicio');
      return false;
    }

    if (!formData.eventType) {
      toast.error('Selecciona el tipo de evento');
      return false;
    }

    if (!formData.location.trim()) {
      toast.error('Indica la ubicación del evento');
      return false;
    }

    return true;
  };

  const persistContactDataIfNeeded = async () => {
    if (!user || !onSaveContactDetails) {
      return;
    }

    const normalizedPhone = formData.clientPhone.trim();
    const normalizedStoredPhone = (user.phone || '').trim();
    const normalizedStoredWhatsapp = (user.whatsappNumber || '').trim();

    const updates: Partial<User> = {};

    if (normalizedPhone && normalizedPhone !== normalizedStoredPhone) {
      updates.phone = normalizedPhone;
    }

    if (normalizedPhone && !normalizedStoredWhatsapp) {
      updates.whatsappNumber = normalizedPhone;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    try {
      setSavingContactData(true);
      await onSaveContactDetails(updates);
      toast.success('Guardamos tu número para próximas reservas');
    } catch (error) {
      console.error('Error saving booking contact details:', error);
      toast.error('No se pudo guardar el teléfono automáticamente, pero puedes continuar');
    } finally {
      setSavingContactData(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 'plan') {
      if (!validatePlanStep()) {
        return;
      }

      setCurrentStep('contact');
      return;
    }

    if (currentStep === 'contact') {
      if (!validateContactStep()) {
        return;
      }

      await persistContactDataIfNeeded();
      setCurrentStep('event');
      return;
    }

    if (currentStep === 'event') {
      if (!validateEventStep()) {
        return;
      }

      setCurrentStep('summary');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'summary') {
      setCurrentStep('event');
      return;
    }

    if (currentStep === 'event') {
      setCurrentStep('contact');
      return;
    }

    if (currentStep === 'contact') {
      setCurrentStep('plan');
    }
  };

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
      artistUserId: artist.userId,
      artistName: artist.name,
      artistEmail: artist.email,
      artistWhatsapp: artist.whatsappNumber,
      clientId: user?.id,
      clientName: user?.name || formData.clientName,
      clientEmail: formData.clientEmail,
      clientWhatsapp: user?.whatsappNumber || formData.clientPhone,
      eventId: isEventSelected ? selectedEventId : undefined,
      createdAt: new Date().toISOString(),
      terms: {
        serviceDescription,
        price: totalPrice,
        duration: parseInt(formData.duration),
        measureType: selectedPlanSaleType,
        measureLabel: selectedPlanMeasureLabel,
        date: formData.date,
        startTime: formData.startTime,
        location: formData.location,
        paymentTerms: serviceTerms.paymentTerms,
        cancellationPolicy: serviceTerms.cancellationPolicy,
        additionalTerms: additionalTerms
      },
      metadata: {
        saleType: selectedPlanSaleType,
        unitLabel: selectedPlanMeasureLabel,
        planId: formData.planId || undefined,
        planName: selectedServicePlan?.name,
        clientLegalName: user?.name || formData.clientName,
        providerBusinessName: String((artist as any).providerBusinessName || artist.name),
        providerRepresentativeName: String((artist as any).providerRepresentativeName || (artist as any).providerUserName || artist.name),
      },
      status: 'pending_client'
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (currentStep !== 'summary') {
      void handleNextStep();
      return;
    }

    if (!validatePlanStep() || !validateContactStep() || !validateEventStep()) {
      return;
    }
    
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
      artistUserId: artist.userId,
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
      metadata: {
        saleType: selectedPlanSaleType,
        unitLabel: selectedPlanMeasureLabel,
      },
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
    setGeneratedContract(signedContract);

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
    toast.success('¡Reserva realizada! Redirigiendo a la confirmación.');

    if (generatedBooking && onBookingConfirmed) {
      onBookingConfirmed({
        booking: generatedBooking,
        contract: signedContract,
        artist,
        planName: selectedServicePlan?.name,
      });
    }

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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BOOKING_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`rounded-lg border px-3 py-2 text-xs md:text-sm transition-colors ${
                    isActive
                      ? 'border-[#D4AF37] bg-amber-50 text-[#1B2A47]'
                      : isCompleted
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#1B2A47]'
                        : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </span>
                    <span className="font-medium">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep === 'plan' && (
            <div className="space-y-4">
              {selectedServicePlan ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">Plan seleccionado</Badge>
                      </div>
                      <h4 className="text-sm mb-1">{selectedServicePlan.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{selectedServicePlan.description}</p>
                      <div className="space-y-1">
                        {(selectedServicePlan.includes || []).slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-xs">Precio</p>
                      <p className="text-green-600 font-semibold">${totalPrice}</p>
                      <p className="text-xs text-gray-500">{formatPlanMeasure(selectedServicePlan)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  Puedes hacer una reserva personalizada o elegir uno de los planes disponibles.
                </div>
              )}

              {!selectedPlan && artist.servicePlans && artist.servicePlans.length > 0 && (
                <div className="space-y-3">
                  <Label htmlFor="planSelect" className="mb-1 block">{allowCustomHourly ? 'Seleccionar Plan (Opcional)' : 'Seleccionar Plan *'}</Label>
                  <Select 
                    value={selectedPlanValue} 
                    onValueChange={(value) => {
                      setSelectedPlanValue(value);

                      if (value === 'custom') {
                        setFormData({ 
                          ...formData, 
                          planId: '',
                          duration: '2'
                        });
                      } else {
                        const plan = getPlanByOptionValue(value);
                        setFormData({ 
                          ...formData, 
                          planId: plan?.id ? String((plan as any).id) : value,
                          duration: plan ? plan.duration.toString() : formData.duration
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={allowCustomHourly ? 'Reserva personalizada o selecciona un plan' : 'Selecciona un plan'} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowCustomHourly && (
                        <SelectItem value="custom">Reserva personalizada</SelectItem>
                      )}
                      {artist.servicePlans.map((plan, index) => (
                        <SelectItem key={buildPlanOptionValue(plan, index)} value={buildPlanOptionValue(plan, index)}>
                          {plan.name} - ${plan.price} ({formatPlanMeasure(plan)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {selectedServicePlan ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span>{selectedServicePlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{getPlanSaleType(selectedServicePlan) === 'unit' ? 'Cantidad' : 'Duración'}</span>
                      <span>{formatPlanMeasure(selectedServicePlan)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Precio total</span>
                      </span>
                      <span className="text-green-600 font-semibold">${totalPrice}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tarifa por hora</span>
                      <span>${artist.pricePerHour}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Total estimado inicial</span>
                      </span>
                      <span className="text-green-600 font-semibold">${totalPrice}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === 'contact' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Confirma tus datos de contacto. Tu número quedará guardado para futuras reservas.
              </div>

              <div className="space-y-3">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {user && (
                      <p className="text-xs text-gray-500 mt-1">Usaremos este número para autocompletar próximas reservas.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'event' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm">Detalles del Evento</h3>

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
                        Los campos de fecha, tipo de evento y ubicación se tomarán del evento seleccionado.
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <Label htmlFor="duration" className="mb-1 block">
                    {selectedServicePlan && getPlanSaleType(selectedServicePlan) === 'unit' ? 'Cantidad' : 'Duración (horas)'} *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {selectedServicePlan ? (
                      <Input
                        id="duration"
                        value={formatPlanMeasure(selectedServicePlan)}
                        className="pl-10"
                        disabled
                      />
                    ) : (
                      <Select
                        value={formData.duration}
                        onValueChange={(value) => setFormData({ ...formData, duration: value, planId: '' })}
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
                    )}
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
                    disabled={isEventTypeLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEventSelected && !mappedSelectedEventType && (
                    <p className="text-xs text-amber-600 mt-1">
                      El evento seleccionado no tiene un tipo válido; puedes elegirlo manualmente.
                    </p>
                  )}
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

                <div>
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
            </div>
          )}

          {currentStep === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Plan</p>
                      <p className="font-medium text-[#1B2A47]">{selectedServicePlan ? selectedServicePlan.name : 'Reserva personalizada'}</p>
                    </div>
                    <Badge variant="secondary">Paso final</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Precio</span>
                      <span className="text-green-600 font-semibold">${totalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{selectedServicePlan ? (getPlanSaleType(selectedServicePlan) === 'unit' ? 'Cantidad' : 'Duración') : 'Duración'}</span>
                      <span>{selectedServicePlan ? formatPlanMeasure(selectedServicePlan) : `${formData.duration} hora(s)`}</span>
                    </div>
                    {selectedServicePlan && (
                      <p className="text-xs text-gray-600">{selectedServicePlan.description}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Contacto</p>
                    <p>{formData.clientName}</p>
                    <p className="text-gray-600">{formData.clientEmail}</p>
                    <p className="text-gray-600">{formData.clientPhone}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Evento</p>
                    <p><strong>Fecha:</strong> {formData.date || 'Sin definir'}</p>
                    <p><strong>Hora:</strong> {formData.startTime || 'Sin definir'}</p>
                    <p><strong>Tipo:</strong> {EVENT_TYPE_OPTIONS.find((option) => option.value === formData.eventType)?.label || 'Sin definir'}</p>
                    <p><strong>Ubicación:</strong> {formData.location || 'Sin definir'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                En el siguiente paso podrás revisar el contrato completo, validar el precio final y firmarlo digitalmente.
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 'plan' ? onClose : handlePreviousStep}
              className="flex-1"
            >
              {currentStep === 'plan' ? (
                'Cancelar'
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Atrás
                </>
              )}
            </Button>

            {currentStep !== 'summary' ? (
              <Button
                type="button"
                onClick={() => void handleNextStep()}
                className="flex-1"
                disabled={savingContactData}
              >
                {currentStep === 'contact' && savingContactData ? 'Guardando...' : 'Continuar'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Revisar contrato y firmar
              </Button>
            )}
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