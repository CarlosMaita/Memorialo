import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Calendar, DollarSign, Clock, MapPin, User, MessageCircle, Mail } from 'lucide-react';
import { Contract } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { ConfirmDialog } from './ConfirmDialog';

interface ContractViewProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
  userType: 'client' | 'artist';
  onSign?: (contract: Contract) => void;
  onReject?: (contract: Contract) => void;
}

export function ContractView({ contract, open, onClose, userType, onSign, onReject }: ContractViewProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (!contract) return null;

  const canSign = userType === 'client' 
    ? !contract.clientSignature 
    : !contract.artistSignature;

  const otherPartyHasSigned = userType === 'client'
    ? !!contract.artistSignature
    : !!contract.clientSignature;

  const bothPartiesSigned = contract.clientSignature && contract.artistSignature;

  const handleSign = () => {
    if (!agreedToTerms) {
      toast.error('Debes aceptar los términos y condiciones para firmar');
      return;
    }

    setSigning(true);
    
    // Simulate signing delay
    setTimeout(() => {
      const signature: { signedBy: string; signedAt: string } = {
        signedBy: userType === 'client' ? contract.clientName : contract.artistName,
        signedAt: new Date().toISOString()
      };

      const updatedContract = {
        ...contract,
        ...(userType === 'client' 
          ? { clientSignature: signature }
          : { artistSignature: signature }
        ),
        status: (userType === 'client' && contract.artistSignature) || (userType === 'artist' && contract.clientSignature)
          ? 'active' as const
          : (userType === 'client' ? 'pending_artist' as const : 'pending_client' as const)
      };

      if (onSign) {
        onSign(updatedContract);
      }

      toast.success('¡Contrato firmado exitosamente!');
      setSigning(false);
      setAgreedToTerms(false);
      
      if (updatedContract.status === 'active') {
        toast.success('🎉 ¡El contrato está completamente firmado por ambas partes!');
      }
      
      // Cerrar el modal después de firmar
      setTimeout(() => {
        onClose();
      }, 500);
    }, 1500);
  };

  const handleRejectClick = () => {
    setShowRejectConfirm(true);
  };

  const handleRejectConfirmed = () => {
    setRejecting(true);
    
    setTimeout(() => {
      const rejectedContract = {
        ...contract,
        status: 'cancelled' as const
      };

      if (onReject) {
        onReject(rejectedContract);
      }

      toast.error('Contrato rechazado');
      setRejecting(false);
      onClose();
    }, 1000);
  };

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'active':
        return <Badge className="bg-green-600">Firmado por ambas partes</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">Completado</Badge>;
      case 'pending_client':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Pendiente de firma del cliente</Badge>;
      case 'pending_artist':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Pendiente de firma del proveedor</Badge>;
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrato de Servicios
              </DialogTitle>
              <DialogDescription>
                Contrato ID: {contract.id}
              </DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Partes del Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">Proveedor de Servicios</p>
                  </div>
                  <p>{contract.artistName}</p>
                  {contract.artistSignature && (
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Firmado el {new Date(contract.artistSignature.signedAt).toLocaleDateString('es-ES')}
                    </div>
                  )}
                  {/* Mostrar contacto solo si contrato está activo y el usuario es el cliente */}
                  {bothPartiesSigned && userType === 'client' && contract.artistWhatsapp && (
                    <div className="mt-2 space-y-1">
                      <a 
                        href={`https://wa.me/${contract.artistWhatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Contactar por WhatsApp
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">Cliente</p>
                  </div>
                  <p>{contract.clientName}</p>
                  {contract.clientSignature && (
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Firmado el {new Date(contract.clientSignature.signedAt).toLocaleDateString('es-ES')}
                    </div>
                  )}
                  {/* Mostrar contacto solo si contrato está activo y el usuario es el proveedor */}
                  {bothPartiesSigned && userType === 'artist' && (
                    <div className="mt-2 space-y-1">
                      {contract.clientWhatsapp && (
                        <a 
                          href={`https://wa.me/${contract.clientWhatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Contactar por WhatsApp
                        </a>
                      )}
                      {contract.clientEmail && (
                        <a 
                          href={`mailto:${contract.clientEmail}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {contract.clientEmail}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Descripción del Servicio</p>
                <p>{contract.terms.serviceDescription}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Fecha</p>
                  </div>
                  <p className="text-sm">{new Date(contract.terms.date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">{contract.terms.startTime ? 'Hora y Duración' : 'Duración'}</p>
                  </div>
                  <p className="text-sm">
                    {contract.terms.startTime && `${contract.terms.startTime} • `}
                    {contract.terms.duration} {contract.terms.duration === 1 ? 'hora' : 'horas'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Precio Total</p>
                  </div>
                  <p className="text-sm text-green-600">${contract.terms.price}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Ubicación</p>
                  </div>
                  <p className="text-sm">{contract.terms.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Términos y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm mb-2">1. Términos de Pago</h4>
                <p className="text-sm text-gray-700">{contract.terms.paymentTerms}</p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm mb-2">2. Política de Cancelación</h4>
                <p className="text-sm text-gray-700">{contract.terms.cancellationPolicy}</p>
              </div>

              {contract.terms.additionalTerms.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm mb-2">3. Términos Adicionales</h4>
                    <ul className="space-y-2">
                      {contract.terms.additionalTerms.map((term, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">
                      <strong>Importante:</strong> Al firmar este contrato, ambas partes aceptan cumplir con todos los términos 
                      y condiciones descritos. Este contrato es legalmente vinculante y establece las responsabilidades 
                      de cada parte.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Section - Solo mostrar si el contrato no está completado, confirmado o cancelado */}
          {!bothPartiesSigned && canSign && contract.status !== 'completed' && contract.status !== 'active' && contract.status !== 'cancelled' && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Firma del Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {otherPartyHasSigned && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <p className="text-sm">
                        La otra parte ya ha firmado el contrato. Revisa los términos y firma para completar el acuerdo.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    He leído y acepto todos los términos y condiciones de este contrato. Entiendo que al firmar 
                    este documento, estoy estableciendo un acuerdo legalmente vinculante.
                  </Label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSign}
                    disabled={!agreedToTerms || signing || rejecting}
                    className="flex-1"
                  >
                    {signing ? 'Firmando...' : 'Firmar Contrato'}
                  </Button>
                  {/* Solo el proveedor puede rechazar el contrato */}
                  {userType === 'artist' && (
                    <Button 
                      variant="outline" 
                      onClick={handleRejectClick}
                      disabled={signing || rejecting}
                      className="flex-1 sm:flex-initial border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {rejecting ? 'Rechazando...' : 'Rechazar'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={signing || rejecting}
                  >
                    Revisar Después
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bothPartiesSigned && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <p>
                      <strong>Contrato Completamente Firmado</strong>
                    </p>
                    <p className="text-sm">
                      Este contrato ha sido firmado por ambas partes y es legalmente vinculante.
                    </p>
                    <p className="text-sm mt-2">
                      {userType === 'client' && contract.artistWhatsapp && (
                        <>Ahora puedes contactar al proveedor usando la información de contacto mostrada arriba.</>
                      )}
                      {userType === 'artist' && (contract.clientWhatsapp || contract.clientEmail) && (
                        <>Ahora puedes contactar al cliente usando la información de contacto mostrada arriba.</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={showRejectConfirm}
        onOpenChange={setShowRejectConfirm}
        onConfirm={handleRejectConfirmed}
        title="¿Rechazar este contrato?"
        description="¿Estás seguro de que deseas rechazar este contrato? Esta acción no se puede deshacer y el contrato será cancelado permanentemente."
        confirmText="Sí, rechazar"
        cancelText="No, volver"
        variant="danger"
      />
    </Dialog>
  );
}
