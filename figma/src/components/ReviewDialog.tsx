import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Star } from 'lucide-react';
import { Review, Booking, User } from '../types';
import { toast } from 'sonner@2.0.3';

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  user: User;
  onReviewSubmit: (review: Review) => void;
}

export function ReviewDialog({ open, onClose, booking, user, onReviewSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  }, [open]);

  if (!booking) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('El comentario debe tener al menos 10 caracteres');
      return;
    }

    const newReview: Review = {
      id: 'review-' + Date.now(),
      contractId: booking.contractId || booking.id, // Usar contractId si existe, sino usar bookingId
      bookingId: booking.id,
      artistId: booking.artistId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    onReviewSubmit(newReview);
    onClose(); // Cerrar el diálogo después de enviar
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deja una Reseña</DialogTitle>
          <DialogDescription>
            Comparte tu experiencia para ayudar a otros clientes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Evento</p>
            <p className="mb-1">{booking.eventType}</p>
            <p className="text-sm text-gray-500">
              {new Date(booking.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Calificación *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Tu Reseña *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia con el proveedor. ¿Qué te gustó? ¿Qué podría mejorar?"
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Mínimo 10 caracteres ({comment.length}/10)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Publicar Reseña
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
