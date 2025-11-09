import { Star, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Artist } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (artist: Artist) => void;
  onCompare?: (artist: Artist) => void;
  isComparing?: boolean;
}

export function ArtistCard({ artist, onViewProfile, onCompare, isComparing }: ArtistCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative h-48 overflow-hidden" onClick={() => onViewProfile(artist)}>
        <ImageWithFallback 
          src={artist.image} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {artist.verified && (
          <div className="absolute top-2 right-2 p-1 rounded-full" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--navy-blue)' }} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary">{artist.category}</Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1" onClick={() => onViewProfile(artist)}>
            <h3 className="line-clamp-1">{artist.name}</h3>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="w-3 h-3" />
              <span className="text-sm">{artist.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3" onClick={() => onViewProfile(artist)}>
          <Star className="w-4 h-4" style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
          <span>{artist.rating.toFixed(1)}</span>
          <span className="text-gray-500 text-sm">({artist.reviews} reseñas)</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3" onClick={() => onViewProfile(artist)}>
          <Clock className="w-3 h-3" />
          <span>Responde en {artist.responseTime}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="text-gray-600 text-sm">Desde</span>
            <p style={{ color: 'var(--gold)' }}>${artist.pricePerHour}/hr</p>
          </div>
          <div className="flex gap-2">
            {onCompare && (
              <Button 
                variant={isComparing ? "secondary" : "outline"} 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare(artist);
                }}
              >
                {isComparing ? 'Agregado' : 'Comparar'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => onViewProfile(artist)}>
              Ver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
