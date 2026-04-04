import { useEffect, useState } from 'react';
import {
  Calendar, Clock, DollarSign, FileText, Star, CheckCircle, XCircle,
  AlertCircle, MessageSquare, FolderOpen, Package, Edit2, ChevronDown,
  ChevronUp, Eye, Archive, Menu, X, CalendarDays, BookOpen, Activity, MessageCircle,
  Search, Download
} from 'lucide-react';
import { Contract, User, Review, Event } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ContractView } from './ContractView';
import { EventManager } from './EventManager';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { downloadContractPdf } from '../utils/contractPdf';

type SidebarSection = 'events' | 'bookings';

interface ClientDashboardProps {
  contracts: Contract[];
  user: User;
  initialSection?: SidebarSection;
  focusBookingId?: string | null;
  onFocusBookingHandled?: () => void;
  focusContractId?: string | null;
  onFocusContractHandled?: () => void;
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
];

export function ClientDashboard({
  contracts,
  user,
  initialSection,
  focusBookingId,
  onFocusBookingHandled,
  focusContractId,
  onFocusContractHandled,
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
  const [searchBooking, setSearchBooking] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showEventBookings, setShowEventBookings] = useState(false);

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
  const userBookings = bookings.filter((booking: any) => booking.userId === user.id);
  const sortedUserBookings = [...userBookings].sort((a: any, b: any) => {
    const aDate = new Date(`${a.date}T${a.startTime || '00:00'}`).getTime();
    const bDate = new Date(`${b.date}T${b.startTime || '00:00'}`).getTime();
    return bDate - aDate;
  });
  const filteredUserBookings = sortedUserBookings.filter((booking: any) => {
    const q = searchBooking.trim().toLowerCase();
    if (!q) return true;

    return [booking.artistName, booking.eventType, booking.location]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  const allUserEvents = events.filter(e => e.userId === user.id);
  const userEvents = showArchived
    ? allUserEvents
    : allUserEvents.filter(e => !e.archived);
  const userContractsById = new Map(userContracts.map(contract => [contract.id, contract]));
  const userEventsById = new Map(userEvents.map(event => [event.id, event]));

  const getBookingContract = (booking: any) => {
    if (!booking.contractId) {
      return null;
    }

    return userContractsById.get(booking.contractId) || null;
  };

  const assignedBookings = filteredUserBookings.filter((booking: any) => Boolean(getBookingContract(booking)?.eventId));
  const unassignedBookings = filteredUserBookings.filter((booking: any) => !getBookingContract(booking)?.eventId);

  const bookingsByEvent = assignedBookings.reduce((map, booking: any) => {
    const linkedContract = getBookingContract(booking);
    const eventId = linkedContract?.eventId;
    if (!eventId) {
      return map;
    }

    const existing = map.get(eventId) || [];
    map.set(eventId, [...existing, booking]);
    return map;
  }, new Map<string, any[]>());

  const eventBookingGroups = Array.from(bookingsByEvent.entries())
    .map(([eventId, eventBookings]) => ({
      eventId,
      event: userEventsById.get(eventId),
      bookings: eventBookings,
    }))
    .sort((a, b) => {
      const aDate = a.event?.eventDate ? new Date(a.event.eventDate).getTime() : 0;
      const bDate = b.event?.eventDate ? new Date(b.event.eventDate).getTime() : 0;
      return aDate - bDate;
    });

  useEffect(() => {
    setActiveSection('bookings');
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
    if (!focusBookingId) {
      return;
    }

    setActiveSection('bookings');
    setExpandedBookingId(focusBookingId);
    onFocusBookingHandled?.();
  }, [focusBookingId, onFocusBookingHandled]);

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
      onFocusContractHandled?.();
    }
  }, [focusContractId, onFocusContractHandled, userContracts]);

  // Pending signatures count
  const pendingSignature = userContracts.filter(c => c.status === 'pending_client').length;
  const pendingBookings = userBookings.filter((booking: any) => booking.status === 'pending').length;
  const visibleBookings = showEventBookings ? assignedBookings : unassignedBookings;

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

  const handleStartChatFromContract = (contract: Contract) => {
    if (!contract.bookingId) {
      return;
    }

    window.dispatchEvent(new CustomEvent('memorialo:open-chat', {
      detail: { bookingId: contract.bookingId },
    }));
  };

  const handleStartChatFromBooking = (bookingId?: string | null) => {
    if (!bookingId) {
      return;
    }

    window.dispatchEvent(new CustomEvent('memorialo:open-chat', {
      detail: { bookingId },
    }));
  };

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getBookingStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const handleViewContractFromBooking = (booking: any) => {
    if (!booking.contractId) {
      return;
    }

    const contract = userContracts.find((candidate) => candidate.id === booking.contractId);
    if (!contract) {
      return;
    }

    setSelectedContract(contract);
    setShowContractView(true);
  };

  const handleDownloadContractFromBooking = (booking: any) => {
    if (!booking.contractId) {
      return;
    }

    const contract = userContracts.find((candidate) => candidate.id === booking.contractId);
    if (!contract) {
      return;
    }

    downloadContractPdf(contract, 'client', {
      providerName: (contract as any)?.metadata?.providerBusinessName || contract.artistName,
      providerRepresentativeName: (contract as any)?.metadata?.providerRepresentativeName || contract.artistSignature?.signedBy || contract.artistName,
      providerLegalEntityType: ((contract as any)?.metadata?.providerLegalEntityType || 'person') as 'person' | 'company',
      providerIdentificationNumber: String((contract as any)?.metadata?.providerIdentificationNumber || ''),
      providerEmail: contract.artistEmail,
      providerPhone: contract.artistWhatsapp,
      clientName: user.name,
      serviceName: contract.artistName,
      eventName: booking.eventType,
    });
  };

  const handleArchiveEvent = (eventId: string, archived: boolean) => {
    onUpdateEvent(eventId, { archived });
  };

  const handleEditEvent = (event: Event) => setEventToEdit(event);
  const handleEditComplete = () => setEventToEdit(null);

  const handleNavClick = (section: SidebarSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const renderBookingRow = (booking: any) => {
    const isExpanded = expandedBookingId === booking.id;
    const linkedContract = getBookingContract(booking);
    const canLeaveReview = Boolean(linkedContract && canReview(linkedContract) && !hasReviewed(linkedContract.id));
    const canDownloadContract = Boolean(linkedContract && booking.contractId);
    const contractCode = booking.contractId ? String(booking.contractId).trim() : '';
    const compactContractCode = contractCode.length > 18 ? `${contractCode.slice(0, 8)}…${contractCode.slice(-4)}` : contractCode;

    return (
      <Card key={booking.id} className={`shadow-sm ${booking.status === 'pending' ? 'border-yellow-200 bg-yellow-50/40' : 'border-slate-200'}`}>
        <CardContent className="px-3 py-2.5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_130px_140px_90px_auto] md:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="truncate text-sm font-medium text-[#1B2A47]">{booking.artistName || 'Proveedor'}</h4>
                {linkedContract?.eventId && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {userEventsById.get(linkedContract.eventId)?.name || 'Evento'}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {booking.eventType || 'Evento'}
                {booking.location ? ` · ${booking.location}` : ''}
              </p>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">Contrato</p>
              {contractCode ? (
                <Badge
                  variant="outline"
                  className="max-w-full border-slate-200 bg-white text-slate-700"
                  title={`Contrato ${contractCode}`}
                >
                  <span className="block max-w-[120px] truncate">{compactContractCode}</span>
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">Sin contrato</span>
              )}
            </div>

            <div className="text-xs text-gray-600">
              <p className="flex items-center gap-1 font-medium text-gray-700">
                <Calendar className="w-3 h-3" />
                {new Date(booking.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
              <p className="mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {booking.startTime || 'N/A'}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">Estado</p>
              <Badge variant="outline" className={`${getBookingStatusBadgeClass(booking.status)} text-xs`}>
                <span className="flex items-center gap-1">{getBookingStatusIcon(booking.status)}{getBookingStatusText(booking.status)}</span>
              </Badge>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 md:hidden">Total</p>
              <p className="text-sm font-semibold text-green-600">${booking.totalPrice}</p>
            </div>

            <div className="flex items-center justify-start gap-1 md:justify-end">
              {booking.contractId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewContractFromBooking(booking)}
                  className="h-7 w-7 p-0"
                  title="Ver contrato"
                >
                  <FileText className="w-4 h-4 text-gray-700" />
                </Button>
              )}
              {canDownloadContract && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadContractFromBooking(booking)}
                  className="h-7 w-7 p-0"
                  title="Descargar contrato"
                >
                  <Download className="w-4 h-4 text-gray-700" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartChatFromBooking(booking.id)}
                className="h-7 w-7 p-0"
                title="Iniciar conversación"
              >
                <MessageCircle className="w-4 h-4 text-gray-700" />
              </Button>
              {canLeaveReview && linkedContract && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReviewCreate(linkedContract.id)}
                  className="h-7 w-7 p-0 text-[#D4AF37] hover:text-[#D4AF37]"
                  title="Dejar reseña"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                className="h-7 w-7 p-0"
                title={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-700" /> : <ChevronDown className="w-4 h-4 text-gray-700" />}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                <div><p className="text-gray-400">Fecha</p><p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.date).toLocaleDateString('es-ES')}</p></div>
                <div><p className="text-gray-400">Hora</p><p className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.startTime || 'N/A'}</p></div>
                <div><p className="text-gray-400">Duración</p><p>{getMeasureLabel(booking, booking.duration)}</p></div>
                <div><p className="text-gray-400">Ubicación</p><p className="truncate">{booking.location}</p></div>
                <div><p className="text-gray-400">Precio</p><p className="text-green-600">${booking.totalPrice}</p></div>
                <div><p className="text-gray-400">Contrato</p><p className="truncate">{contractCode || 'Sin contrato'}</p></div>
              </div>

              {linkedContract && (
                <div>
                  <Label className="mb-1 block text-xs text-gray-500">Asignar a Evento</Label>
                  <Select
                    value={linkedContract.eventId || 'none'}
                    onValueChange={(value) => onAssignContractToEvent(linkedContract.id, value === 'none' ? null : value)}
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

              {booking.specialRequests && (
                <div>
                  <p className="mb-1 text-xs text-gray-400">Solicitud adicional</p>
                  <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartChatFromContract(contract)}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Iniciar conversación
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Reservas</h1>
                  <p className="text-gray-500 text-sm">
                    {userBookings.length} reserva{userBookings.length !== 1 ? 's' : ''}
                    {pendingBookings > 0 && ` · ${pendingBookings} pendiente${pendingBookings !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <EventManager
                  events={allUserEvents}
                  onCreateEvent={onCreateEvent}
                  onUpdateEvent={onUpdateEvent}
                  onDeleteEvent={onDeleteEvent}
                />
              </div>

              {userBookings.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre de proveedor..."
                      value={searchBooking}
                      onChange={(e) => setSearchBooking(e.target.value)}
                      className="h-10 pl-10 border-2 border-gray-200 focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600">Sin evento</span>
                    <Switch checked={showEventBookings} onCheckedChange={setShowEventBookings} />
                    <span className="text-xs text-gray-600">En eventos</span>
                  </div>
                </div>
              )}

              {userBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-1">No tienes reservas todavía</p>
                    <p className="text-sm text-gray-500">Explora proveedores y haz tu primera reserva</p>
                  </CardContent>
                </Card>
              ) : filteredUserBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-600 mb-1">No se encontraron reservas</p>
                    <p className="text-sm text-gray-500">Prueba otro término de búsqueda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
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

                  <div className="hidden md:grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_130px_140px_90px_auto] gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Proveedor / detalle</span>
                    <span>Contrato</span>
                    <span>Fecha</span>
                    <span>Estado</span>
                    <span>Total</span>
                    <span className="text-right">Opciones</span>
                  </div>

                  {showEventBookings ? (
                    eventBookingGroups.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                          <CalendarDays className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-gray-600 mb-1">No hay reservas asignadas a eventos</p>
                          <p className="text-sm text-gray-500">Asigna una reserva a un evento desde los detalles</p>
                        </CardContent>
                      </Card>
                    ) : (
                      eventBookingGroups.map((group) => (
                        <Card key={group.eventId} className="mb-3">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1B2A47] truncate">{group.event?.name || 'Evento'}</p>
                                <p className="text-xs text-gray-500">
                                  {group.event?.eventDate ? new Date(group.event.eventDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                                  {group.event?.location ? ` • ${group.event.location}` : ''}
                                </p>
                              </div>
                              <Badge variant="outline">{group.bookings.length} reserva{group.bookings.length !== 1 ? 's' : ''}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            {group.bookings.map((booking: any) => renderBookingRow(booking))}
                          </CardContent>
                        </Card>
                      ))
                    )
                  ) : (
                    visibleBookings.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                          <FolderOpen className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-gray-600 mb-1">No hay reservas sin evento asignado</p>
                          <p className="text-sm text-gray-500">Activa el switch para ver las reservas en eventos</p>
                        </CardContent>
                      </Card>
                    ) : (
                      visibleBookings.map((booking: any) => renderBookingRow(booking))
                    )
                  )}
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
