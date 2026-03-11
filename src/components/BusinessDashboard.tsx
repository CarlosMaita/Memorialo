import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Artist, Contract, User, Provider, Booking } from '../types';
import { ServiceEditor } from './ServiceEditor';
import { ContractView } from './ContractView';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  DollarSign,
  Star,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarPlus,
  BarChart3,
  AlertCircle,
  Search,
  LayoutDashboard,
  Briefcase,
  Menu,
  X,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ConfirmDialog } from './ConfirmDialog';

interface BusinessDashboardProps {
  user: User;
  provider: Provider | null;
  services: Artist[];
  contracts: Contract[];
  bookings: Booking[];
  onServiceCreate: (service: Artist) => void;
  onServiceUpdate: (service: Artist) => void;
  onServiceDelete: (serviceId: string) => void;
  onContractUpdate: (contract: Contract) => void;
  onBookingCreate: (booking: Booking) => void;
  onBookingUpdate: (booking: Booking) => void;
  onProviderCreate?: (provider: Provider) => void;
  reviews?: any[];
  events?: any[];
  onCreateEvent?: (event: any) => void;
  onUpdateEvent?: (eventId: string, updates: any) => void;
  onDeleteEvent?: (eventId: string) => void;
  onAssignContractToEvent?: (contractId: string, eventId: string | null) => void;
  onReviewCreate?: (contractId: string) => void;
}

const categories = [
  'Espacios Y Locaciones',
  'Talento Y Entretenimiento',
  'Gastronomía Y Servicios',
  'Ambientación Y Decoración',
  'Detalles Y Logística'
];

type SidebarSection = 'dashboard' | 'services' | 'contracts' | 'bookings';

const navItems: { id: SidebarSection; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'services', label: 'Mis Servicios', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'contracts', label: 'Contratos', icon: <FileText className="w-5 h-5" /> },
  { id: 'bookings', label: 'Reservas', icon: <Calendar className="w-5 h-5" /> },
];

export function BusinessDashboard({ 
  user, 
  provider,
  services, 
  contracts,
  bookings,
  onServiceCreate, 
  onServiceUpdate, 
  onServiceDelete,
  onContractUpdate,
  onBookingCreate,
  onBookingUpdate,
  onProviderCreate,
  reviews = [],
  events = [],
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAssignContractToEvent,
  onReviewCreate
}: BusinessDashboardProps) {
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingService, setEditingService] = useState<Artist | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [showProviderSetup, setShowProviderSetup] = useState(!provider);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [creatingBookingContract, setCreatingBookingContract] = useState<Contract | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>('dashboard');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showEditBookingDialog, setShowEditBookingDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search states
  const [searchService, setSearchService] = useState('');
  const [searchContract, setSearchContract] = useState('');
  const [searchBooking, setSearchBooking] = useState('');

  // Setup Provider Profile
  const [providerForm, setProviderForm] = useState({
    businessName: '',
    category: '',
    description: ''
  });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    duration: ''
  });

  // Edit booking form
  const [editBookingForm, setEditBookingForm] = useState({
    date: '',
    startTime: ''
  });

  const handleProviderSetup = () => {
    if (!providerForm.businessName || !providerForm.category) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const newProvider: Provider = {
      id: `provider-${Date.now()}`,
      userId: user.id,
      businessName: providerForm.businessName,
      category: providerForm.category,
      description: providerForm.description,
      verified: false,
      createdAt: new Date().toISOString(),
      services: [],
      totalBookings: 0,
      rating: 5
    };

    if (onProviderCreate) {
      onProviderCreate(newProvider);
    }
    setShowProviderSetup(false);
    toast.success('¡Perfil de proveedor creado exitosamente!');
  };

  // Get contracts for provider's services
  const providerContracts = contracts.filter(contract => 
    services.some(service => service.id === contract.artistId)
  );

  // Get bookings for provider's services
  const providerBookings = bookings.filter(booking =>
    services.some(service => service.id === booking.artistId)
  );

  // Contracts that are signed by both parties
  const signedContracts = providerContracts.filter(c => 
    c.clientSignature && c.artistSignature
  );

  const pendingContracts = providerContracts.filter(c => 
    c.status === 'pending_artist' || c.status === 'pending_client'
  );

  // Calculate stats
  const totalRevenue = signedContracts.reduce((sum, c) => sum + c.terms.price, 0);
  const averageRating = services.length > 0 
    ? services.reduce((sum, s) => sum + s.rating, 0) / services.length 
    : 0;

  const totalBookings = providerBookings.length;
  const pendingBookings = providerBookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = providerBookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = providerBookings.filter(b => b.status === 'completed').length;

  // Sort contracts
  const sortedContracts = [...providerContracts].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'pending_artist': 1,
      'pending_client': 2,
      'active': 3,
      'completed': 4,
      'cancelled': 5
    };
    return (statusOrder[a.status] || 6) - (statusOrder[b.status] || 6);
  });

  // Sort bookings
  const sortedBookings = [...providerBookings].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4
    };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  // Filtered lists
  const activeServices = services.filter(service => 
    !service.isArchived && service.name.toLowerCase().includes(searchService.toLowerCase())
  );
  
  const archivedServices = services.filter(service =>
    service.isArchived && service.name.toLowerCase().includes(searchService.toLowerCase())
  );

  const filteredContracts = sortedContracts.filter(contract => 
    contract.clientName.toLowerCase().includes(searchContract.toLowerCase())
  );

  const filteredBookings = sortedBookings.filter(booking => 
    booking.clientName.toLowerCase().includes(searchBooking.toLowerCase())
  );

  const handleEditService = (service: Artist) => {
    setEditingService(service);
    setShowServiceEditor(true);
  };

  const handleDeleteServiceClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteServiceConfirmed = () => {
    if (serviceToDelete) {
      const service = services.find(s => s.id === serviceToDelete);
      if (service) {
        const archivedService = { ...service, isArchived: true };
        onServiceUpdate(archivedService);
        toast.success('Servicio archivado. Los contratos y reservas existentes se conservaron.');
      }
      setServiceToDelete(null);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractView(true);
  };

  const handleCreateBooking = (contract: Contract) => {
    setCreatingBookingContract(contract);
    setBookingForm({
      date: '',
      startTime: '',
      duration: contract.terms.duration.toString()
    });
    setShowBookingDialog(true);
  };

  const handleSaveBooking = () => {
    if (!creatingBookingContract) return;
    
    if (!bookingForm.date || !bookingForm.startTime) {
      toast.error('Por favor completa la fecha y hora de inicio');
      return;
    }

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      artistId: creatingBookingContract.artistId,
      artistName: creatingBookingContract.artistName,
      userId: creatingBookingContract.clientId,
      clientName: creatingBookingContract.clientName,
      clientEmail: '',
      clientPhone: '',
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      duration: parseInt(bookingForm.duration),
      eventType: creatingBookingContract.terms.serviceDescription.split('\n')[0],
      location: creatingBookingContract.terms.location,
      specialRequests: '',
      totalPrice: creatingBookingContract.terms.price,
      status: 'confirmed',
      contractId: creatingBookingContract.id
    };

    onBookingCreate(newBooking);
    setShowBookingDialog(false);
    setCreatingBookingContract(null);
    toast.success('¡Reserva creada exitosamente!');
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    const booking = providerBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const updatedBooking = { ...booking, status };
    onBookingUpdate(updatedBooking);
    
    if (status === 'completed' && booking.contractId) {
      const contract = providerContracts.find(c => c.id === booking.contractId);
      if (contract) {
        const updatedContract = { ...contract, status: 'completed' as const };
        onContractUpdate(updatedContract);
      }
    }
    
    const statusMap: { [key: string]: string } = {
      'pending': 'pendiente',
      'confirmed': 'confirmada',
      'completed': 'completada',
      'cancelled': 'cancelada'
    };
    toast.success(`Reserva ${statusMap[status]}`);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditBookingForm({
      date: booking.date,
      startTime: booking.startTime || ''
    });
    setShowEditBookingDialog(true);
  };

  const handleSaveEditedBooking = () => {
    if (!editingBooking) return;
    
    if (!editBookingForm.date || !editBookingForm.startTime) {
      toast.error('Por favor completa la fecha y hora de inicio');
      return;
    }

    const updatedBooking: Booking = {
      ...editingBooking,
      date: editBookingForm.date,
      startTime: editBookingForm.startTime
    };

    onBookingUpdate(updatedBooking);

    if (editingBooking.contractId) {
      const contract = providerContracts.find(c => c.id === editingBooking.contractId);
      if (contract) {
        const updatedContract: Contract = {
          ...contract,
          terms: {
            ...contract.terms,
            date: editBookingForm.date,
            startTime: editBookingForm.startTime
          }
        };
        onContractUpdate(updatedContract);
      }
    }

    setShowEditBookingDialog(false);
    setEditingBooking(null);
    toast.success('Reserva actualizada exitosamente');
  };

  const hasContractPendingProvider = (booking: Booking) => {
    if (!booking.contractId) return false;
    const contract = providerContracts.find(c => c.id === booking.contractId);
    return contract?.status === 'pending_artist';
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-600',
      'pending_client': 'border-orange-500 text-orange-700',
      'pending_artist': 'border-orange-500 text-orange-700',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'active': 'Firmado',
      'pending_client': 'Pendiente del cliente',
      'pending_artist': 'Pendiente de tu firma',
      'cancelled': 'Cancelado',
      'completed': 'Completada'
    };
    return statusTexts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const hasBooking = (contractId: string) => {
    return providerBookings.some(b => b.contractId === contractId);
  };

  const handleNavClick = (section: SidebarSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // Provider Setup Screen
  if (showProviderSetup) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configura tu Perfil de Proveedor</CardTitle>
            <p className="text-sm text-gray-600">
              Completa estos datos para comenzar a ofrecer tus servicios
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Nombre del Negocio *</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={providerForm.businessName}
                onChange={(e) => setProviderForm({ ...providerForm, businessName: e.target.value })}
                placeholder="Ej: Mariachi Los Camperos"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Categoría Principal *</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={providerForm.category}
                onChange={(e) => setProviderForm({ ...providerForm, category: e.target.value })}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Descripción</label>
              <textarea
                className="w-full p-2 border rounded-lg resize-none"
                rows={4}
                value={providerForm.description}
                onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                placeholder="Describe tu negocio y experiencia..."
              />
            </div>

            <Button onClick={handleProviderSetup} className="w-full">
              Crear Perfil de Proveedor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── KPI Cards for Dashboard ──────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      change: '+12%',
      positive: true,
    },
    {
      label: 'Servicios Activos',
      value: services.filter(s => !s.isArchived).length,
      icon: <Briefcase className="w-6 h-6" />,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
      change: `${services.length} total`,
      positive: null,
    },
    {
      label: 'Contratos',
      value: providerContracts.length,
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      iconBg: 'bg-violet-500',
      textColor: 'text-violet-700',
      change: `${pendingContracts.length} pendientes`,
      positive: null,
    },
    {
      label: 'Reservas Totales',
      value: totalBookings,
      icon: <Calendar className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-700',
      change: `${confirmedBookings} confirmadas`,
      positive: null,
    },
    {
      label: 'Completadas',
      value: completedBookings,
      icon: <CheckCircle2 className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      textColor: 'text-green-700',
      change: `${pendingBookings} pendientes`,
      positive: null,
    },
    {
      label: 'Calificación',
      value: averageRating > 0 ? averageRating.toFixed(1) : '—',
      icon: <Star className="w-6 h-6" />,
      gradient: 'from-yellow-400 to-amber-500',
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      change: `${services.reduce((sum, s) => sum + s.reviews, 0)} reseñas`,
      positive: null,
    },
  ];

  // ── Sidebar nav ──────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / title */}
      <div className="px-5 py-5 border-b border-[#1B2A47]/10">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-0.5">Mi Negocio</p>
        <p className="text-sm text-gray-500 truncate">{provider?.businessName || user.name}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const badge =
            item.id === 'contracts' && pendingContracts.length > 0
              ? pendingContracts.length
              : item.id === 'bookings' && pendingBookings > 0
              ? pendingBookings
              : null;

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
                  isActive ? 'bg-[#D4AF37] text-[#1B2A47]' : 'bg-orange-500 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-[#1B2A47] to-[#2d4270] rounded-xl p-3 text-white text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">Estado del negocio</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {services.filter(s => !s.isArchived).length} servicio{services.filter(s => !s.isArchived).length !== 1 ? 's' : ''} activo{services.filter(s => !s.isArchived).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">

      {/* ── Mobile overlay sidebar ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 bg-white h-full shadow-2xl z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#1B2A47] text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-[#1B2A47]">
              {navItems.find(n => n.id === activeSection)?.label}
            </p>
            <p className="text-xs text-gray-500">{provider?.businessName || 'Mi Negocio'}</p>
          </div>
          {(activeSection === 'contracts' && pendingContracts.length > 0) && (
            <Badge className="ml-auto bg-orange-500 text-white">{pendingContracts.length}</Badge>
          )}
          {(activeSection === 'bookings' && pendingBookings > 0) && (
            <Badge className="ml-auto bg-yellow-500 text-white">{pendingBookings}</Badge>
          )}
        </div>

        <div className="p-4 md:p-6 lg:p-8">

          {/* ── DASHBOARD ──────────────────────────────────────────────── */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Dashboard</h1>
                <p className="text-gray-500 text-sm">Resumen general de tu negocio</p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                {kpiCards.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center text-white shrink-0`}>
                      {kpi.icon}
                    </div>
                    {/* Value */}
                    <div>
                      <p className="text-2xl font-bold text-[#1B2A47] leading-none mb-1">{kpi.value}</p>
                      <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                    </div>
                    {/* Change pill */}
                    <div className={`text-xs px-2 py-0.5 rounded-full w-fit ${kpi.bg} ${kpi.textColor} font-medium`}>
                      {kpi.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recent activity */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                      Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {providerContracts.length === 0 && providerBookings.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Sin actividad reciente</p>
                    ) : (
                      <>
                        {sortedContracts.slice(0, 3).map(c => (
                          <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.clientName}</p>
                              <p className="text-xs text-gray-500">{c.artistName}</p>
                            </div>
                            <Badge className={`${getStatusBadge(c.status)} text-xs shrink-0`} variant={c.status.includes('pending') ? 'outline' : 'default'}>
                              {getStatusText(c.status)}
                            </Badge>
                          </div>
                        ))}
                        {providerContracts.length > 3 && (
                          <button
                            onClick={() => setActiveSection('contracts')}
                            className="text-xs text-[#1B2A47] hover:text-[#D4AF37] font-medium mt-1 transition-colors"
                          >
                            Ver todos los contratos →
                          </button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Alerts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      Acciones Pendientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingContracts.length === 0 && pendingBookings === 0 ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Todo al día</p>
                      </div>
                    ) : (
                      <>
                        {pendingContracts.length > 0 && (
                          <button
                            onClick={() => setActiveSection('contracts')}
                            className="w-full flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-left hover:bg-orange-100 transition-colors"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                            <p className="text-xs text-orange-800 font-medium">
                              {pendingContracts.length} contrato{pendingContracts.length !== 1 ? 's' : ''} pendiente{pendingContracts.length !== 1 ? 's' : ''}
                            </p>
                          </button>
                        )}
                        {pendingBookings > 0 && (
                          <button
                            onClick={() => setActiveSection('bookings')}
                            className="w-full flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                          >
                            <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                            <p className="text-xs text-yellow-800 font-medium">
                              {pendingBookings} reserva{pendingBookings !== 1 ? 's' : ''} pendiente{pendingBookings !== 1 ? 's' : ''}
                            </p>
                          </button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── MIS SERVICIOS ──────────────────────────────────────────── */}
          {activeSection === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Mis Servicios</h1>
                  <p className="text-gray-500 text-sm">
                    {services.filter(s => !s.isArchived).length} activo{services.filter(s => !s.isArchived).length !== 1 ? 's' : ''} • {services.filter(s => s.isArchived).length} archivado{services.filter(s => s.isArchived).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button onClick={() => { setEditingService(null); setShowServiceEditor(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Crear Servicio</span>
                  <span className="sm:hidden">Crear</span>
                </Button>
              </div>

              {/* Search */}
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
                <Input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="h-10 pl-10 border-2 border-gray-200 focus:border-[#D4AF37]"
                />
              </div>

              {services.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg mb-2">No tienes servicios publicados</h3>
                    <p className="text-sm text-gray-600 mb-4">Crea tu primer servicio para comenzar a recibir reservas</p>
                    <Button onClick={() => setShowServiceEditor(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Servicio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {activeServices.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-widest">
                        Servicios Activos ({activeServices.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeServices.map((service) => (
                          <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video overflow-hidden relative">
                              <ImageWithFallback
                                src={service.image}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                              {!service.isPublished && (
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-yellow-500 text-white text-xs">
                                    <EyeOff className="w-3 h-3 mr-1" />Oculto
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="text-base mb-0.5">{service.name}</h3>
                                  <p className="text-xs text-gray-500">{service.category}</p>
                                </div>
                                {service.verified && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 ml-2" />}
                              </div>
                              <div className="flex items-center gap-2 mb-3 text-sm">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{service.rating}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">{service.reviews} reseñas</span>
                              </div>
                              <p className="text-xs text-gray-500 mb-3">
                                {service.servicePlans.length} plan{service.servicePlans.length !== 1 ? 'es' : ''} · Desde ${Math.min(...service.servicePlans.map(p => p.price))}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditService(service)} className="flex-1">
                                  <Edit className="w-3.5 h-3.5 mr-1" />Editar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteServiceClick(service.id)} className="text-red-500 hover:text-red-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {archivedServices.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-widest">
                        Archivados ({archivedServices.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {archivedServices.map((service) => (
                          <Card key={service.id} className="opacity-60 border-dashed overflow-hidden">
                            <div className="aspect-video overflow-hidden relative">
                              <ImageWithFallback
                                src={service.image}
                                alt={service.name}
                                className="w-full h-full object-cover grayscale"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-gray-600 text-white text-xs">Archivado</Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="text-base mb-0.5">{service.name}</h3>
                              <p className="text-xs text-gray-400 italic mb-3">Este servicio está archivado</p>
                              <Button size="sm" variant="outline" onClick={() => { onServiceUpdate({ ...service, isArchived: false }); toast.success('Servicio restaurado'); }} className="w-full">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Restaurar
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONTRATOS ──────────────────────────────────────────────── */}
          {activeSection === 'contracts' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Contratos</h1>
                <p className="text-gray-500 text-sm">
                  {providerContracts.length} contrato{providerContracts.length !== 1 ? 's' : ''} · {pendingContracts.length} pendiente{pendingContracts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {providerContracts.length > 0 && (
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre de cliente..."
                    value={searchContract}
                    onChange={(e) => setSearchContract(e.target.value)}
                    className="h-10 pl-10 border-2 border-gray-200 focus:border-[#D4AF37]"
                  />
                </div>
              )}

              {providerContracts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No tienes contratos aún</p>
                    <p className="text-sm text-gray-400 mt-1">Los contratos aparecerán cuando los clientes hagan reservas</p>
                  </CardContent>
                </Card>
              ) : filteredContracts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No se encontraron contratos</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredContracts.map((contract) => {
                    const isSigned = contract.clientSignature && contract.artistSignature;
                    const contractHasBooking = hasBooking(contract.id);
                    const needsProviderSignature = contract.status === 'pending_artist' && contract.clientSignature && !contract.artistSignature;
                    const isExpanded = expandedContractId === contract.id;

                    return (
                      <Card key={contract.id} className={needsProviderSignature ? 'border-2 border-orange-400 bg-orange-50/30' : ''}>
                        <CardContent className="p-3">
                          {needsProviderSignature && (
                            <div className="mb-2 flex items-start gap-2 bg-orange-100 border border-orange-300 rounded-lg p-2">
                              <AlertCircle className="w-4 h-4 text-orange-700 shrink-0 mt-0.5" />
                              <p className="text-xs text-orange-900"><strong>Acción requerida:</strong> El cliente firmó. Revisa y firma el contrato.</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm truncate">{contract.clientName}</h4>
                                <Badge className={`${getStatusBadge(contract.status)} text-xs`} variant={contract.status.includes('pending') ? 'outline' : 'default'}>
                                  {getStatusText(contract.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(contract.terms.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                <span className="text-green-600 font-medium">${contract.terms.price}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setExpandedContractId(isExpanded ? null : contract.id)} className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4 text-gray-700" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleViewContract(contract)} className="h-8 w-8 p-0">
                                <FileText className="w-4 h-4 text-gray-700" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                              <p className="text-sm text-gray-600">{contract.terms.serviceDescription.split('\n')[0]}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><p className="text-gray-400">Fecha</p><p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(contract.terms.date).toLocaleDateString('es-ES')}</p></div>
                                <div><p className="text-gray-400">Hora / Duración</p><p className="flex items-center gap-1"><Clock className="w-3 h-3" />{contract.terms.startTime || 'N/A'} · {contract.terms.duration}h</p></div>
                                <div><p className="text-gray-400">Precio</p><p className="text-green-600">${contract.terms.price}</p></div>
                                <div><p className="text-gray-400">Ubicación</p><p className="truncate">{contract.terms.location}</p></div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {isSigned && !contractHasBooking && (
                                  <Button size="sm" onClick={() => handleCreateBooking(contract)} className="flex-1">
                                    <CalendarPlus className="w-4 h-4 mr-1" />Crear Reserva
                                  </Button>
                                )}
                                {contractHasBooking && (
                                  <Badge variant="outline" className="text-green-700 border-green-300">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />Reserva creada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── RESERVAS ───────────────────────────────────────────────── */}
          {activeSection === 'bookings' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Reservas</h1>
                <p className="text-gray-500 text-sm">
                  {totalBookings} reserva{totalBookings !== 1 ? 's' : ''} · {pendingBookings} pendiente{pendingBookings !== 1 ? 's' : ''}
                </p>
              </div>

              {providerBookings.length > 0 && (
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre de cliente..."
                    value={searchBooking}
                    onChange={(e) => setSearchBooking(e.target.value)}
                    className="h-10 pl-10 border-2 border-gray-200 focus:border-[#D4AF37]"
                  />
                </div>
              )}

              {providerBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No tienes reservas aún</p>
                    <p className="text-sm text-gray-400 mt-1">Las reservas aparecerán aquí después de crear contratos y confirmarlos</p>
                  </CardContent>
                </Card>
              ) : filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No se encontraron reservas</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredBookings.map((booking) => {
                    const isPendingProviderSignature = hasContractPendingProvider(booking);
                    const displayStatus = isPendingProviderSignature ? 'pending' : booking.status;
                    const isExpanded = expandedBookingId === booking.id;

                    return (
                      <Card key={booking.id} className={booking.status === 'pending' ? 'border-2 border-yellow-400 bg-yellow-50/30' : ''}>
                        <CardContent className="p-3">
                          {isPendingProviderSignature && (
                            <div className="mb-2 flex items-start gap-2 bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                              <Clock className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                              <p className="text-xs text-yellow-900"><strong>Pendiente:</strong> Se confirmará al firmar el contrato.</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm truncate">{booking.clientName}</h4>
                                <Badge className={`${getStatusBadge(displayStatus)} text-xs`}>
                                  <span className="flex items-center gap-1">{getStatusIcon(displayStatus)}{getStatusText(displayStatus)}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.startTime || 'N/A'}</span>
                                <span className="text-green-600 font-medium">${booking.totalPrice}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)} className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4 text-gray-700" />
                              </Button>
                              {booking.contractId && (
                                <Button size="sm" variant="ghost" onClick={() => { const c = providerContracts.find(c => c.id === booking.contractId); if (c) handleViewContract(c); }} className="h-8 w-8 p-0">
                                  <FileText className="w-4 h-4 text-gray-700" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                              <p className="text-sm text-gray-600">{booking.eventType}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><p className="text-gray-400">Fecha</p><p className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.date).toLocaleDateString('es-ES')}</p></div>
                                <div><p className="text-gray-400">Hora</p><p className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.startTime || 'N/A'}</p></div>
                                <div><p className="text-gray-400">Duración</p><p>{booking.duration} horas</p></div>
                                <div><p className="text-gray-400">Ubicación</p><p className="truncate">{booking.location}</p></div>
                                <div><p className="text-gray-400">Precio</p><p className="text-green-600">${booking.totalPrice}</p></div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {displayStatus === 'pending' && (
                                  <Button size="sm" variant="outline" onClick={() => handleEditBooking(booking)} className="flex-1">
                                    <Calendar className="w-4 h-4 mr-1" />Editar Fecha/Hora
                                  </Button>
                                )}
                                {displayStatus === 'confirmed' && (
                                  <Button size="sm" onClick={() => handleUpdateBookingStatus(booking.id, 'completed')} className="flex-1">
                                    Marcar como Completada
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Archivar Servicio"
        description="El servicio se archivará. Los contratos y reservas existentes se conservarán."
        confirmText="Archivar"
        onConfirm={handleDeleteServiceConfirmed}
      />

      <ServiceEditor
        open={showServiceEditor}
        onClose={() => { setShowServiceEditor(false); setEditingService(null); }}
        onSave={(service) => {
          const serviceWithUser = { ...service, userId: user.id };
          if (editingService) { onServiceUpdate(serviceWithUser); } else { onServiceCreate(serviceWithUser); }
          setShowServiceEditor(false);
          setEditingService(null);
        }}
        existingService={editingService}
        categories={categories}
      />

      {selectedContract && (
        <ContractView
          contract={selectedContract}
          open={showContractView}
          onClose={() => { setShowContractView(false); setSelectedContract(null); }}
          onSign={(signedContract) => {
            onContractUpdate(signedContract);
            const associatedBooking = providerBookings.find(b => b.contractId === signedContract.id);
            if (associatedBooking && signedContract.status === 'active') {
              onBookingUpdate({ ...associatedBooking, status: 'confirmed' as const });
              toast.success('¡Contrato completamente firmado y reserva confirmada!');
            } else if (associatedBooking && associatedBooking.status === 'pending') {
              toast.success('¡Contrato firmado! Esperando firma del cliente para confirmar la reserva.');
            }
            setShowContractView(false);
            setSelectedContract(null);
          }}
          onReject={(rejectedContract) => {
            onContractUpdate(rejectedContract);
            const associatedBooking = providerBookings.find(b => b.contractId === rejectedContract.id);
            if (associatedBooking) {
              onBookingUpdate({ ...associatedBooking, status: 'cancelled' as const });
            }
            setShowContractView(false);
            setSelectedContract(null);
          }}
          userType="artist"
        />
      )}

      {/* Create Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Reserva</DialogTitle>
            <DialogDescription>Establece la fecha, hora y duración para esta reserva</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {creatingBookingContract && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>Cliente:</strong> {creatingBookingContract.clientName}</p>
                <p><strong>Servicio:</strong> {creatingBookingContract.terms.serviceDescription.split('\n')[0]}</p>
                <p><strong>Precio:</strong> ${creatingBookingContract.terms.price}</p>
              </div>
            )}
            <div>
              <Label htmlFor="bookingDate">Fecha del Evento *</Label>
              <Input id="bookingDate" type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="bookingTime">Hora de Inicio *</Label>
              <Input id="bookingTime" type="time" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="bookingDuration">Duración (horas) *</Label>
              <Input id="bookingDuration" type="number" min="1" value={bookingForm.duration} onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveBooking} className="flex-1" disabled={!bookingForm.date || !bookingForm.startTime}>Crear Reserva</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={showEditBookingDialog} onOpenChange={setShowEditBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fecha y Hora de Reserva</DialogTitle>
            <DialogDescription>Modifica la fecha y hora de esta reserva pendiente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingBooking && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>Cliente:</strong> {editingBooking.clientName}</p>
                <p><strong>Servicio:</strong> {editingBooking.eventType}</p>
                <Badge className={getStatusBadge(editingBooking.status)}>{getStatusText(editingBooking.status)}</Badge>
              </div>
            )}
            <div>
              <Label htmlFor="editBookingDate">Fecha del Evento *</Label>
              <Input id="editBookingDate" type="date" value={editBookingForm.date} onChange={(e) => setEditBookingForm({ ...editBookingForm, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="editBookingTime">Hora de Inicio *</Label>
              <Input id="editBookingTime" type="time" value={editBookingForm.startTime} onChange={(e) => setEditBookingForm({ ...editBookingForm, startTime: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowEditBookingDialog(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveEditedBooking} className="flex-1">Guardar Cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
