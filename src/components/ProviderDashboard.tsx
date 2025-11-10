import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Artist, Contract, User, Provider } from '../types';
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
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProviderDashboardProps {
  user: User;
  provider: Provider | null;
  services: Artist[];
  contracts: Contract[];
  onServiceCreate: (service: Artist) => void;
  onServiceUpdate: (service: Artist) => void;
  onServiceDelete: (serviceId: string) => void;
  onContractUpdate: (contract: Contract) => void;
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

export function ProviderDashboard({ 
  user, 
  provider,
  services, 
  contracts, 
  onServiceCreate, 
  onServiceUpdate, 
  onServiceDelete,
  onContractUpdate,
  onProviderCreate
}: ProviderDashboardProps) {
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingService, setEditingService] = useState<Artist | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [showProviderSetup, setShowProviderSetup] = useState(!provider);

  // Setup Provider Profile
  const [providerForm, setProviderForm] = useState({
    businessName: '',
    category: '',
    description: ''
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

  const pendingContracts = providerContracts.filter(c => 
    c.status === 'pending_artist' || c.status === 'pending_client'
  );
  
  const signedContracts = providerContracts.filter(c => c.status === 'signed');

  // Calculate stats
  const totalRevenue = signedContracts.reduce((sum, c) => sum + c.terms.price, 0);
  const averageRating = services.length > 0 
    ? services.reduce((sum, s) => sum + s.rating, 0) / services.length 
    : 0;

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

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'signed': 'bg-green-600',
      'pending_client': 'border-orange-500 text-orange-700',
      'pending_artist': 'border-orange-500 text-orange-700',
      'cancelled': 'bg-red-100 text-red-800'
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
      'cancelled': 'Cancelado'
    };

    return statusTexts[status] || status;
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
        <h1 className="mb-2">Panel de Proveedor</h1>
        <p className="text-gray-600">
          Gestiona tus servicios, contratos y reservas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-sm text-gray-600">Calificación</p>
                <p className="text-2xl mt-1">{averageRating.toFixed(1)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Mis Servicios</TabsTrigger>
          <TabsTrigger value="contracts">
            Contratos
            {pendingContracts.length > 0 && (
              <Badge className="ml-2 bg-orange-500">
                {pendingContracts.length}
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
              {providerContracts.map((contract) => (
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

                    <Button
                      size="sm"
                      onClick={() => handleViewContract(contract)}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Contrato Completo
                    </Button>
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
          if (editingService) {
            onServiceUpdate(service);
          } else {
            onServiceCreate(service);
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
          onReject={(rejectedContract) => {
            onContractUpdate(rejectedContract);
            setShowContractView(false);
            setSelectedContract(null);
          }}
          userType="artist"
        />
      )}
    </div>
  );
}
