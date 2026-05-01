import type { MouseEvent } from 'react';
import { CheckCircle2, Clock3, MapPin, Star, Tag, Wallet } from 'lucide-react';
import { Artist } from '../types';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (artist: Artist, anchorElement?: HTMLElement | null) => void;
}

export function ArtistCard({ artist, onViewProfile }: ArtistCardProps) {
  const cheapestPlanPrice = artist.servicePlans?.length
    ? Math.min(...artist.servicePlans.map((plan) => plan.price))
    : artist.pricePerHour;

  const category = artist.subcategory || artist.category || 'Sin categoria';
  const city = artist.location || (artist as any).city || 'Sin ciudad';
  const completedServices = (artist as any).bookingsCompleted || (artist as any).servicesCompleted || 0;
  const responseTime = artist.responseTime || 'No disponible';
  const handleOpenDetail = (event: MouseEvent<HTMLElement>) => {
    onViewProfile(artist, event.currentTarget as HTMLElement);
  };

  return (
    <Card
      data-service-card-id={artist.id}
      className="relative overflow-hidden cursor-pointer group rounded-[8px] border-0 bg-white shadow-[0px_1px_5px_#999] transition-all duration-300 hover:-translate-y-1"
      onClick={handleOpenDetail}
    >
      <div className="relative aspect-[2.15/1] md:aspect-video overflow-hidden">
        <ImageWithFallback 
          src={artist.image} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/75 text-white px-2 py-1 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
          <span className="text-xs font-semibold leading-none">{artist.rating.toFixed(1)}</span>
          <span className="text-[11px] text-white/85 leading-none">({artist.reviews})</span>
        </div>

        <div className="hidden md:block pointer-events-none absolute left-3 right-3 bottom-3 rounded-lg border border-white/20 bg-black/65 px-3 py-2 text-white backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tag className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              <span className="truncate">{category}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              <span className="truncate">{city}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              <span className="truncate">{completedServices} completados</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock3 className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              <span className="truncate">Resp: {responseTime}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1.5 text-xs font-semibold">
            <Wallet className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
            <span>Plan desde ${cheapestPlanPrice}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="px-3 pt-2 pb-3">
        <div className="min-h-0 md:min-h-[2.25rem] mb-0">
          <h3 className="line-clamp-2 leading-snug text-[12px] font-normal">{artist.name}</h3>
        </div>
        <p className="md:hidden mt-1 text-[14px] font-semibold">Planes desde ${cheapestPlanPrice}</p>
      </CardContent>
    </Card>
  );
}
