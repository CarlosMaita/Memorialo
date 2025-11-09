import { useState } from 'react';
import { Calendar, Clock, DollarSign, FileText, Star, CheckCircle, XCircle, AlertCircle, MessageSquare, FolderOpen, Package, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Contract, User, Review, Event } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractView } from './ContractView';
import { EventManager } from './EventManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Label } from './ui/label';

interface ClientDashboardProps {
  contracts: Contract[];
  user: User;
  onReviewCreate: (contractId: string) => void;
  reviews: Review[];
  events: Event[];
  onCreateEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<Event>) => void;
  onDeleteEvent: (eventId: string) => void;
  onAssignContractToEvent: (contractId: string, eventId: string | null) => void;
}

export function ClientDashboard({ 
  contracts, 
  user, 
  onReviewCreate, 
  reviews,
  events,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAssignContractToEvent
}: ClientDashboardProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Filter contracts where current user is the client
  const userContracts = contracts.filter(c => c.clientId === user.id);
  const userEvents = events.filter(e => e.userId === user.id);
  
  // Debug logging
  console.log('ClientDashboard - User ID:', user.id);
  console.log('ClientDashboard - All contracts:', contracts);
  console.log('ClientDashboard - Filtered user contracts:', userContracts);
  console.log('ClientDashboard - User events:', userEvents);

  // Group contracts by event
  const contractsByEvent = new Map<string | null, Contract[]>();
  
  userContracts.forEach(contract => {
    const eventId = contract.eventId || null;
    if (!contractsByEvent.has(eventId)) {
      contractsByEvent.set(eventId, []);
    }
    contractsByEvent.get(eventId)!.push(contract);
  });

  // Contracts without event
  const unassignedContracts = contractsByEvent.get(null) || [];

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'pending_client':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendiente tu firma</Badge>;
      case 'pending_artist':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Esperando artista</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Confirmado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'planning':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Planificando</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Confirmado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canReview = (contract: Contract): boolean => {
    // Can review if contract is completed or event date has passed
    if (contract.status === 'completed') return true;
    
    const eventDate = new Date(contract.terms.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventDate < today;
  };

  const hasReviewed = (contractId: string): boolean => {
    // Verificar si ya existe una reseña para este contrato específico
    return reviews.some(r => r.contractId === contractId);
  };

  const ContractCard = ({ contract, showEventSelector = false }: { contract: Contract, showEventSelector?: boolean }) => {
    const eventDate = new Date(contract.terms.date);
    const isEventPassed = eventDate < new Date();
    const showReview = canReview(contract) && !hasReviewed(contract.id);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm">{contract.artistName}</h3>
                {getStatusBadge(contract.status)}
              </div>
              <p className="text-sm text-gray-600 mb-1">ID: {contract.bookingId}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Event Selector */}
          {showEventSelector && (
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Asignar a Evento</Label>
              <Select 
                value={contract.eventId || 'none'} 
                onValueChange={(value) => onAssignContractToEvent(contract.id, value === 'none' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {userEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p>{eventDate.toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{contract.terms.startTime ? 'Hora y Duración' : 'Duración'}</p>
                <p>
                  {contract.terms.startTime && `${contract.terms.startTime} • `}
                  {contract.terms.duration} {contract.terms.duration === 1 ? 'hora' : 'horas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Precio Total</p>
                <p className="text-green-600">${contract.terms.price}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="line-clamp-1">{contract.terms.location}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Description */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Servicio</p>
            <p className="text-sm text-gray-700 line-clamp-2">{contract.terms.serviceDescription}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedContract(contract);
                setShowContractView(true);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Contrato
            </Button>

            {showReview && (
              <Button 
                size="sm"
                onClick={() => onReviewCreate(contract.id)}
              >
                <Star className="w-4 h-4 mr-2" />
                Dejar Reseña
              </Button>
            )}

            {hasReviewed(contract.id) && (
              <Badge variant="outline" className="ml-auto">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reseña enviada
              </Badge>
            )}
          </div>

          {/* Status Info */}
          {contract.status === 'pending_client' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800">
                  Por favor revisa y firma el contrato para confirmar tu reserva.
                </p>
              </div>
            </div>
          )}

          {contract.status === 'pending_artist' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800">
                  Esperando que el artista revise y firme el contrato.
                </p>
              </div>
            </div>
          )}

          {contract.status === 'active' && !isEventPassed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">
                  ¡Reserva confirmada! Ambas partes han firmado el contrato.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const EventCard = ({ event }: { event: Event }) => {
    const eventContracts = contractsByEvent.get(event.id) || [];
    const totalSpent = eventContracts.reduce((sum, c) => sum + c.terms.price, 0);
    const isExpanded = expandedEvents.has(event.id);

    return (
      <Card className="mb-4">
        <CardHeader>
          <Collapsible open={isExpanded} onOpenChange={() => toggleEventExpanded(event.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-sm">{event.name}</h3>
                  {getEventStatusBadge(event.status)}
                  <Badge variant="outline" className="ml-auto">
                    {eventContracts.length} {eventContracts.length === 1 ? 'servicio' : 'servicios'}
                  </Badge>
                </div>
                {event.eventType && (
                  <p className="text-sm text-gray-600 mb-1">{event.eventType}</p>
                )}
                {event.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {event.eventDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p>{new Date(event.eventDate).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Ubicación</p>
                    <p className="line-clamp-1">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Gastado</p>
                  <p className="text-green-600">${totalSpent.toFixed(2)}</p>
                </div>
              </div>

              {event.budget && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Presupuesto</p>
                    <p className={totalSpent > event.budget ? 'text-red-600' : 'text-gray-700'}>
                      ${event.budget.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <CollapsibleContent className="mt-4 space-y-2">
              <Separator />
              <div className="pt-2">
                <p className="text-sm mb-3">Servicios contratados:</p>
                {eventContracts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay servicios asignados a este evento todavía
                  </p>
                ) : (
                  eventContracts.map(contract => (
                    <ContractCard key={contract.id} contract={contract} showEventSelector={true} />
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-2">Mis Eventos y Reservas</h2>
          <p className="text-gray-600">Organiza tus reservas por eventos</p>
        </div>
        <EventManager
          events={userEvents}
          onCreateEvent={onCreateEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">
            Por Eventos ({userEvents.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas las Reservas ({userContracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Events */}
          {userEvents.length > 0 && (
            <div className="space-y-4">
              {userEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Unassigned Contracts */}
          {unassignedContracts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm">Reservas sin asignar a evento ({unassignedContracts.length})</h3>
              </div>
              {unassignedContracts.map(contract => (
                <ContractCard key={contract.id} contract={contract} showEventSelector={true} />
              ))}
            </div>
          )}

          {userEvents.length === 0 && unassignedContracts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-1">No tienes eventos creados todavía</p>
                <p className="text-sm text-gray-500 mb-4">Crea un evento para organizar tus reservas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {userContracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-1">No tienes reservas todavía</p>
                <p className="text-sm text-gray-500">Explora artistas y haz tu primera reserva</p>
              </CardContent>
            </Card>
          ) : (
            userContracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} showEventSelector={true} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Contract View Dialog */}
      {selectedContract && (
        <ContractView
          contract={selectedContract}
          open={showContractView}
          onClose={() => {
            setShowContractView(false);
            setSelectedContract(null);
          }}
          userType="client"
        />
      )}
    </div>
  );
}
