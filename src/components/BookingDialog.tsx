import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Check, FileText } from 'lucide-react';
import { Artist, ServicePlan, Contract } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ContractView } from './ContractView';
import { toast } from 'sonner@2.0.3';

interface BookingDialogProps {
  artist: Artist | null;
  selectedPlan?: ServicePlan | null;
  open: boolean;
  onClose: () => void;
  onContractCreated?: (contract: Contract) => void;
}

export function BookingDialog({ artist, selectedPlan, open, onClose, onContractCreated }: BookingDialogProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    duration: selectedPlan?.duration.toString() || '2',
    eventType: '',
    location: '',
    specialRequests: '',
    planId: selectedPlan?.id || ''
  });

  const [showContract, setShowContract] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        duration: selectedPlan.duration.toString(),
        planId: selectedPlan.id
      }));
    }
  }, [selectedPlan]);

  if (!artist) return null;

  const selectedServicePlan = selectedPlan || (formData.planId ? artist.servicePlans?.find(p => p.id === formData.planId) : null);
  const totalPrice = selectedServicePlan ? selectedServicePlan.price : artist.pricePerHour * parseInt(formData.duration || '0');

  const generateContract = (): Contract => {
    const bookingId = `BK-${Date.now()}`;
    const contractId = `CT-${Date.now()}`;
    
    const serviceDescription = selectedServicePlan
      ? `${selectedServicePlan.name}: ${selectedServicePlan.description}\n\nIncluye:\n${selectedServicePlan.includes.map(item => `• ${item}`).join('\n')}`
      : `Servicio de ${artist.category} - ${formData.eventType || 'Evento personalizado'}`;

    return {
      id: contractId,
      bookingId,
      artistName: artist.name,
      clientName: formData.clientName,
      createdAt: new Date().toISOString(),
      terms: {
        serviceDescription,
        price: totalPrice,
        duration: parseInt(formData.duration),
        date: formData.date,
        location: formData.location,
        paymentTerms: 'Se requiere un depósito del 50% para confirmar la reserva. El saldo restante debe pagarse 7 días antes del evento. Los pagos pueden realizarse mediante transferencia bancaria, tarjeta de crédito o efectivo.',
        cancellationPolicy: 'Cancelaciones con más de 30 días de anticipación: reembolso completo del depósito. Cancelaciones entre 15-30 días: reembolso del 50%. Cancelaciones con menos de 15 días: sin reembolso. En caso de emergencia o enfermedad grave, se evaluarán excepciones caso por caso.',
        additionalTerms: [
          'El artista se compromete a llegar al lugar del evento con 30 minutos de anticipación para preparación.',
          'El cliente debe proporcionar un espacio adecuado y acceso a electricidad si es necesario.',
          'Cualquier solicitud especial o cambio en el servicio debe comunicarse con al menos 7 días de anticipación.',
          'El artista se reserva el derecho de usar fotografías del evento para promoción, a menos que se acuerde lo contrario.',
          'En caso de fuerza mayor (clima extremo, emergencias), ambas partes acordarán reprogramar sin penalización.',
          'Ambas partes acuerdan resolver cualquier disputa mediante mediación antes de proceder legalmente.',
          formData.specialRequests ? `Solicitudes especiales del cliente: ${formData.specialRequests}` : ''
        ].filter(Boolean)
      },
      status: 'pending_client'
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate contract
    const contract = generateContract();
    setGeneratedContract(contract);
    setShowContract(true);
  };

  const handleContractSigned = (signedContract: Contract) => {
    if (onContractCreated) {
      onContractCreated(signedContract);
    }
    
    toast.success('¡Reserva creada! El artista revisará y firmará el contrato.');
    
    // Reset form
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      date: '',
      duration: '2',
      eventType: '',
      location: '',
      specialRequests: '',
      planId: ''
    });
    
    setShowContract(false);
    setGeneratedContract(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {artist.name}</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a booking. The artist will respond within {artist.responseTime}.
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
              <Label htmlFor="planSelect">Seleccionar Plan (Opcional)</Label>
              <Select 
                value={formData.planId} 
                onValueChange={(value) => {
                  const plan = artist.servicePlans?.find(p => p.id === value);
                  setFormData({ 
                    ...formData, 
                    planId: value,
                    duration: plan ? plan.duration.toString() : formData.duration
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reserva personalizada o selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Reserva personalizada</SelectItem>
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
            <h3 className="text-sm">Your Information</h3>
            
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
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
            <h3 className="text-sm">Event Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Event Date *</Label>
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
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours) *</Label>
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
                          {hours} {hours === 1 ? 'hour' : 'hours'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="eventType">Event Type *</Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="birthday">Birthday Party</SelectItem>
                  <SelectItem value="quinceanera">Quinceañera</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="private">Private Party</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Event Location *</Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State or Full Address"
              />
            </div>

            <div>
              <Label htmlFor="requests">Special Requests (Optional)</Label>
              <Textarea
                id="requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Any special songs, requirements, or details the artist should know..."
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
                  <span className="text-gray-600">Rate per hour</span>
                  <span>${artist.pricePerHour}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{formData.duration} {parseInt(formData.duration) === 1 ? 'hour' : 'hours'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Estimated Total</span>
                  </span>
                  <span className="text-green-600">${totalPrice}</span>
                </div>
              </>
            )}
            <p className="text-xs text-gray-500 pt-2">
              {selectedServicePlan 
                ? 'El precio incluye todo lo mencionado en el plan. El artista confirmará los detalles finales.'
                : 'Final price may vary based on specific requirements and will be confirmed by the artist.'
              }
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
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
