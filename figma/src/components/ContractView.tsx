import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Calendar, DollarSign, Clock, MapPin, User, MessageCircle, Mail, Handshake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { downloadContractPdf } from '../utils/contractPdf';
import { Agreement } from '../types';

interface ContractSignature {
  signedBy: string;
  signedAt: string;
}

interface ContractRecord {
  id: string;
  createdAt: string;
  status: 'active' | 'completed' | 'pending_client' | 'pending_artist' | 'draft' | 'cancelled' | 'en_negociacion' | 'esperando_pago';
  artistName: string;
  clientName: string;
  artistWhatsapp?: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  specialRequests?: string;
  artistSignature?: ContractSignature;
  clientSignature?: ContractSignature;
  providerSignedAt?: string;
  rejectionReason?: string;
  metadata?: {
    saleType?: 'time' | 'unit';
    unitLabel?: string;
    clientLegalName?: string;
    clientRepresentativeName?: string;
    providerBusinessName?: string;
    providerRepresentative?: {
      type?: 'person' | 'company';
      name?: string;
      documentType?: 'CI' | 'RIF';
      documentNumber?: string;
    };
    providerRepresentativeName?: string;
    providerLegalEntityType?: 'person' | 'company';
    providerIdentificationNumber?: string;
    providerUserId?: string;
  };
  terms: {
    measureType?: 'time' | 'unit';
    measureLabel?: string;
    duration: number;
    startTime?: string;
    date: string;
    price: number | string;
    location: string;
    serviceDescription: string;
    paymentTerms: string;
    cancellationPolicy: string;
    additionalTerms: string[];
    specialRequests?: string;
  };
}

const SPECIAL_REQUEST_PREFIX_REGEX = /^solicitudes?\s+especial(?:es)?\s+del\s+cliente\s*:\s*/i;

const extractSpecialRequest = (contract: ContractRecord) => {
  const explicitSpecialRequest = String(contract.terms.specialRequests || contract.specialRequests || '').trim();
  const filteredAdditionalTerms: string[] = [];
  let parsedSpecialRequest = '';

  contract.terms.additionalTerms.forEach((term) => {
    const trimmed = String(term || '').trim();
    if (!trimmed) {
      return;
    }

    if (SPECIAL_REQUEST_PREFIX_REGEX.test(trimmed)) {
      if (!parsedSpecialRequest) {
        parsedSpecialRequest = trimmed.replace(SPECIAL_REQUEST_PREFIX_REGEX, '').trim();
      }
      return;
    }

    filteredAdditionalTerms.push(trimmed);
  });

  return {
    specialRequest: explicitSpecialRequest || parsedSpecialRequest,
    additionalTermsWithoutSpecialRequest: filteredAdditionalTerms,
  };
};

interface ContractViewProps {
  contract: ContractRecord | null;
  open: boolean;
  onClose: () => void;
  userType: 'client' | 'artist';
  onSign?: (contract: ContractRecord) => void;
  onReject?: (contract: ContractRecord, reason?: string) => void;
  agreements?: Agreement[];
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('es-ES');

const getMeasureType = (contract: ContractRecord): 'time' | 'unit' => {
  if (contract.metadata?.saleType === 'unit' || contract.terms.measureType === 'unit') {
    return 'unit';
  }

  return 'time';
};

const getMeasureLabel = (contract: ContractRecord) => {
  if (getMeasureType(contract) === 'unit') {
    return `${contract.terms.duration} ${String(contract.metadata?.unitLabel || contract.terms.measureLabel || 'unidad(es)')}`;
  }

  return `${contract.terms.duration} ${contract.terms.duration === 1 ? 'hora' : 'horas'}`;
};

const getMeasureTitle = (contract: ContractRecord) => {
  if (getMeasureType(contract) === 'unit') {
    return contract.terms.startTime ? 'Hora y Cantidad' : 'Cantidad';
  }

  return contract.terms.startTime ? 'Hora y Duración' : 'Duración';
};


export function ContractView({ contract, open, onClose, userType, onSign, onReject, agreements = [] }: ContractViewProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!contract) return null;

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      downloadContractPdf(contract, userType);
    } catch (error) {
      console.error('Contract PDF download error:', error);
      toast.error('No se pudo generar el PDF del contrato');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const canSign = userType === 'client'
    ? !contract.clientSignature && contract.status === 'pending_client'
    : !contract.artistSignature;

  const otherPartyHasSigned = userType === 'client'
    ? !!contract.artistSignature
    : !!contract.clientSignature;

  const bothPartiesSigned = Boolean(contract.clientSignature && contract.artistSignature);
  const clientSignedAndWaiting = contract.status === 'esperando_pago';
  const { specialRequest, additionalTermsWithoutSpecialRequest } = extractSpecialRequest(contract);
  const clientLegalName = contract.metadata?.clientLegalName || contract.clientName;
  const providerBusinessName = contract.metadata?.providerBusinessName || contract.artistName;
  const providerRepresentative = contract.metadata?.providerRepresentative || {};
  const providerLegalEntityType = (providerRepresentative.type || contract.metadata?.providerLegalEntityType) === 'company' ? 'company' : 'person';
  const providerIdentificationLabel = String(providerRepresentative.documentType || (providerLegalEntityType === 'company' ? 'RIF' : 'CI')).toUpperCase() === 'RIF' ? 'RIF' : 'CI';
  const providerRepresentativeFieldLabel = providerLegalEntityType === 'company' ? 'Razón social (RIF)' : 'Nombre (CI)';
  const providerIdentificationNumber = String(providerRepresentative.documentNumber || contract.metadata?.providerIdentificationNumber || '').trim();
  const providerRepresentativeName =
    String(providerRepresentative.name || contract.metadata?.providerRepresentativeName || contract.artistSignature?.signedBy || contract.artistName).trim();
  const providerRepresentativeDetail = providerIdentificationNumber && !providerRepresentativeName.includes(providerIdentificationNumber)
    ? `${providerRepresentativeName} (${providerIdentificationLabel}: ${providerIdentificationNumber})`
    : providerRepresentativeName;

  const handleSign = () => {
    if (!agreedToTerms) {
      toast.error('Debes aceptar los términos y condiciones para firmar');
      return;
    }

    setSigning(true);

    setTimeout(() => {
      const signature: ContractSignature = {
        signedBy: userType === 'client' ? clientLegalName : providerRepresentativeDetail,
        signedAt: new Date().toISOString()
      };

      // When client signs a contract already signed by provider → esperando_pago
      // Otherwise keep previous logic
      let newStatus: ContractRecord['status'];
      if (userType === 'client' && contract.artistSignature) {
        newStatus = 'esperando_pago';
      } else if (userType === 'artist' && contract.clientSignature) {
        newStatus = 'active';
      } else if (userType === 'client') {
        newStatus = 'pending_artist';
      } else {
        newStatus = 'pending_client';
      }

      const updatedContract: ContractRecord = {
        ...contract,
        ...(userType === 'client'
          ? { clientSignature: signature }
          : { artistSignature: signature }
        ),
        status: newStatus,
      };

      if (onSign) {
        onSign(updatedContract);
      }

      toast.success('¡Contrato firmado exitosamente!');
      setSigning(false);
      setAgreedToTerms(false);

      if (newStatus === 'esperando_pago') {
        toast.success('🎉 ¡Contrato firmado! Ahora selecciona el método de pago.');
      } else if (newStatus === 'active') {
        toast.success('🎉 ¡El contrato está completamente firmado por ambas partes!');
      }

      setTimeout(() => {
        onClose();
      }, 500);
    }, 1500);
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleRejectConfirmed = () => {
    setRejecting(true);

    setTimeout(() => {
      const rejectedContract: ContractRecord = {
        ...contract,
        status: 'en_negociacion',
        rejectionReason: rejectionReason.trim() || undefined,
      };

      if (onReject) {
        onReject(rejectedContract, rejectionReason.trim() || undefined);
      }

      toast.info('Contrato rechazado. Se volverá a la mesa de negociación.');
      setRejecting(false);
      setRejectionReason('');
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
      case 'en_negociacion':
        return <Badge className="bg-yellow-500 text-white">En negociación</Badge>;
      case 'esperando_pago':
        return <Badge className="bg-green-600">Esperando pago</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrato de Servicios
              </DialogTitle>
              <DialogDescription>
                Contrato ID: {contract.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
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
                  <p>{providerBusinessName}</p>
                  <p className="text-xs text-gray-500">{providerRepresentativeFieldLabel}: {providerRepresentativeDetail}</p>
                  {contract.artistSignature && (
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Firmado el {formatDate(contract.artistSignature.signedAt)}
                    </div>
                  )}
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
                  <p>{clientLegalName}</p>
                  {contract.clientSignature && (
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Firmado el {formatDate(contract.clientSignature.signedAt)}
                    </div>
                  )}
                  {userType === 'artist' && (
                    <div className="mt-2 space-y-1">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Descripción del Servicio</p>
                <p>{contract.terms.serviceDescription}</p>
              </div>

              {specialRequest && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Solicitud adicional del cliente</p>
                  <p className="text-sm">{specialRequest}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Fecha</p>
                  </div>
                  <p className="text-sm">{formatDate(contract.terms.date)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">{getMeasureTitle(contract)}</p>
                  </div>
                  <p className="text-sm">
                    {contract.terms.startTime && `${contract.terms.startTime} • `}
                    {getMeasureLabel(contract)}
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

              {additionalTermsWithoutSpecialRequest.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm mb-2">3. Términos Adicionales</h4>
                    <ul className="space-y-2">
                      {additionalTermsWithoutSpecialRequest.map((term, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {agreements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Handshake className="w-4 h-4 text-[#D4AF37]" />
                      <h4 className="text-sm font-medium">Acuerdos Específicos Negociados</h4>
                    </div>
                    <ul className="space-y-2">
                      {agreements.map((agreement, idx) => (
                        <li key={agreement.id || idx} className="text-sm text-gray-700 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-[#D4AF37] font-bold shrink-0">{idx + 1}.</span>
                          <span>{agreement.description}</span>
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

          {!bothPartiesSigned && canSign && contract.status !== 'completed' && contract.status !== 'active' && contract.status !== 'cancelled' && contract.status !== 'esperando_pago' && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Firma del Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userType === 'artist' && contract.clientSignature && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2 text-blue-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="mb-2">
                          <strong>Antes de firmar:</strong> Puedes usar la información de contacto del cliente (mostrada arriba) para coordinar:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                          <li>Hora exacta del evento</li>
                          <li>Detalles específicos del servicio</li>
                          <li>Pago del depósito</li>
                          <li>Cualquier requisito especial</li>
                        </ul>
                        <p className="mt-2 text-xs">
                          Una vez coordinado todo, revisa los términos y firma el contrato.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {otherPartyHasSigned && userType === 'client' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <p className="text-sm">
                        El proveedor ya ha firmado el contrato. Revisa los acuerdos y términos, y firma para proceder al pago.
                      </p>
                    </div>
                  </div>
                )}

                {contract.rejectionReason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">Motivo del rechazo anterior:</p>
                    <p className="text-sm text-amber-800">{contract.rejectionReason}</p>
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
                  {userType === 'client' && (
                    <Button
                      variant="outline"
                      onClick={handleRejectClick}
                      disabled={signing || rejecting}
                      className="flex-1 sm:flex-initial border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {rejecting ? 'Rechazando...' : 'Rechazar y proponer cambios'}
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

          {showRejectForm && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm text-red-700">Rechazar contrato y volver a negociar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-red-600">El contrato volverá a la mesa de negociación. El proveedor podrá ajustar los términos según tus comentarios.</p>
                <div>
                  <Label className="text-xs mb-1 block">Motivo o cambios propuestos (opcional)</Label>
                  <Textarea
                    placeholder="Describe los cambios que propones o el motivo del rechazo..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="text-sm bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleRejectConfirmed}
                    disabled={rejecting}
                    className="flex-1"
                  >
                    {rejecting ? 'Rechazando...' : 'Confirmar rechazo'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                    disabled={rejecting}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <p><strong>¡Contrato firmado!</strong></p>
                    <p className="text-sm">Has firmado el contrato. El proveedor coordinará los métodos de pago disponibles contigo.</p>
                  </div>
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
                        <>Ahora puedes contactar al proveedor usando la información de contacto mostrada arriba para coordinar los detalles finales del evento.</>
                      )}
                      {userType === 'artist' && (
                        <>El contrato está confirmado. Puedes continuar coordinando con el cliente para los detalles finales del evento.</>
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
    </Dialog>
  );
}
