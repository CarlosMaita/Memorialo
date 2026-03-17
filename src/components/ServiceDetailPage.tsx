import { useState } from 'react';
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
  ArrowLeft,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Artist, ServicePlan, Review } from '../types';
import { SEOHead, buildServiceStructuredData } from './SEOHead';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner@2.0.3';

interface ServiceDetailPageProps {
  artist: Artist;
  reviews: Review[];
  isAuthenticated: boolean;
  onBack: () => void;
  onBookNow: (artist: Artist, plan?: ServicePlan) => void;
}

export function ServiceDetailPage({
  artist,
  reviews,
  isAuthenticated,
  onBack,
  onBookNow,
}: ServiceDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  const artistReviews = reviews.filter((r) => r.artistId === artist.id);
  const allImages = [artist.image, ...artist.portfolio];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const minPrice = artist.servicePlans?.length
    ? Math.min(...artist.servicePlans.map((p) => p.price))
    : artist.pricePerHour;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: artistReviews.filter((r) => r.rating === star).length,
    pct:
      artistReviews.length > 0
        ? (artistReviews.filter((r) => r.rating === star).length /
            artistReviews.length) *
          100
        : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO meta tags for this service */}
      <SEOHead
        title={`${artist.name} - ${artist.subcategory || artist.category} en ${artist.location}`}
        description={artist.bio?.slice(0, 160) || `Contrata a ${artist.name}, servicio profesional de ${artist.subcategory || artist.category} en ${artist.location}. Desde $${artist.pricePerHour}/hr.`}
        canonical={`/servicio/${artist.id}`}
        ogImage={artist.image}
        ogType="product"
        keywords={`${artist.category}, ${artist.subcategory || ''}, ${artist.location}, eventos, ${artist.specialties?.join(', ') || ''}`}
        structuredData={buildServiceStructuredData(artist)}
      />
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Volver a resultados</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-gray-600">
              <Share2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={liked ? 'text-red-500' : 'text-gray-600'}
            >
              <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-red-500' : ''}`} />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Image gallery */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        {artist.portfolio.length > 0 ? (
          <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-xl overflow-hidden h-[300px] md:h-[420px]">
            {/* Main image */}
            <div
              className="md:col-span-2 md:row-span-2 relative cursor-pointer group"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
            >
              <ImageWithFallback
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            {/* Secondary images */}
            {artist.portfolio.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer group hidden md:block"
                onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }}
              >
                <ImageWithFallback
                  src={img}
                  alt={`Trabajo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {i === 3 && artist.portfolio.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      +{artist.portfolio.length - 4} fotos
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Mobile: show all photos button */}
            <button
              className="md:hidden absolute bottom-4 right-4 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-md border border-gray-200 cursor-pointer z-10"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
            >
              Ver {allImages.length} fotos
            </button>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden h-[300px] md:h-[420px]">
            <ImageWithFallback
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & badges */}
            <div>
              <div className="flex items-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {artist.name}
                </h1>
                {artist.verified && (
                  <div
                    className="p-1 rounded-full mt-1"
                    style={{
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--navy-blue)' }} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-gray-600">
                <Badge variant="secondary" className="text-sm">
                  {artist.subcategory || artist.category}
                </Badge>
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  {artist.location}
                </span>
              </div>

              {/* Rating summary */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
                  <span className="text-lg font-semibold">{artist.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500">
                  {artistReviews.length} reseña{artistReviews.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">
                  {artist.bookingsCompleted} servicios completados
                </span>
              </div>
            </div>

            <Separator />

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Award className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--gold)' }} />
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-lg font-semibold">{artist.bookingsCompleted}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--gold)' }} />
                <p className="text-sm text-gray-500">Respuesta</p>
                <p className="text-lg font-semibold">{artist.responseTime}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Calendar className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--gold)' }} />
                <p className="text-sm text-gray-500">Disponibilidad</p>
                <p className="text-sm font-medium">{artist.availability.slice(0, 2).join(', ')}</p>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Acerca de</h2>
              <p className="text-gray-700 leading-relaxed">{artist.bio}</p>
            </div>

            {/* Specialties */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {artist.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="bg-white px-3 py-1 text-sm">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Disponibilidad</h2>
              <div className="flex flex-wrap gap-2">
                {artist.availability.map((day, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1.5">
                    <Calendar className="w-3 h-3 mr-1" />
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Service Plans */}
            {artist.servicePlans && artist.servicePlans.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Planes y Servicios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {artist.servicePlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden ${plan.popular ? 'border-2 ring-1 ring-primary/20' : ''}`}
                      style={plan.popular ? { borderColor: 'var(--gold)' } : undefined}
                    >
                      {plan.popular && (
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: 'linear-gradient(90deg, var(--gold), var(--copper))' }}
                        />
                      )}
                      <div className="p-5">
                        {plan.popular && (
                          <Badge
                            className="mb-3 text-xs"
                            style={{
                              background: 'linear-gradient(135deg, var(--gold), var(--copper))',
                              color: 'var(--navy-blue)',
                            }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Más Popular
                          </Badge>
                        )}
                        <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                            ${plan.price}
                          </span>
                          <span className="text-sm text-gray-500">/ {plan.duration}h</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                        <ul className="space-y-2 mb-5">
                          {plan.includes.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={plan.popular ? 'default' : 'outline'}
                          onClick={() => onBookNow(artist, plan)}
                        >
                          {isAuthenticated ? 'Seleccionar Plan' : 'Iniciar Sesión para Reservar'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {artist.servicePlans && artist.servicePlans.length > 0 && <Separator />}

            {/* Portfolio gallery */}
            {artist.portfolio.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Galería de Trabajos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {artist.portfolio.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => { setLightboxIndex(index + 1); setLightboxOpen(true); }}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`Trabajo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {artist.portfolio.length > 0 && <Separator />}

            {/* Reviews */}
            <div id="reviews">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reseñas de Clientes
                </h2>
              </div>

              {artistReviews.length > 0 ? (
                <>
                  {/* Rating breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold" style={{ color: 'var(--navy-blue)' }}>
                          {artist.rating.toFixed(1)}
                        </div>
                        <div className="flex gap-0.5 mt-1 justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(artist.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {artistReviews.length} reseña{artistReviews.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ratingDistribution.map(({ star, count, pct }) => (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-gray-600">{star}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 rounded-full h-2 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-gray-500">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review list */}
                  <div className="space-y-4">
                    {artistReviews.map((review) => (
                      <div key={review.id} className="bg-white border rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback
                              className="text-white text-sm"
                              style={{ backgroundColor: 'var(--navy-blue)' }}
                            >
                              {getInitials(review.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{review.userName}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-white rounded-xl border">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Aún no hay reseñas para este servicio</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Sticky booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="p-6 shadow-lg border-gray-200">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-gray-500">Desde</span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                    ${minPrice}
                  </span>
                  <span className="text-gray-500">/hr</span>
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                  <Star className="w-4 h-4" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
                  <span className="font-medium">{artist.rating.toFixed(1)}</span>
                  <span>· {artistReviews.length} reseñas</span>
                </div>

                <Separator className="mb-4" />

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Responde en {artist.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{artist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span>{artist.bookingsCompleted} servicios completados</span>
                  </div>
                  {artist.verified && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Proveedor verificado</span>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full mb-3 font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold), var(--copper))',
                    color: 'var(--navy-blue)',
                  }}
                  onClick={() => onBookNow(artist)}
                >
                  {isAuthenticated ? 'Reservar Ahora' : 'Iniciar Sesión para Reservar'}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  No se realizará ningún cobro en este momento
                </p>
              </Card>

              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  Los planes personalizados están disponibles. El proveedor responderá en{' '}
                  {artist.responseTime}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm text-gray-500">Desde</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold" style={{ color: 'var(--gold)' }}>
                ${minPrice}
              </span>
              <span className="text-sm text-gray-500">/hr</span>
            </div>
          </div>
          <Button
            size="lg"
            className="font-semibold px-8"
            style={{
              background: 'linear-gradient(135deg, var(--gold), var(--copper))',
              color: 'var(--navy-blue)',
            }}
            onClick={() => onBookNow(artist)}
          >
            {isAuthenticated ? 'Reservar' : 'Iniciar Sesión'}
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer border-none z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer border-none z-10"
            onClick={() =>
              setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
            }
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] mx-16">
            <ImageWithFallback
              src={allImages[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer border-none z-10"
            onClick={() =>
              setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
            }
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile sticky bar */}
      <div className="lg:hidden h-20" />
    </div>
  );
}