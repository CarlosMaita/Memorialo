import {
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  Check,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Artist, ServicePlan, Review } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface ArtistProfileProps {
  artist: Artist | null;
  open: boolean;
  onClose: () => void;
  onBookNow: (artist: Artist, plan?: ServicePlan) => void;
  reviews?: Review[];
  isAuthenticated?: boolean;
}

export function ArtistProfile({
  artist,
  open,
  onClose,
  onBookNow,
  reviews = [],
  isAuthenticated = false,
}: ArtistProfileProps) {
  if (!artist) return null;

  const artistReviews = reviews.filter(
    (r) => r.artistId === artist.id,
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {artist.name} Profile
          </DialogTitle>
          <DialogDescription className="sr-only">
            Perfil completo de {artist.name}, incluyendo
            servicios, planes, portafolio y reseñas
          </DialogDescription>
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
              <Badge variant="secondary">
                {artist.category}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>
                  {artist.rating.toFixed(1)} ({artist.reviews}{" "}
                  reseñas)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Completados</p>
            <p>{artist.bookingsCompleted}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Respuesta</p>
            <p>{artist.responseTime}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-sm text-gray-600">Ubicación</p>
            <p className="text-sm">{artist.location}</p>
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div className="space-y-2">
          <h3>Acerca de</h3>
          <p className="text-gray-700">{artist.bio}</p>
        </div>

        <Separator />

        {/* Specialties */}
        <div className="space-y-2">
          <h3>Especialidades</h3>
          <div className="flex flex-wrap gap-2">
            {artist.specialties.map((specialty, index) => (
              <Badge key={index} variant="outline" className="bg-white">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div className="space-y-2">
          <h3>Disponibilidad</h3>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {artist.availability.join(", ")}
            </span>
          </div>
        </div>

        {/* Service Plans / Packages */}
        {artist.servicePlans &&
          artist.servicePlans.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3>Planes y Servicios</h3>
                <div className="space-y-4">
                  {artist.servicePlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative ${plan.popular ? "border-primary border-2" : ""}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-primary">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Más Popular
                          </Badge>
                        </div>
                      )}

                      <div className="flex flex-col gap-4 p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="mb-1">
                                {plan.name}
                              </h4>
                              <div className="flex items-baseline gap-1">
                                <span className="text-green-600">
                                  ${plan.price}
                                </span>
                                <span className="text-sm text-gray-500">
                                  / {plan.duration}h
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600">
                            {plan.description}
                          </p>

                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Incluye:
                            </p>
                            <ul className="space-y-1.5">
                              {plan.includes.map(
                                (item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">
                                      {item}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <Button
                            size="lg"
                            className="w-full"
                            variant={
                              plan.popular
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              onBookNow(artist, plan)
                            }
                          >
                            {isAuthenticated
                              ? "Seleccionar Plan"
                              : "Iniciar Sesión"}
                          </Button>
                        </div>
                      </div>
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
              <h3>Galería de Trabajos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {artist.portfolio.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`Trabajo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Reviews Section */}
        {artistReviews.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Reseñas de Clientes</h3>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span>{artist.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">
                    ({artistReviews.length} reseñas)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {artistReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {getInitials(review.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm">
                            {review.userName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              review.createdAt,
                            ).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {artistReviews.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{artistReviews.length - 5} reseñas más
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* General Pricing Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Precio base:</strong> ${artist.pricePerHour}
            /hora
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Los planes personalizados están disponibles. El
            artista responderá en {artist.responseTime}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}