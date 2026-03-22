import { Star } from 'lucide-react';
import { Artist } from '../types';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (artist: Artist) => void;
}

export function ArtistCard({ artist, onViewProfile }: ArtistCardProps) {
  return (
    <Card className="overflow-hidden cursor-pointer group border-0 bg-transparent shadow-none">
      <div className="relative aspect-video overflow-hidden rounded-xl" onClick={() => onViewProfile(artist)}>
        <ImageWithFallback 
          src={artist.image} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-black/75 text-white px-2 py-1 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
          <span className="text-xs font-semibold leading-none">{artist.rating.toFixed(1)}</span>
          <span className="text-[11px] text-white/85 leading-none">({artist.reviews})</span>
        </div>
      </div>
      
      <CardContent className="px-1 pt-0.5 pb-1">
        <div className="min-h-[3.25rem] mb-1.5" onClick={() => onViewProfile(artist)}>
          <h3 className="line-clamp-2 leading-snug font-medium">{artist.name}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
