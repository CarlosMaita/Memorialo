import { CheckCircle2, Clock3, MapPin, Star, Tag, Wallet } from 'lucide-react';
import { Artist } from '../types';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (artist: Artist) => void;
}

export function ArtistCard({ artist, onViewProfile }: ArtistCardProps) {
  const cheapestPlanPrice = artist.servicePlans?.length
    ? Math.min(...artist.servicePlans.map((plan) => plan.price))
    : artist.pricePerHour;

  const category = artist.subcategory || artist.category || 'Sin categoria';
  const city = artist.location || (artist as any).city || 'Sin ciudad';
  const completedServices = (artist as any).bookingsCompleted || (artist as any).servicesCompleted || 0;
  const responseTime = artist.responseTime || 'No disponible';

  return (
    <Card className="relative overflow-hidden cursor-pointer group rounded-3xl border border-transparent bg-transparent p-2 shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-white/35 hover:bg-slate-900/5 hover:shadow-[0_18px_36px_-20px_rgba(15,23,42,0.7)]" onClick={() => onViewProfile(artist)}>
      <div className="relative aspect-video overflow-hidden rounded-2xl" onClick={() => onViewProfile(artist)}>
        <ImageWithFallback 
          src={artist.image} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/75 text-white px-2 py-1 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
          <span className="text-xs font-semibold leading-none">{artist.rating.toFixed(1)}</span>
          <span className="text-[11px] text-white/85 leading-none">({artist.reviews})</span>
        </div>

        <div className="pointer-events-none absolute left-3 right-3 bottom-3 rounded-lg border border-white/20 bg-black/65 px-3 py-2 text-white backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
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
      
      <CardContent className="px-2 pt-1 pb-2 transition-colors duration-300 group-hover:text-[#0A1F44]">
        <div className="min-h-[3.25rem] mb-1.5" onClick={() => onViewProfile(artist)}>
          <h3 className="line-clamp-2 leading-snug font-medium">{artist.name}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
