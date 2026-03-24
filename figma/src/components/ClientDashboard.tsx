import { useEffect, useState } from 'react';
import {
  Calendar, Clock, DollarSign, FileText, Star, CheckCircle, XCircle,
  AlertCircle, MessageSquare, FolderOpen, Package, Edit2, ChevronDown,
  ChevronUp, Eye, Archive, Menu, X, CalendarDays, BookOpen, Activity
} from 'lucide-react';
import { Contract, User, Review, Event } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ContractView } from './ContractView';
import { EventManager } from './EventManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

type SidebarSection = 'events' | 'bookings';

interface ClientDashboardProps {
  contracts: Contract[];
  user: User;
  initialSection?: SidebarSection;
  focusContractId?: string | null;
  onReviewCreate: (contractId: string) => void;
  reviews: Review[];
  events: Event[];
  onCreateEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<Event>) => void;
  onDeleteEvent: (eventId: string) => void;
  onAssignContractToEvent: (contractId: string, eventId: string | null) => void;
  onContractUpdate: (contract: Contract) => void;
  bookings?: any[];
  onBookingUpdate?: (booking: any) => void;
}

const navItems: { id: SidebarSection; label: string; icon: React.ReactNode }[] = [
  { id: 'bookings', label: 'Reservas', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'events',   label: 'Eventos',  icon: <CalendarDays className="w-5 h-5" /> },
];

export function ClientDashboard({
  contracts,
  user,
  initialSection,
  focusContractId,
  onReviewCreate,
  reviews,
  events,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAssignContractToEvent,
  onContractUpdate,
  bookings = [],
  onBookingUpdate
}: ClientDashboardProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getMeasureType = (contract: any): 'time' | 'unit' => {
    if (contract?.metadata?.saleType === 'unit' || contract?.terms?.measureType === 'unit') {
      return 'unit';
    }

    return 'time';
  };

  const getMeasureLabel = (contract: any, amount: number) => {
    if (getMeasureType(contract) === 'unit') {
      return `${amount} ${String(contract?.metadata?.unitLabel || contract?.terms?.measureLabel || 'unidad(es)')}`;
    }

    return `${amount} ${amount === 1 ? 'hora' : 'horas'}`;
  };

  const getMeasureTitle = (contract: any) => {
    if (getMeasureType(contract) === 'unit') {
      return contract?.terms?.startTime ? 'Hora y Cantidad' : 'Cantidad';
    }

    return contract?.terms?.startTime ? 'Hora y Duración' : 'Duración';
  };

  // Filter contracts for current user
  const userContracts = contracts.filter(c => c.clientId === user.id);
  const allUserEvents = events.filter(e => e.userId === user.id);
  const userEvents = showArchived
    ? allUserEvents
    : allUserEvents.filter(e => !e.archived);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Group contracts by event
  const contractsByEvent = new Map<string | null, Contract[]>();
  userContracts.forEach(contract => {
    const eventId = contract.eventId || null;
    if (!contractsByEvent.has(eventId)) contractsByEvent.set(eventId, []);
    contractsByEvent.get(eventId)!.push(contract);
  });
  const unassignedContracts = contractsByEvent.get(null) || [];

  useEffect(() => {
    if (!focusContractId) {
      return;
    }

    setActiveSection('bookings');
    setExpandedContracts((previous) => {
      const next = new Set(previous);
      next.add(focusContractId);
      return next;
    });

    const focusedContract = userContracts.find((contract) => contract.id === focusContractId);
    if (focusedContract) {
      setSelectedContract(focusedContract);
      setShowContractView(true);
    }
  }, [focusContractId, userContracts]);

  // Pending signatures count
  const pendingSignature = userContracts.filter(c => c.status === 'pending_client').length;

  const toggleEventExpanded = (eventId: string) => {
    const s = new Set(expandedEvents);
    s.has(eventId) ? s.delete(eventId) : s.add(eventId);
    setExpandedEvents(s);
  };

  const toggleContractExpanded = (contractId: string) => {
    const s = new Set(expandedContracts);
    s.has(contractId) ? s.delete(contractId) : s.add(contractId);
    setExpandedContracts(s);
  };

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'pending_client':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendiente tu firma</Badge>;
      case 'pending_artist':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Esperando proveedor</Badge>;
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
    if (contract.status === 'completed') return true;
    const eventDate = new Date(contract.terms.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const hasReviewed = (contractId: string): boolean =>
    reviews.some(r => r.contractId === contractId);

  const handleArchiveEvent = (eventId: string, archived: boolean) => {
    onUpdateEvent(eventId, { archived });
  };

  const handleEditEvent = (event: Event) => setEventToEdit(event);
  const handleEditComplete = () => setEventToEdit(null);

  const handleNavClick = (section: SidebarSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#1B2A47]/10">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-0.5">Mis Reservas</p>
        <p className="text-sm text-gray-500 truncate">{user.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const badge =
            item.id === 'bookings' && pendingSignature > 0 ? pendingSignature : null;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#1B2A47] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={isActive ? 'text-[#D4AF37]' : ''}>{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {badge !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#D4AF37] text-[#1B2A47]' : 'bg-yellow-500 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-[#1B2A47] to-[#2d4270] rounded-xl p-3 text-white text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">Resumen</span>
          </div>
          <p className="text-gray-300">
            {userEvents.length} evento{userEvents.length !== 1 ? 's' : ''} · {userContracts.length} reserva{userContracts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );

  // ── Contract card ────────────────────────────────────────────────────────
  const ContractCard = ({ contract, showEventSelector = false }: { contract: Contract; showEventSelector?: boolean }) => {
    const eventDate = new Date(contract.terms.date);
    const isEventPassed = eventDate < new Date();
    const showReview = canReview(contract) && !hasReviewed(contract.id);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-sm">{contract.artistName}</h3>
                {getStatusBadge(contract.status)}
              </div>
              <p className="text-sm text-gray-600 mb-1">ID: {contract.bookingId}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
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
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p>{eventDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{getMeasureTitle(contract)}</p>
                <p>{contract.terms.startTime && `${contract.terms.startTime} • `}{getMeasureLabel(contract, contract.terms.duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Precio Total</p>
                <p className="text-green-600">${contract.terms.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="line-clamp-1">{contract.terms.location}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-gray-500 mb-1">Servicio</p>
            <p className="text-sm text-gray-700 line-clamp-2">{contract.terms.serviceDescription}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedContract(contract); setShowContractView(true); }}
              className="w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Contrato
            </Button>
            {showReview && (
              <Button size="sm" onClick={() => onReviewCreate(contract.id)} className="w-full sm:w-auto">
                <Star className="w-4 h-4 mr-2" />
                Dejar Reseña
              </Button>
            )}
            {hasReviewed(contract.id) && (
              <Badge variant="outline" className="sm:ml-auto w-full sm:w-auto justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reseña enviada
              </Badge>
            )}
          </div>

          {contract.status === 'pending_client' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-yellow-800">Por favor revisa y firma el contrato para confirmar tu reserva.</p>
              </div>
            </div>
          )}
          {contract.status === 'pending_artist' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-800">Esperando que el proveedor revise y firme el contrato.</p>
              </div>
            </div>
          )}
          {contract.status === 'active' && !isEventPassed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-green-800">¡Reserva confirmada! Ambas partes han firmado el contrato.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Event card ────────────────────────────────────────────────────────────
  const EventCard = ({ event }: { event: Event }) => {
    const eventContracts = contractsByEvent.get(event.id) || [];
    const totalSpent = eventContracts.reduce((sum, c) => sum + c.terms.price, 0);
    const isExpanded = expandedEvents.has(event.id);

    const getStatusIcon = (status: Contract['status']) => {
      switch (status) {
        case 'active':    return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'pending_client': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        case 'pending_artist': return <Clock className="w-4 h-4 text-blue-600" />;
        case 'completed': return <CheckCircle className="w-4 h-4 text-gray-600" />;
        case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
        default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
      }
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <Collapsible open={isExpanded} onOpenChange={() => toggleEventExpanded(event.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <FolderOpen className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <h3 className="text-sm">{event.name}</h3>
                  {getEventStatusBadge(event.status)}
                  {event.archived && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                      <Archive className="w-3 h-3 mr-1" />Archivado
                    </Badge>
                  )}
                  <Badge variant="outline" className="ml-auto">
                    {eventContracts.length} {eventContracts.length === 1 ? 'servicio' : 'servicios'}
                  </Badge>
                </div>
                {event.eventType && <p className="text-sm text-gray-600 mb-1">{event.eventType}</p>}
                {event.description && <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)} className="h-8 w-8 p-0" title="Editar evento">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {event.eventDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p>{new Date(event.eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Ubicación</p>
                    <p className="line-clamp-1">{event.location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total Gastado</p>
                  <p className="text-green-600">${totalSpent.toFixed(2)}</p>
                </div>
              </div>
              {event.budget && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-gray-500 shrink-0" />
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
                {eventContracts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay servicios asignados a este evento</p>
                ) : (
                  <div className="space-y-2">
                    {eventContracts.map(contract => {
                      const isContractExpanded = expandedContracts.has(contract.id);
                      return (
                        <div key={contract.id}>
                          <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getStatusIcon(contract.status)}
                              <span className="text-sm font-medium truncate">{contract.artistName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#0A1F44] whitespace-nowrap mr-2">
                                ${contract.terms.price.toFixed(2)}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedContract(contract); setShowContractView(true); }} className="h-8 w-8 p-0" title="Ver contrato">
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => toggleContractExpanded(contract.id)} className="h-8 w-8 p-0" title="Ver detalles">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canReview(contract) && !hasReviewed(contract.id) && (
                                <Button variant="ghost" size="sm" onClick={() => onReviewCreate(contract.id)} className="h-8 w-8 p-0 text-[#D4AF37] hover:text-[#D4AF37]" title="Dejar reseña">
                                  <Star className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {isContractExpanded && (
                            <div className="mt-2 ml-4">
                              <ContractCard contract={contract} showEventSelector={true} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {!event.archived && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleArchiveEvent(event.id, true)} className="w-full text-gray-600 hover:text-gray-800">
                    <Archive className="w-4 h-4 mr-2" />Archivar evento
                  </Button>
                </div>
              )}
              {event.archived && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleArchiveEvent(event.id, false)} className="w-full text-blue-600 hover:text-blue-800">
                    <Archive className="w-4 h-4 mr-2" />Desarchivar evento
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-[#1B2A47] text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-[#1B2A47]">
              {navItems.find(n => n.id === activeSection)?.label}
            </p>
            <p className="text-xs text-gray-500">{user.name}</p>
          </div>
          {activeSection === 'bookings' && pendingSignature > 0 && (
            <Badge className="ml-auto bg-yellow-500 text-white">{pendingSignature}</Badge>
          )}
        </div>

        <div className="p-4 md:p-6 lg:p-8">

          {/* ── EVENTOS ──────────────────────────────────────────────────── */}
          {activeSection === 'events' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Eventos</h1>
                  <p className="text-gray-500 text-sm">
                    {userEvents.length} evento{userEvents.length !== 1 ? 's' : ''}
                    {showArchived ? ' (incluyendo archivados)' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Archive toggle */}
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border text-sm">
                    <Checkbox
                      id="show-archived"
                      checked={showArchived}
                      onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                    />
                    <Label htmlFor="show-archived" className="cursor-pointer">Mostrar archivados</Label>
                  </div>
                  {/* Create event */}
                  <EventManager
                    events={allUserEvents}
                    onCreateEvent={onCreateEvent}
                    onUpdateEvent={onUpdateEvent}
                    onDeleteEvent={onDeleteEvent}
                    eventToEdit={eventToEdit}
                    onEditComplete={handleEditComplete}
                  />
                </div>
              </div>

              {/* Content */}
              {userEvents.length === 0 && unassignedContracts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FolderOpen className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-1">No tienes eventos creados todavía</p>
                    <p className="text-sm text-gray-500 mb-4">Crea un evento para organizar tus reservas</p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {userEvents.length > 0 && (
                    <div className="space-y-0">
                      {userEvents.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                  )}

                  {unassignedContracts.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600">
                          Sin asignar a evento ({unassignedContracts.length})
                        </h3>
                      </div>
                      {unassignedContracts.map(contract => (
                        <ContractCard key={contract.id} contract={contract} showEventSelector={true} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── RESERVAS ─────────────────────────────────────────────────── */}
          {activeSection === 'bookings' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Reservas</h1>
                <p className="text-gray-500 text-sm">
                  {userContracts.length} reserva{userContracts.length !== 1 ? 's' : ''}
                  {pendingSignature > 0 && ` · ${pendingSignature} pendiente${pendingSignature !== 1 ? 's' : ''} de firma`}
                </p>
              </div>

              {userContracts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-1">No tienes reservas todavía</p>
                    <p className="text-sm text-gray-500">Explora proveedores y haz tu primera reserva</p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {/* Pending signature alert */}
                  {pendingSignature > 0 && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          {pendingSignature} contrato{pendingSignature !== 1 ? 's' : ''} esperando tu firma
                        </p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          Revisa y firma para confirmar tus reservas.
                        </p>
                      </div>
                    </div>
                  )}
                  {userContracts.map(contract => (
                    <ContractCard key={contract.id} contract={contract} showEventSelector={true} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Contract View Dialog */}
      {selectedContract && (
        <ContractView
          contract={selectedContract}
          open={showContractView}
          onClose={() => { setShowContractView(false); setSelectedContract(null); }}
          onSign={(signedContract) => {
            onContractUpdate(signedContract);
            if (onBookingUpdate && bookings) {
              const associatedBooking = bookings.find(b => b.contractId === signedContract.id);
              if (associatedBooking && signedContract.status === 'active') {
                onBookingUpdate({ ...associatedBooking, status: 'confirmed' as const });
              }
            }
            setShowContractView(false);
            setSelectedContract(null);
          }}
          userType="client"
        />
      )}
    </div>
  );
}
