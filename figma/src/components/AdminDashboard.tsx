import { useState, useMemo } from 'react';
import { Provider, User, Artist, Contract, Booking, Review } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AdminDashboardProps {
  currentUser: User;
  providers: Provider[];
  users: User[];
  artists: Artist[];
  contracts: Contract[];
  bookings: Booking[];
  reviews: Review[];
  onVerifyProvider: (providerId: string) => Promise<void>;
  onBanProvider: (providerId: string, reason: string) => Promise<void>;
  onUnbanProvider: (providerId: string) => Promise<void>;
  onBanUser: (userId: string, reason: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  onArchiveUser: (userId: string) => Promise<void>;
  onUnarchiveUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onApproveProviderAccess: (userId: string) => Promise<void>;
  onRevokeProviderAccess: (userId: string) => Promise<void>;
}

export function AdminDashboard({
  currentUser,
  providers,
  users,
  artists,
  contracts,
  bookings,
  reviews,
  onVerifyProvider,
  onBanProvider,
  onUnbanProvider,
  onBanUser,
  onUnbanUser,
  onArchiveUser,
  onUnarchiveUser,
  onDeleteUser,
  onApproveProviderAccess,
  onRevokeProviderAccess
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified' | 'banned'>('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'provider' | 'user'>('provider');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Check if current user is admin
  if (currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalProviders = providers.length;
    const verifiedProviders = providers.filter(p => p.verified && !p.banned).length;
    const bannedProviders = providers.filter(p => p.banned).length;
    const totalServices = artists.length;
    const activeServices = artists.filter(a => !a.isArchived && a.isPublished).length;
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = contracts.reduce((sum, c) => sum + c.terms.price, 0);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return {
      totalUsers,
      totalProviders,
      verifiedProviders,
      bannedProviders,
      totalServices,
      activeServices,
      totalContracts,
      activeContracts,
      totalBookings,
      completedBookings,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10
    };
  }, [users, providers, artists, contracts, bookings, reviews]);

  // Filter providers
  const filteredProviders = useMemo(() => {
    let filtered = [...providers];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus === 'verified') {
      filtered = filtered.filter(p => p.verified && !p.banned);
    } else if (filterStatus === 'unverified') {
      filtered = filtered.filter(p => !p.verified && !p.banned);
    } else if (filterStatus === 'banned') {
      filtered = filtered.filter(p => p.banned);
    }

    return filtered;
  }, [providers, searchQuery, filterStatus]);

  const handleVerifyProvider = async (providerId: string) => {
    try {
      await onVerifyProvider(providerId);
      toast.success('Proveedor verificado exitosamente');
    } catch (error) {
      toast.error('Error al verificar proveedor');
    }
  };

  const handleBanProvider = async () => {
    if (!selectedProvider || !banReason.trim()) {
      toast.error('Por favor ingresa una razón para el baneo');
      return;
    }

    try {
      await onBanProvider(selectedProvider.id, banReason);
      setShowBanDialog(false);
      setBanReason('');
      setSelectedProvider(null);
      toast.success('Proveedor baneado exitosamente');
    } catch (error) {
      toast.error('Error al banear proveedor');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error('Por favor ingresa una razón para el baneo');
      return;
    }

    try {
      await onBanUser(selectedUserId, banReason);
      setShowBanDialog(false);
      setBanReason('');
      setSelectedUserId(null);
      toast.success('Usuario baneado exitosamente');
    } catch (error) {
      toast.error('Error al banear usuario');
    }
  };

  const handleUnbanProvider = async (providerId: string) => {
    try {
      await onUnbanProvider(providerId);
      toast.success('Proveedor desbaneado exitosamente');
    } catch (error) {
      toast.error('Error al desbanear proveedor');
    }
  };

  const openBanDialog = (provider: Provider) => {
    setSelectedProvider(provider);
    setBanType('provider');
    setShowBanDialog(true);
  };

  // Get provider's services
  const getProviderServices = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return [];
    return artists.filter(a => a.userId === provider.userId);
  };

  // Get provider's user data
  const getProviderUser = (provider: Provider) => {
    return users.find(u => u.id === provider.userId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8" style={{ color: '#D4AF37' }} />
          <h1 className="text-3xl">Panel de Administración</h1>
        </div>
        <p className="text-gray-600">Gestiona y modera el marketplace de Memorialo</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Usuarios Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl">{stats.totalUsers}</div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.totalProviders}</div>
                <div className="text-xs text-gray-600">
                  {stats.verifiedProviders} verificados
                </div>
              </div>
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contratos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.activeContracts}</div>
                <div className="text-xs text-gray-600">
                  {stats.totalContracts} totales
                </div>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rating Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl">{stats.avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">
                  {reviews.length} reseñas
                </div>
              </div>
              <Star className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{stats.activeServices}</div>
            <div className="text-xs text-gray-600">{stats.totalServices} totales</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Reservas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1">{stats.completedBookings}</div>
            <div className="text-xs text-gray-600">{stats.totalBookings} totales</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Proveedores Baneados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl mb-1 text-red-600">{stats.bannedProviders}</div>
            <div className="text-xs text-gray-600">Requieren atención</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">
            <Briefcase className="h-4 w-4 mr-2" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="services">
            <FileText className="h-4 w-4 mr-2" />
            Servicios
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Proveedores</CardTitle>
              <CardDescription>
                Verifica y modera los proveedores del marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="verified">Verificados</SelectItem>
                    <SelectItem value="unverified">No Verificados</SelectItem>
                    <SelectItem value="banned">Baneados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Providers Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron proveedores
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProviders.map((provider) => {
                        const providerUser = getProviderUser(provider);
                        const services = getProviderServices(provider.id);
                        return (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div>
                                <div>{provider.businessName}</div>
                                <div className="text-xs text-gray-500">
                                  ID: {provider.id.slice(0, 8)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{provider.category}</TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm">{providerUser?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{providerUser?.email || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{services.length}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span>{provider.rating.toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {provider.banned ? (
                                  <Badge variant="destructive" className="w-fit">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Baneado
                                  </Badge>
                                ) : provider.verified ? (
                                  <Badge variant="default" className="w-fit bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verificado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="w-fit">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    No Verificado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {provider.banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnbanProvider(provider.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Desbanear
                                  </Button>
                                ) : (
                                  <>
                                    {!provider.verified && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleVerifyProvider(provider.id)}
                                        style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                                      >
                                        <ShieldCheck className="h-4 w-4 mr-1" />
                                        Verificar
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openBanDialog(provider)}
                                    >
                                      <Ban className="h-4 w-4 mr-1" />
                                      Banear
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Vista general de todos los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Acceso Proveedor</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No hay usuarios registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>Tel: {user.phone || 'No registrado'}</div>
                              <div>WhatsApp: {user.whatsappNumber || 'No registrado'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              <Badge style={{ backgroundColor: '#D4AF37' }}>
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : user.isProvider ? (
                              <Badge variant="secondary">
                                <Briefcase className="h-3 w-3 mr-1" />
                                Proveedor
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                Cliente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isProvider ? (
                              <Badge className="bg-green-600">Aprobado</Badge>
                            ) : user.providerRequestStatus === 'pending' ? (
                              <Badge variant="secondary">Pendiente</Badge>
                            ) : user.providerRequestStatus === 'rejected' ? (
                              <Badge variant="destructive">Rechazado</Badge>
                            ) : (
                              <Badge variant="outline">Sin solicitud</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('es-VE')}
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge variant="destructive">Baneado</Badge>
                            ) : user.archived ? (
                              <Badge variant="secondary">Archivado</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">Activo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role !== 'admin' && (
                              <div className="flex gap-2 flex-wrap">
                                {user.banned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await onUnbanUser(user.id);
                                        toast.success('Usuario desbaneado');
                                      } catch (error) {
                                        toast.error('Error al desbanear');
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Desbanear
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setBanType('user');
                                      setShowBanDialog(true);
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Banear
                                  </Button>
                                )}
                                
                                {user.archived ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await onUnarchiveUser(user.id);
                                        toast.success('Usuario restaurado');
                                      } catch (error) {
                                        toast.error('Error al restaurar');
                                      }
                                    }}
                                  >
                                    Restaurar
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      if (confirm(`¿Archivar a ${user.name}? Sus servicios se ocultarán pero los datos se mantendrán.`)) {
                                        try {
                                          await onArchiveUser(user.id);
                                          toast.success('Usuario archivado');
                                        } catch (error) {
                                          toast.error('Error al archivar');
                                        }
                                      }
                                    }}
                                  >
                                    Archivar
                                  </Button>
                                )}

                                {user.isProvider ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      if (confirm(`¿Cancelar acceso como proveedor para ${user.name}?`)) {
                                        try {
                                          await onRevokeProviderAccess(user.id);
                                        } catch {
                                          // handled in parent
                                        }
                                      }
                                    }}
                                  >
                                    Cancelar Acceso Proveedor
                                  </Button>
                                ) : user.providerRequestStatus === 'pending' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await onApproveProviderAccess(user.id);
                                      } catch {
                                        // handled in parent
                                      }
                                    }}
                                    style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                                  >
                                    Aprobar Acceso Proveedor
                                  </Button>
                                ) : null}
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm(`¿ELIMINAR PERMANENTEMENTE a ${user.name}? Esta acción NO se puede deshacer y borrará todos sus datos.`)) {
                                      try {
                                        await onDeleteUser(user.id);
                                        toast.success('Usuario eliminado');
                                      } catch (error) {
                                        toast.error('Error al eliminar');
                                      }
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Publicados</CardTitle>
              <CardDescription>
                Vista general de todos los servicios en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Precio/Hora</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artists.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No hay servicios publicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      artists.map((service) => {
                        const provider = providers.find(p => p.userId === service.userId);
                        return (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img 
                                  src={service.image} 
                                  alt={service.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <div>
                                  <div>{service.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {service.location}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{service.category}</TableCell>
                            <TableCell>{provider?.businessName || 'N/A'}</TableCell>
                            <TableCell>${service.pricePerHour}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span>{service.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">
                                  ({service.reviews})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.isArchived ? (
                                <Badge variant="secondary">Archivado</Badge>
                              ) : service.isPublished === false ? (
                                <Badge variant="outline">No Publicado</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-600">
                                  Publicado
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banear Proveedor</DialogTitle>
            <DialogDescription>
              Estás a punto de banear a {selectedProvider?.businessName}. Esta acción ocultará todos sus servicios y no podrá acceder a la plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Razón del Baneo *</Label>
              <Textarea
                id="ban-reason"
                placeholder="Explica por qué estás baneando a este proveedor..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason('');
                setSelectedProvider(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={banType === 'provider' ? handleBanProvider : handleBanUser}
              disabled={!banReason.trim()}
            >
              <Ban className="h-4 w-4 mr-2" />
              Confirmar Baneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}