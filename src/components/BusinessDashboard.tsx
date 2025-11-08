import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  CheckCircle2,
  Clock,
  XCircle,
  CalendarPlus
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
}

const categories = [
  'Músicos',
  'DJs',
  'Mariachis',
  'Bandas',
  'Cantantes',
  'Animadores',
  'Magos',
  'Payasos',
  'Fotógrafos',
  'Videógrafos'
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
  onProviderCreate
}: BusinessDashboardProps) {
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingService, setEditingService] = useState<Artist | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [showProviderSetup, setShowProviderSetup] = useState(!provider);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [creatingBookingContract, setCreatingBookingContract] = useState<Contract | null>(null);

  // Debug logging
  console.log('BusinessDashboard - User ID:', user.id);
  console.log('BusinessDashboard - Services received:', services);
  console.log('BusinessDashboard - Services count:', services.length);

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

  const handleEditService = (service: Artist) => {
    setEditingService(service);
    setShowServiceEditor(true);
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      onServiceDelete(serviceId);
      toast.success('Servicio eliminado');
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
    
    const statusMap: { [key: string]: string } = {
      'pending': 'pendiente',
      'confirmed': 'confirmada',
      'completed': 'completada',
      'cancelled': 'cancelada'
    };
    toast.success(`Reserva ${statusMap[status]}`);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'signed': 'bg-green-600',
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
      'signed': 'Firmado',
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Servicios</p>
                <p className="text-2xl mt-1">{services.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contratos</p>
                <p className="text-2xl mt-1">{providerContracts.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos</p>
                <p className="text-2xl mt-1">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservas Totales</p>
                <p className="text-2xl mt-1">{totalBookings}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl mt-1">{pendingBookings}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl mt-1">{confirmedBookings}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl mt-1">{completedBookings}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {services.length} servicio{services.length !== 1 ? 's' : ''} publicado{services.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={() => {
              setEditingService(null);
              setShowServiceEditor(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Servicio
            </Button>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video rounded-lg overflow-hidden mb-3">
                      <ImageWithFallback
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
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
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
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
          ) : (
            <div className="space-y-3">
              {providerContracts.map((contract) => {
                const isSigned = contract.clientSignature && contract.artistSignature;
                const contractHasBooking = hasBooking(contract.id);
                
                return (
                  <Card key={contract.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base">Contrato con {contract.clientName}</h4>
                            <Badge 
                              className={getStatusBadge(contract.status)}
                              variant={contract.status.includes('pending') ? 'outline' : 'default'}
                            >
                              {getStatusText(contract.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {contract.terms.serviceDescription.split('\n')[0]}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-gray-600">Fecha</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(contract.terms.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duración</p>
                          <p>{contract.terms.duration}h</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Precio</p>
                          <p className="text-green-600">${contract.terms.price}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ubicación</p>
                          <p>{contract.terms.location}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewContract(contract)}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Contrato
                        </Button>
                        
                        {isSigned && !contractHasBooking && (
                          <Button
                            size="sm"
                            onClick={() => handleCreateBooking(contract)}
                          >
                            <CalendarPlus className="w-4 h-4 mr-2" />
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
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
          ) : (
            <div className="space-y-3">
              {providerBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base">{booking.clientName}</h4>
                          <Badge className={getStatusBadge(booking.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(booking.status)}
                              {getStatusText(booking.status)}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-600">Fecha</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hora</p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.startTime || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duración</p>
                        <p>{booking.duration} horas</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ubicación</p>
                        <p>{booking.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio</p>
                        <p className="text-green-600">${booking.totalPrice}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      {booking.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          >
                            Rechazar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          >
                            Aceptar
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                        >
                          Marcar como Completada
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
}
