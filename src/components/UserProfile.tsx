import { useState } from 'react';
import { User, Booking, Contract, Review } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Calendar, FileText, Star, User as UserIcon, Mail, Phone, MessageSquare } from 'lucide-react';

interface UserProfileProps {
  user: User;
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
  contracts: Contract[];
  reviews: Review[];
}

export function UserProfile({ user, open, onClose, bookings, contracts, reviews }: UserProfileProps) {
  // Don't render if no user
  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'signed': 'bg-green-600',
      'pending_client': 'border-orange-500 text-orange-700',
      'pending_artist': 'border-orange-500 text-orange-700'
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'signed': 'Firmado',
      'pending_client': 'Pendiente de tu firma',
      'pending_artist': 'Pendiente del proveedor'
    };

    return statusTexts[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Mi Perfil</DialogTitle>
          <DialogDescription className="sr-only">
            Tu perfil de usuario, reservas, contratos y reseñas
          </DialogDescription>
        </DialogHeader>

        {/* User Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
            <AvatarFallback className="text-xl sm:text-2xl bg-primary text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="mb-1 text-lg sm:text-xl">{user.name}</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="break-all">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-center sm:text-right hidden sm:block">
            <p className="text-sm text-gray-600">Miembro desde</p>
            <p className="text-sm">{new Date(user.createdAt).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long' 
            })}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
              <p className="text-xs sm:text-sm text-gray-600">Reservas</p>
              <p className="text-sm sm:text-base">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-green-500" />
              <p className="text-xs sm:text-sm text-gray-600">Contratos</p>
              <p className="text-sm sm:text-base">{contracts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-purple-500" />
              <p className="text-xs sm:text-sm text-gray-600">Reseñas</p>
              <p className="text-sm sm:text-base">{reviews.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings" className="text-xs sm:text-sm">Mis Reservas</TabsTrigger>
            <TabsTrigger value="contracts" className="text-xs sm:text-sm">Mis Contratos</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm">Mis Reseñas</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tienes reservas aún</p>
                <p className="text-sm mt-1">Explora artistas y haz tu primera reserva</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm mb-1">{booking.eventType}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{booking.location}</p>
                      </div>
                      <Badge className={getStatusBadge(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{new Date(booking.date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div>
                        <span className="text-green-600">${booking.totalPrice}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tienes contratos aún</p>
                <p className="text-sm mt-1">Los contratos aparecerán después de hacer una reserva</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm mb-1">Contrato con {contract.artistName}</h4>
                        <p className="text-xs text-gray-600">
                          {new Date(contract.terms.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge 
                        className={getStatusBadge(contract.status)}
                        variant={contract.status.includes('pending') ? 'outline' : 'default'}
                      >
                        {getStatusText(contract.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-green-600">${contract.terms.price}</span>
                      <span className="text-gray-600">{contract.terms.duration}h</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No has dejado reseñas aún</p>
                <p className="text-sm mt-1">Después de completar una reserva, podrás dejar una reseña</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {review.artistName && (
                      <p className="text-xs sm:text-sm mb-1">
                        <span className="text-gray-600">Servicio: </span>
                        <span className="text-gray-900">{review.artistName}</span>
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-700">{review.comment}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
