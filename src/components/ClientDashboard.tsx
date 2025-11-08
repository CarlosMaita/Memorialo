import { useState } from 'react';
import { Calendar, Clock, DollarSign, FileText, Star, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Contract, User, Review } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractView } from './ContractView';

interface ClientDashboardProps {
  contracts: Contract[];
  user: User;
  onReviewCreate: (contractId: string) => void;
  reviews: Review[];
}

export function ClientDashboard({ contracts, user, onReviewCreate, reviews }: ClientDashboardProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);

  // Filter contracts where current user is the client
  const userContracts = contracts.filter(c => c.clientId === user.id);
  
  // Debug logging
  console.log('ClientDashboard - User ID:', user.id);
  console.log('ClientDashboard - All contracts:', contracts);
  console.log('ClientDashboard - Filtered user contracts:', userContracts);

  // Categorize contracts
  const pendingContracts = userContracts.filter(c => 
    c.status === 'pending_client' || c.status === 'pending_artist'
  );
  const activeContracts = userContracts.filter(c => c.status === 'active');
  const completedContracts = userContracts.filter(c => c.status === 'completed');
  const cancelledContracts = userContracts.filter(c => c.status === 'cancelled');

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

  const ContractCard = ({ contract }: { contract: Contract }) => {
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="mb-2">Mis Reservas</h2>
        <p className="text-gray-600">Gestiona tus reservas y contratos con artistas</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({userContracts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({pendingContracts.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Confirmadas ({activeContracts.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completadas ({completedContracts.length})
          </TabsTrigger>
        </TabsList>

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
              <ContractCard key={contract.id} contract={contract} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingContracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No hay reservas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingContracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeContracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No hay reservas confirmadas</p>
              </CardContent>
            </Card>
          ) : (
            activeContracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedContracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No hay reservas completadas</p>
              </CardContent>
            </Card>
          ) : (
            completedContracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} />
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
