import { useState, useMemo } from 'react';
import { Provider, User, Artist, Contract, Booking, Review } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  AlertTriangle,
  Menu,
  X,
  Activity,
  LayoutDashboard,
  BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AdminBillingSection } from './AdminBillingSection';

interface AdminDashboardProps {
  currentUser: User;
  accessToken: string | null;
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

type AdminSection = 'overview' | 'billing' | 'providers' | 'users' | 'services';

const adminNavItems = [
  { id: 'overview' as const, label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'billing' as const, label: 'Facturación', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'providers' as const, label: 'Proveedores', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'users' as const, label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
  { id: 'services' as const, label: 'Servicios', icon: <BookOpen className="w-5 h-5" /> },
];

export function AdminDashboard({
  currentUser,
  accessToken,
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
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleNavClick = (section: AdminSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#1B2A47]/10">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-0.5">Panel Admin</p>
        <p className="text-sm text-gray-500 truncate">{currentUser.name}</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = activeSection === item.id;

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
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-[#1B2A47] to-[#2d4270] rounded-xl p-3 text-white text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">Resumen</span>
          </div>
          <p className="text-gray-300">
            {stats.totalUsers} usuarios · {stats.totalProviders} proveedores · {stats.activeServices} servicios activos
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
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

      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-[#1B2A47] text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-[#1B2A47]">
              {adminNavItems.find((item) => item.id === activeSection)?.label}
            </p>
            <p className="text-xs text-gray-500">{currentUser.name}</p>
          </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8" style={{ color: '#D4AF37' }} />
              <h1 className="text-3xl text-[#1B2A47]">Panel de Administración</h1>
            </div>
            <p className="text-gray-600">Gestiona y modera el marketplace de Memorialo</p>
          </div>

          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Resumen</h2>
                <p className="text-gray-500 text-sm">Vista general del ecosistema y métricas principales</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Estado del Marketplace</CardTitle>
                    <CardDescription>Indicadores principales para seguimiento operativo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Contratos activos</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.activeContracts}</p>
                        <p className="text-xs text-gray-500">{stats.totalContracts} contratos totales</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Reservas completadas</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.completedBookings}</p>
                        <p className="text-xs text-gray-500">{stats.totalBookings} reservas totales</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Promedio de reputación</p>
                        <p className="text-2xl font-semibold text-[#1B2A47]">{stats.avgRating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">{reviews.length} reseñas registradas</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4 bg-white">
                        <p className="text-sm text-gray-500 mb-1">Proveedores baneados</p>
                        <p className="text-2xl font-semibold text-red-600">{stats.bannedProviders}</p>
                        <p className="text-xs text-gray-500">Requieren seguimiento administrativo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones sugeridas</CardTitle>
                    <CardDescription>Puntos de control inmediatos del panel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Proveedores pendientes</p>
                      <p>{providers.filter((provider) => !provider.verified && !provider.banned).length} sin verificar</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Usuarios con solicitud</p>
                      <p>{users.filter((user) => user.providerRequestStatus === 'pending').length} esperando aprobación</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-[#1B2A47]">Servicios publicados</p>
                      <p>{stats.activeServices} activos sobre {stats.totalServices} cargados</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'providers' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Proveedores</h2>
                <p className="text-gray-500 text-sm">Verifica y modera los proveedores del marketplace</p>
              </div>

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
            </div>
          )}

          {activeSection === 'billing' && (
            <AdminBillingSection accessToken={accessToken} />
          )}

          {activeSection === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Usuarios</h2>
                <p className="text-gray-500 text-sm">Vista general y acciones administrativas sobre usuarios</p>
              </div>

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
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Servicios</h2>
                <p className="text-gray-500 text-sm">Inventario publicado y estado general del catálogo</p>
              </div>

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
            </div>
          )}
        </div>
      </main>

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