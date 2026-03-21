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
      </div>
      
      <CardContent className="px-1 pt-3 pb-2">
        <div className="mb-2" onClick={() => onViewProfile(artist)}>
          <h3 className="line-clamp-2 leading-snug">{artist.name}</h3>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-700" onClick={() => onViewProfile(artist)}>
          <Star className="w-4 h-4" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
          <span>{artist.rating.toFixed(1)}</span>
          <span className="text-gray-500">({artist.reviews} reseñas)</span>
        </div>
      </CardContent>
    </Card>
  );
}
