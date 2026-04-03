import {
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  MessageCircle,
  Home,
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
  onViewBookings: () => void;
  onReturnHome: () => void;
  onDownloadContract?: () => void;
  onContactProvider?: () => void;
  canDownloadContract?: boolean;
  canContactProvider?: boolean;
}

export function BookingConfirmation({
  bookingDetails,
  onViewBookings,
  onReturnHome,
  onDownloadContract,
  onContactProvider,
  canDownloadContract = false,
  canContactProvider = false,
}: BookingConfirmationProps) {
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
          <div className="text-center space-y-2">
            <p className="text-base text-[#0A1F44] font-semibold">
              Tu reserva con {bookingDetails.artistName || bookingDetails.serviceName || 'tu proveedor'} ya fue enviada.
            </p>
            <p className="text-sm text-gray-600">
              Ya puedes descargar el contrato o escribirle al proveedor para coordinar los detalles.
            </p>
          </div>

          <div className="bg-amber-50 border border-[#D4AF37]/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#0A1F44] font-semibold">
              <Clock className="w-4 h-4" />
              <span>Esperando confirmación del proveedor</span>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-bold">1.</span>
                <span>El proveedor revisará tu solicitud y el contrato firmado.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-bold">2.</span>
                <span>Recibirás una notificación cuando confirme la reserva.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37] font-bold">3.</span>
                <span>Puedes dar seguimiento desde "Mis Reservas" o contactarlo ahora mismo.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {onContactProvider && (
              <Button
                onClick={onContactProvider}
                title={canContactProvider ? 'Contactar proveedor' : 'Intentar contactar proveedor'}
                className="sm:col-span-2 bg-[#D4AF37] hover:bg-[#c9a632] text-[#0A1F44] h-12 text-base font-bold shadow-lg border border-[#D4AF37]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar Proveedor
              </Button>
            )}

            <Button
              onClick={onViewBookings}
              variant="outline"
              className="border-2 border-[#0A1F44] bg-white text-[#0A1F44] hover:bg-[#0A1F44]/5 h-12 text-base font-semibold"
            >
              Ver Mis Reservas
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={onReturnHome}
              variant="outline"
              className="border-2 border-[#0A1F44] bg-white text-[#0A1F44] hover:bg-[#0A1F44]/5 h-12 text-base font-semibold"
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Button>

            {onDownloadContract && (
              <Button
                onClick={onDownloadContract}
                variant="outline"
                disabled={!canDownloadContract}
                className="sm:col-span-2 border-[#D4AF37] text-[#0A1F44] hover:bg-amber-50 h-12 text-base font-semibold"
              >
                <FileText className="w-5 h-5 mr-2" />
                Descargar Contrato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
