import { Star, MapPin, CheckCircle, Clock, Calendar, Award, Check, Sparkles } from 'lucide-react';
import { Artist, ServicePlan } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtistProfileProps {
  artist: Artist | null;
  open: boolean;
  onClose: () => void;
  onBookNow: (artist: Artist, plan?: ServicePlan) => void;
}

export function ArtistProfile({ artist, open, onClose, onBookNow }: ArtistProfileProps) {
  if (!artist) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{artist.name} Profile</DialogTitle>
        </DialogHeader>

        {/* Hero Section */}
        <div className="relative h-64 -mx-6 -mt-6 mb-6">
          <ImageWithFallback 
            src={artist.image} 
            alt={artist.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <h2>{artist.name}</h2>
              {artist.verified && (
                <CheckCircle className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{artist.category}</Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{artist.rating.toFixed(1)} ({artist.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Completed</p>
            <p>{artist.bookingsCompleted}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Response</p>
            <p>{artist.responseTime}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-sm">{artist.location}</p>
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div className="space-y-2">
          <h3>About</h3>
          <p className="text-gray-700">{artist.bio}</p>
        </div>

        <Separator />

        {/* Specialties */}
        <div className="space-y-2">
          <h3>Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {artist.specialties.map((specialty, index) => (
              <Badge key={index} variant="outline">{specialty}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div className="space-y-2">
          <h3>Availability</h3>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{artist.availability.join(', ')}</span>
          </div>
        </div>

        {/* Service Plans / Packages */}
        {artist.servicePlans && artist.servicePlans.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3>Planes y Servicios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artist.servicePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.popular ? 'border-primary border-2' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Más Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <h4 className="text-sm mb-1">{plan.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-green-600">${plan.price}</span>
                        <span className="text-sm text-gray-500">/ {plan.duration}h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{plan.description}</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Incluye:</p>
                        <ul className="space-y-1.5">
                          {plan.includes.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => onBookNow(artist, plan)}
                      >
                        Seleccionar Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Portfolio */}
        {artist.portfolio.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3>Portfolio</h3>
              <div className="grid grid-cols-3 gap-3">
                {artist.portfolio.map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <ImageWithFallback 
                      src={image} 
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* General Pricing Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Precio base:</strong> ${artist.pricePerHour}/hora
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Los planes personalizados están disponibles. El artista responderá en {artist.responseTime}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
