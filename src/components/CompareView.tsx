import { X, Star, MapPin, Clock, Award, CheckCircle } from 'lucide-react';
import { Artist } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CompareViewProps {
  artists: Artist[];
  open: boolean;
  onClose: () => void;
  onRemove: (artistId: string) => void;
  onBook: (artist: Artist) => void;
}

export function CompareView({ artists, open, onClose, onRemove, onBook }: CompareViewProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Artists ({artists.length}/3)</DialogTitle>
        </DialogHeader>

        {artists.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No artists selected for comparison</p>
            <p className="text-sm mt-2">Select up to 3 artists to compare</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <div key={artist.id} className="border rounded-lg overflow-hidden relative">
                {/* Remove button */}
                <button
                  onClick={() => onRemove(artist.id)}
                  className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image */}
                <div className="relative h-40">
                  <ImageWithFallback 
                    src={artist.image} 
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                  {artist.verified && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white p-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm mb-1">{artist.name}</h3>
                    <Badge variant="secondary" className="text-xs">{artist.category}</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <span>{artist.rating.toFixed(1)} ({artist.reviews})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 line-clamp-1">{artist.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{artist.responseTime}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{artist.bookingsCompleted} completed</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-600">Starting price</p>
                    <p className="text-green-600">${artist.pricePerHour}/hr</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {artist.specialties.slice(0, 3).map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {artist.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{artist.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      onBook(artist);
                      onClose();
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
