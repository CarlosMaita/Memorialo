import { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ContractView } from './ContractView';
import { Contract } from '../types';
import { toast } from 'sonner@2.0.3';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface Booking {
  id: string;
  clientName: string;
  date: string;
  duration: number;
  eventType: string;
  location: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  contractId?: string;
}

interface ArtistDashboardProps {
  contracts?: Contract[];
  onContractUpdate?: (contract: Contract) => void;
}

export function ArtistDashboard({ contracts = [], onContractUpdate }: ArtistDashboardProps) {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Presentación para Boda - 3 Horas',
      description: 'Presentación completa para tu día especial',
      price: 450,
      duration: 3
    },
    {
      id: '2',
      name: 'Evento Corporativo - 2 Horas',
      description: 'Entretenimiento profesional para reuniones corporativas',
      price: 350,
      duration: 2
    }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      clientName: 'Juan García',
      date: '2025-11-15',
      duration: 3,
      eventType: 'Boda',
      location: 'Los Ángeles, CA',
      totalPrice: 450,
      status: 'pending'
    },
    {
      id: '2',
      clientName: 'María López',
      date: '2025-11-20',
      duration: 2,
      eventType: 'Evento Corporativo',
      location: 'Santa Mónica, CA',
      totalPrice: 350,
      status: 'confirmed'
    },
    {
      id: '3',
      clientName: 'Miguel Hernández',
      date: '2025-10-30',
      duration: 4,
      eventType: 'Fiesta de Cumpleaños',
      location: 'Beverly Hills, CA',
      totalPrice: 600,
      status: 'completed'
    }
  ]);

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '1'
  });
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);

  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      price: '',
      duration: '1'
    });
    setShowServiceDialog(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString()
    });
    setShowServiceDialog(true);
  };

  const handleSaveService = () => {
    if (editingService) {
      setServices(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...serviceForm, price: parseFloat(serviceForm.price), duration: parseInt(serviceForm.duration) }
          : s
      ));
      toast.success('Servicio actualizado exitosamente');
    } else {
      const newService: Service = {
        id: Date.now().toString(),
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration)
      };
      setServices([...services, newService]);
      toast.success('Servicio agregado exitosamente');
    }
    setShowServiceDialog(false);
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    toast.success('Servicio eliminado');
  };

  const handleUpdateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    const statusMap: { [key: string]: string } = {
      'pending': 'pendiente',
      'confirmed': 'confirmada',
      'completed': 'completada',
      'cancelled': 'cancelada'
    };
    toast.success(`Reserva ${statusMap[status]}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.totalPrice, 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservas Totales</p>
                <p className="mt-1">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="mt-1">{stats.pendingBookings}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="mt-1">{stats.confirmedBookings}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos</p>
                <p className="mt-1">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="services">Mis Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm mb-1">{booking.clientName}</h3>
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{booking.startTime || 'N/A'}</span>
                      </div>
                      <div className="text-gray-600">
                        <span>{booking.duration} horas</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-green-600">${booking.totalPrice}</span>
                      
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
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
                        </div>
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay contratos pendientes</p>
                  <p className="text-sm mt-1">Los contratos aparecerán aquí cuando los clientes hagan reservas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm mb-1">Contrato con {contract.clientName}</h3>
                          <p className="text-sm text-gray-600">
                            {contract.terms.serviceDescription.split('\n')[0]}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Fecha: {new Date(contract.terms.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge className={
                          contract.status === 'signed' ? 'bg-green-600' :
                          contract.status === 'pending_artist' ? 'border-orange-500 text-orange-700' :
                          contract.status === 'pending_client' ? 'bg-blue-600' : ''
                        } variant={contract.status === 'pending_artist' ? 'outline' : 'default'}>
                          {contract.status === 'signed' && 'Firmado'}
                          {contract.status === 'pending_artist' && 'Pendiente de tu firma'}
                          {contract.status === 'pending_client' && 'Pendiente del cliente'}
                          {contract.status === 'draft' && 'Borrador'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-gray-600 text-xs">Precio</p>
                          <p className="text-green-600">${contract.terms.price}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Duración</p>
                          <p>{contract.terms.duration}h</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Ubicación</p>
                          <p className="text-xs">{contract.terms.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs mb-3">
                        {contract.clientSignature && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Cliente firmó
                          </Badge>
                        )}
                        {contract.artistSignature && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Tú firmaste
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowContractDialog(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Contrato
                        </Button>
                        {!contract.artistSignature && contract.clientSignature && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowContractDialog(true);
                            }}
                          >
                            Firmar Ahora
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mis Servicios</CardTitle>
              <Button onClick={handleAddService}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Servicio
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm pt-3 border-t">
                      <span className="text-green-600">${service.price}</span>
                      <span className="text-gray-600">{service.duration} horas</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Modifica la información de tu servicio' : 'Agrega un nuevo servicio a tu portafolio'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceName">Nombre del Servicio</Label>
              <Input
                id="serviceName"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="ej., Presentación para Boda"
              />
            </div>

            <div>
              <Label htmlFor="serviceDesc">Descripción</Label>
              <Textarea
                id="serviceDesc"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Describe tu servicio..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="servicePrice">Precio ($)</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="serviceDuration">Duración (horas)</Label>
                <Select 
                  value={serviceForm.duration} 
                  onValueChange={(value) => setServiceForm({ ...serviceForm, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} {hours === 1 ? 'hora' : 'horas'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowServiceDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveService}
                className="flex-1"
                disabled={!serviceForm.name || !serviceForm.price}
              >
                Guardar Servicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Dialog */}
      <ContractView
        contract={selectedContract}
        open={showContractDialog}
        onClose={() => {
          setShowContractDialog(false);
          setSelectedContract(null);
        }}
        userType="artist"
        onSign={(signedContract) => {
          if (onContractUpdate) {
            onContractUpdate(signedContract);
          }
          setShowContractDialog(false);
          setSelectedContract(null);
        }}
      />
    </div>
  );
}
