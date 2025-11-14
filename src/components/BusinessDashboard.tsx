import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Artist, Contract, User, Provider, Booking } from '../types';
import { ServiceEditor } from './ServiceEditor';
import { ContractView } from './ContractView';
import { ClientDashboard } from './ClientDashboard';
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
  Search
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
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showEditBookingDialog, setShowEditBookingDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  
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

  // Sort contracts: pending first, active/signed, then completed last
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

  // Sort bookings: pending first, confirmed second, completed third, cancelled last
  const sortedBookings = [...providerBookings].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4
    };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  // Filtered lists based on search
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
      // Soft delete - marcar como archivado en lugar de eliminar
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
    
    // If marking as completed, also update the contract
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

    // Update the booking
    const updatedBooking: Booking = {
      ...editingBooking,
      date: editBookingForm.date,
      startTime: editBookingForm.startTime
    };

    onBookingUpdate(updatedBooking);

    // Also update the associated contract if it exists
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

  // Check if a booking has a pending contract (waiting for provider signature)
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

  // Check if a contract has an associated booking
  const hasBooking = (contractId: string) => {
    return providerBookings.some(b => b.contractId === contractId);
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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2">Mi Negocio</h1>
        <p className="text-gray-600">
          Gestiona tus servicios, contratos, reservas y más
        </p>
      </div>

      {/* Stats - Mobile Button */}
      <div className="md:hidden mb-6">
        <Button 
          onClick={() => setShowMetricsModal(true)}
          className="w-full"
          variant="outline"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Ver Estadísticas del Negocio
        </Button>
      </div>

      {/* Stats - Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Servicios</p>
                <p className="text-lg">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Contratos</p>
                <p className="text-lg">{providerContracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Ingresos</p>
                <p className="text-lg">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Reservas</p>
                <p className="text-lg">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pendientes</p>
                <p className="text-lg">{pendingBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Confirmadas</p>
                <p className="text-lg">{confirmedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Completadas</p>
                <p className="text-lg">{completedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Modal for Mobile */}
      <Dialog open={showMetricsModal} onOpenChange={setShowMetricsModal}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estadísticas del Negocio</DialogTitle>
            <DialogDescription>
              Resumen de tu actividad y métricas principales
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg inline-flex mb-2">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Servicios</p>
                  <p className="text-2xl">{services.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-lg inline-flex mb-2">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Contratos</p>
                  <p className="text-2xl">{providerContracts.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-lg inline-flex mb-2">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Ingresos Totales</p>
                  <p className="text-3xl">${totalRevenue.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-indigo-100 p-3 rounded-lg inline-flex mb-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Reservas Totales</p>
                  <p className="text-2xl">{totalBookings}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-yellow-100 p-3 rounded-lg inline-flex mb-2">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Pendientes</p>
                  <p className="text-2xl">{pendingBookings}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg inline-flex mb-2">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Confirmadas</p>
                  <p className="text-2xl">{confirmedBookings}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-lg inline-flex mb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Completadas</p>
                  <p className="text-2xl">{completedBookings}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Tab Selector */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full border-2 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="services">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Mis Servicios</span>
                </div>
              </SelectItem>
              <SelectItem value="contracts">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Contratos</span>
                  {pendingContracts.length > 0 && (
                    <Badge className="ml-2 bg-orange-500 text-xs">
                      {pendingContracts.length}
                    </Badge>
                  )}
                </div>
              </SelectItem>
              <SelectItem value="bookings">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Reservas</span>
                  {pendingBookings > 0 && (
                    <Badge className="ml-2 bg-yellow-500 text-xs">
                      {pendingBookings}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tab List */}
        <TabsList className="hidden md:grid w-full grid-cols-3">
          <TabsTrigger value="services">Mis Servicios</TabsTrigger>
          <TabsTrigger value="contracts">
            Contratos
            {pendingContracts.length > 0 && (
              <Badge className="ml-2 bg-orange-500">
                {pendingContracts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Reservas
            {pendingBookings > 0 && (
              <Badge className="ml-2 bg-yellow-500">
                {pendingBookings}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4 mt-3 md:mt-6">
          <div className="space-y-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
              <Input
                type="text"
                placeholder="Buscar por nombre de servicio..."
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                className="h-10 pl-10 border-2 border-gray-300 focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {activeServices.length} activo{activeServices.length !== 1 ? 's' : ''} • {archivedServices.length} archivado{archivedServices.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={() => {
                setEditingService(null);
                setShowServiceEditor(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Crear Servicio</span>
                <span className="sm:hidden">Crear</span>
              </Button>
            </div>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg mb-2">No tienes servicios publicados</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Crea tu primer servicio para comenzar a recibir reservas
                </p>
                <Button onClick={() => setShowServiceEditor(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Servicio
                </Button>
              </CardContent>
            </Card>
          ) : activeServices.length === 0 && archivedServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No se encontraron servicios</p>
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Active Services */}
              {activeServices.length > 0 && (
                <div>
                  <h3 className="text-sm mb-3 text-gray-500 uppercase tracking-wide">
                    Servicios Activos ({activeServices.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeServices.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="p-4">
                          <div className="aspect-video rounded-lg overflow-hidden mb-3 relative">
                            <ImageWithFallback
                              src={service.image}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                            {!service.isPublished && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500 text-white">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Oculto
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-base mb-1">{service.name}</h3>
                              <p className="text-sm text-gray-600">{service.category}</p>
                            </div>
                            {service.verified && (
                              <CheckCircle2 className="w-5 h-5 text-blue-500 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{service.rating}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{service.reviews} reseñas</span>
                            {!service.isPublished && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-yellow-600 text-xs">No visible</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <p>{service.servicePlans.length} planes disponibles</p>
                            <p>Desde ${Math.min(...service.servicePlans.map(p => p.price))}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditService(service)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteServiceClick(service.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Archivar servicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Services */}
              {archivedServices.length > 0 && (
                <div>
                  <h3 className="text-sm mb-3 text-gray-500 uppercase tracking-wide">
                    Servicios Archivados ({archivedServices.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archivedServices.map((service) => (
                      <Card key={service.id} className="opacity-60 border-dashed">
                        <CardContent className="p-4">
                          <div className="aspect-video rounded-lg overflow-hidden mb-3 relative">
                            <ImageWithFallback
                              src={service.image}
                              alt={service.name}
                              className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gray-600 text-white">
                                Archivado
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-base mb-1">{service.name}</h3>
                              <p className="text-sm text-gray-600">{service.category}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <p className="italic">Este servicio está archivado</p>
                            <p className="text-xs mt-1">Los contratos y reservas existentes se conservaron</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const restoredService = { ...service, isArchived: false };
                                onServiceUpdate(restoredService);
                                toast.success('Servicio restaurado');
                              }}
                              className="flex-1"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Restaurar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4 mt-3 md:mt-6">
          {providerContracts.length > 0 && (
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
              <Input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={searchContract}
                onChange={(e) => setSearchContract(e.target.value)}
                className="h-10 pl-10 border-2 border-gray-300 focus:border-[#D4AF37]"
              />
              {searchContract && (
                <p className="text-sm text-gray-600 mt-2">
                  {filteredContracts.length} de {sortedContracts.length} contrato{sortedContracts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          
          {providerContracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No tienes contratos aún</p>
                <p className="text-sm text-gray-400 mt-1">
                  Los contratos aparecerán cuando los clientes hagan reservas
                </p>
              </CardContent>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No se encontraron contratos</p>
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otro nombre de cliente
                </p>
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
                          <AlertCircle className="w-4 h-4 text-orange-700 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-orange-900">
                            <strong>Acción requerida:</strong> El cliente firmó. Revisa y firma el contrato.
                          </p>
                        </div>
                      )}
                      
                      {/* Compact View */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm truncate">{contract.clientName}</h4>
                            <Badge 
                              className={`${getStatusBadge(contract.status)} text-xs`}
                              variant={contract.status.includes('pending') ? 'outline' : 'default'}
                            >
                              {getStatusText(contract.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(contract.terms.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-green-600">${contract.terms.price}</span>
                          </div>
                        </div>
                        
                        {/* Action Icons */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                            className="h-8 w-8 p-0"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-900" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewContract(contract)}
                            className="h-8 w-8 p-0"
                            title="Ver contrato"
                          >
                            <FileText className="w-4 h-4 text-gray-900" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-3">
                          <p className="text-sm text-gray-600">
                            {contract.terms.serviceDescription.split('\n')[0]}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500">Fecha</p>
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(contract.terms.date).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hora y Duración</p>
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {contract.terms.startTime || 'N/A'} • {contract.terms.duration}h
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Precio</p>
                              <p className="text-green-600">${contract.terms.price}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Ubicación</p>
                              <p className="truncate">{contract.terms.location}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {isSigned && !contractHasBooking && (
                              <Button
                                size="sm"
                                onClick={() => handleCreateBooking(contract)}
                                className="flex-1"
                              >
                                <CalendarPlus className="w-4 h-4 mr-1" />
                                Crear Reserva
                              </Button>
                            )}
                            
                            {contractHasBooking && (
                              <Badge variant="outline" className="text-green-700 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Reserva creada
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
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4 mt-3 md:mt-6">
          {providerBookings.length > 0 && (
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#D4AF37' }} />
              <Input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={searchBooking}
                onChange={(e) => setSearchBooking(e.target.value)}
                className="h-10 pl-10 border-2 border-gray-300 focus:border-[#D4AF37]"
              />
              {searchBooking && (
                <p className="text-sm text-gray-600 mt-2">
                  {filteredBookings.length} de {providerBookings.length} reserva{providerBookings.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          
          {providerBookings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No tienes reservas aún</p>
                <p className="text-sm text-gray-400 mt-1">
                  Las reservas aparecerán aquí después de crear contratos y confirmarlos
                </p>
              </CardContent>
            </Card>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No se encontraron reservas</p>
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otro nombre de cliente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredBookings.map((booking) => {
                // Check if this booking has a contract pending provider signature
                const isPendingProviderSignature = hasContractPendingProvider(booking);
                const displayStatus = isPendingProviderSignature ? 'pending' : booking.status;
                const isExpanded = expandedBookingId === booking.id;
                
                return (
                  <Card key={booking.id} className={booking.status === 'pending' ? 'border-2 border-yellow-400 bg-yellow-50/30' : ''}>
                  <CardContent className="p-3">
                    {isPendingProviderSignature && (
                      <div className="mb-2 flex items-start gap-2 bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                        <Clock className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-900">
                          <strong>Pendiente:</strong> Se confirmará al firmar el contrato. Puedes editar antes de firmar.
                        </p>
                      </div>
                    )}
                    
                    {/* Compact View */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm truncate">{booking.clientName}</h4>
                          <Badge className={`${getStatusBadge(displayStatus)} text-xs`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(displayStatus)}
                              {getStatusText(displayStatus)}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(booking.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.startTime || 'N/A'}
                          </span>
                          <span className="text-green-600">${booking.totalPrice}</span>
                        </div>
                      </div>
                      
                      {/* Action Icons */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="h-8 w-8 p-0"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4 text-gray-900" />
                        </Button>
                        {booking.contractId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const contract = providerContracts.find(c => c.id === booking.contractId);
                              if (contract) {
                                handleViewContract(contract);
                              }
                            }}
                            className="h-8 w-8 p-0"
                            title="Ver contrato"
                          >
                            <FileText className="w-4 h-4 text-gray-900" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Fecha</p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(booking.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Hora</p>
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.startTime || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duración</p>
                            <p>{booking.duration} horas</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ubicación</p>
                            <p className="truncate">{booking.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Precio</p>
                            <p className="text-green-600">${booking.totalPrice}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {displayStatus === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditBooking(booking)}
                              className="flex-1"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Editar Fecha/Hora
                            </Button>
                          )}
                          
                          {displayStatus === 'confirmed' && (
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                              className="flex-1"
                            >
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
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServiceEditor
        open={showServiceEditor}
        onClose={() => {
          setShowServiceEditor(false);
          setEditingService(null);
        }}
        onSave={(service) => {
          // Add userId to service
          const serviceWithUser = {
            ...service,
            userId: user.id
          };
          
          if (editingService) {
            onServiceUpdate(serviceWithUser);
          } else {
            onServiceCreate(serviceWithUser);
          }
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
          onClose={() => {
            setShowContractView(false);
            setSelectedContract(null);
          }}
          onSign={(signedContract) => {
            onContractUpdate(signedContract);
            
            // When provider signs and contract becomes active (both parties signed), 
            // update the associated booking to 'confirmed'
            const associatedBooking = providerBookings.find(b => b.contractId === signedContract.id);
            if (associatedBooking && signedContract.status === 'active') {
              const updatedBooking = {
                ...associatedBooking,
                status: 'confirmed' as const
              };
              onBookingUpdate(updatedBooking);
              toast.success('¡Contrato completamente firmado y reserva confirmada!');
            } else if (associatedBooking && associatedBooking.status === 'pending') {
              // Provider signed but waiting for client signature
              toast.success('¡Contrato firmado! Esperando firma del cliente para confirmar la reserva.');
            }
            
            setShowContractView(false);
            setSelectedContract(null);
          }}
          onReject={(rejectedContract) => {
            onContractUpdate(rejectedContract);
            
            // When provider rejects, cancel the associated booking
            const associatedBooking = providerBookings.find(b => b.contractId === rejectedContract.id);
            if (associatedBooking) {
              const updatedBooking = {
                ...associatedBooking,
                status: 'cancelled' as const
              };
              onBookingUpdate(updatedBooking);
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
            <DialogDescription>
              Establece la fecha, hora y duración para esta reserva
            </DialogDescription>
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
              <Input
                id="bookingDate"
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bookingTime">Hora de Inicio *</Label>
              <Input
                id="bookingTime"
                type="time"
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="bookingDuration">Duración (horas) *</Label>
              <Input
                id="bookingDuration"
                type="number"
                min="1"
                value={bookingForm.duration}
                onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveBooking}
                className="flex-1"
                disabled={!bookingForm.date || !bookingForm.startTime}
              >
                Crear Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={showEditBookingDialog} onOpenChange={setShowEditBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fecha y Hora de Reserva</DialogTitle>
            <DialogDescription>
              Modifica la fecha y hora de esta reserva pendiente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingBooking && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>Cliente:</strong> {editingBooking.clientName}</p>
                <p><strong>Servicio:</strong> {editingBooking.eventType}</p>
                <p><strong>Precio:</strong> ${editingBooking.totalPrice}</p>
                <Badge className={getStatusBadge(editingBooking.status)}>
                  {getStatusText(editingBooking.status)}
                </Badge>
              </div>
            )}

            <div>
              <Label htmlFor="editBookingDate">Fecha del Evento *</Label>
              <Input
                id="editBookingDate"
                type="date"
                value={editBookingForm.date}
                onChange={(e) => setEditBookingForm({ ...editBookingForm, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="editBookingTime">Hora de Inicio *</Label>
              <Input
                id="editBookingTime"
                type="time"
                value={editBookingForm.startTime}
                onChange={(e) => setEditBookingForm({ ...editBookingForm, startTime: e.target.value })}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> Al editar la fecha u hora, se actualizará también el contrato asociado. 
                El cliente será notificado de los cambios.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditBookingDialog(false);
                  setEditingBooking(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEditedBooking}
                className="flex-1"
                disabled={!editBookingForm.date || !editBookingForm.startTime}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Service Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteServiceConfirmed}
        title="¿Archivar este servicio?"
        description="El servicio será archivado y no será visible en la búsqueda pública. Todos los contratos y reservas asociados se conservarán. Podrás restaurarlo cuando quieras."
        confirmText="Sí, archivar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
