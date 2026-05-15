import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Loader2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

export interface BookingConfirmationDetails {
  artistName: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  totalPrice: number;
  planName?: string;
  providerEmail?: string;
  providerPhone?: string;
}

interface BookingConfirmationProps {
  bookingDetails: BookingConfirmationDetails;
  onContactProvider?: () => void;
  canContactProvider?: boolean;
}

export function BookingConfirmation({
  bookingDetails,
  onContactProvider,
  canContactProvider = false,
}: BookingConfirmationProps) {
  const [showProcessingAnimation, setShowProcessingAnimation] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowProcessingAnimation(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (showProcessingAnimation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FEFDFB] to-[#EDEBF5] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl shadow-2xl border-2 border-[#D4AF37]/20 overflow-hidden">
          <CardHeader className="text-center pb-6 bg-gradient-to-br from-[#0A1F44] to-[#0A1F44]/90 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <div className="relative bg-[#D4AF37] rounded-full p-4 shadow-lg">
                <Loader2 className="w-10 h-10 text-[#0A1F44] animate-spin" />
                <Sparkles className="w-4 h-4 text-[#0A1F44] absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Procesando tu reserva</CardTitle>
            <CardDescription className="text-[#D4AF37]/90 text-base">
              Estamos enviando tu solicitud y preparando los detalles finales...
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-6">
            <div className="h-2 w-full bg-[#D4AF37]/20 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-[#D4AF37] rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FEFDFB] to-[#EDEBF5] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl shadow-2xl border-2 border-[#D4AF37]/20">
        <CardHeader className="text-center pb-4 bg-gradient-to-br from-[#0A1F44] to-[#0A1F44]/90 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="bg-[#D4AF37] rounded-full p-4 shadow-lg">
              <CheckCircle className="w-16 h-16 text-[#0A1F44]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            ¡Reserva Solicitada con Éxito!
          </CardTitle>
          <CardDescription className="text-[#D4AF37]/90 text-lg">
            Tu solicitud ha sido enviada al proveedor
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="text-center space-y-3">
            <p className="text-base text-[#0A1F44] font-semibold">
              Tu reserva con {bookingDetails.artistName || bookingDetails.serviceName || 'tu proveedor'} ya fue enviada.
            </p>
            <p className="text-sm text-gray-600">
              Contacta a tu proveedor para coordinar los detalles de la reserva.
            </p>
          </div>

          <div className="pt-2">
            {onContactProvider && (
              <Button
                onClick={onContactProvider}
                title={canContactProvider ? 'Contactar proveedor' : 'Intentar contactar proveedor'}
                className="w-full bg-[#D4AF37] hover:bg-[#c9a632] text-[#0A1F44] h-12 text-base font-bold shadow-lg border border-[#D4AF37]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar Proveedor
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
