import { useState, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, Calendar, DollarSign, Clock, MapPin, User, MessageCircle, Mail, Download, Printer } from 'lucide-react';
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
  const contractContentRef = useRef<HTMLDivElement>(null);

  if (!contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.');
      return;
    }

    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrato ${contract.id} - Memorialo</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            margin: 0;
            font-size: 9px;
            line-height: 1.3;
            color: #000;
          }
          h1 { 
            font-size: 16px; 
            margin: 0 0 3px 0; 
            color: #0A1F44; 
            font-weight: bold;
          }
          h2 { 
            font-size: 11px; 
            margin: 8px 0 4px 0; 
            color: #0A1F44; 
            font-weight: bold;
            border-bottom: 1px solid #D4AF37;
            padding-bottom: 2px;
          }
          h3 { 
            font-size: 10px; 
            margin: 6px 0 3px 0; 
            color: #0A1F44; 
            font-weight: bold;
          }
          p {
            margin: 3px 0;
          }
          .header { 
            border-bottom: 2px solid #D4AF37; 
            padding-bottom: 6px; 
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left { flex: 1; }
          .header-right { 
            text-align: right; 
            font-size: 8px;
            color: #6b7280;
          }
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 8px;
          }
          .section { 
            margin-bottom: 8px; 
            padding: 6px 8px; 
            border: 1px solid #e5e7eb; 
            border-radius: 4px;
            background: #fafafa;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 8px;
            margin-top: 4px;
          }
          .info-item { 
            margin-bottom: 4px; 
          }
          .label { 
            font-weight: bold; 
            color: #374151; 
            font-size: 7px; 
            text-transform: uppercase; 
            letter-spacing: 0.3px;
          }
          .value { 
            margin-top: 2px; 
            font-size: 9px;
          }
          .signature-box { 
            border: 1.5px solid #10b981; 
            background: #f0fdf4; 
            padding: 4px 6px; 
            border-radius: 3px; 
            margin-top: 3px;
            display: inline-block;
          }
          .signature-text { 
            color: #10b981; 
            font-weight: bold; 
            font-size: 8px;
          }
          .signature-date {
            font-size: 7px;
            color: #059669;
          }
          .pending {
            color: #f59e0b;
            font-size: 8px;
            margin-top: 3px;
          }
          ul { 
            padding-left: 15px; 
            margin: 3px 0;
          }
          li { 
            margin-bottom: 2px; 
            font-size: 8px;
            line-height: 1.3;
          }
          .terms-compact {
            font-size: 8px;
            line-height: 1.3;
            margin: 3px 0;
          }
          .alert-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            padding: 4px 6px;
            border-radius: 3px;
            font-size: 7px;
            margin: 6px 0;
          }
          .footer { 
            margin-top: 8px; 
            padding-top: 6px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 7px; 
            color: #6b7280; 
          }
          .price-highlight {
            color: #10b981;
            font-weight: bold;
            font-size: 14px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>📄 CONTRATO DE SERVICIOS - MEMORIALO</h1>
            <p><strong>ID:</strong> ${contract.id} | <strong>Creado:</strong> ${new Date(contract.createdAt).toLocaleDateString('es-ES')} | <strong>Estado:</strong> ${contract.status === 'active' ? '✓ Activo' : 'Pendiente'}</p>
          </div>
        </div>

        <div class="two-column">
          <!-- Partes del Contrato -->
          <div class="section">
            <h2>PARTES DEL CONTRATO</h2>
            <div class="info-item">
              <div class="label">Proveedor de Servicios</div>
              <div class="value">${contract.artistName}</div>
              ${contract.artistSignature ? `
                <div class="signature-box">
                  <div class="signature-text">✓ Firmado</div>
                  <div class="signature-date">${new Date(contract.artistSignature.signedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
              ` : '<div class="pending">⏳ Pendiente de firma</div>'}
            </div>
            <div class="info-item" style="margin-top: 6px;">
              <div class="label">Cliente</div>
              <div class="value">${contract.clientName}</div>
              ${contract.clientSignature ? `
                <div class="signature-box">
                  <div class="signature-text">✓ Firmado</div>
                  <div class="signature-date">${new Date(contract.clientSignature.signedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
              ` : '<div class="pending">⏳ Pendiente de firma</div>'}
            </div>
          </div>

          <!-- Detalles del Servicio -->
          <div class="section">
            <h2>DETALLES DEL SERVICIO</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Fecha</div>
                <div class="value">${new Date(contract.terms.date).toLocaleDateString('es-ES')}</div>
              </div>
              <div class="info-item">
                <div class="label">Hora</div>
                <div class="value">${contract.terms.startTime || 'Por coordinar'}</div>
              </div>
              <div class="info-item">
                <div class="label">Duración</div>
                <div class="value">${contract.terms.duration} ${contract.terms.duration === 1 ? 'hora' : 'horas'}</div>
              </div>
              <div class="info-item">
                <div class="label">Precio Total</div>
                <div class="value price-highlight">$${contract.terms.price}</div>
              </div>
            </div>
            <div class="info-item" style="margin-top: 4px;">
              <div class="label">Ubicación</div>
              <div class="value">${contract.terms.location}</div>
            </div>
          </div>
        </div>

        <!-- Descripción del Servicio -->
        <div class="section">
          <h2>DESCRIPCIÓN DEL SERVICIO</h2>
          <div class="terms-compact">${contract.terms.serviceDescription.replace(/\n/g, '<br>')}</div>
        </div>

        <!-- Términos y Condiciones en columnas -->
        <div class="two-column">
          <div class="section">
            <h3>1. Términos de Pago</h3>
            <div class="terms-compact">${contract.terms.paymentTerms.replace(/\n/g, '<br>')}</div>
          </div>

          <div class="section">
            <h3>2. Política de Cancelación</h3>
            <div class="terms-compact">${contract.terms.cancellationPolicy.replace(/\n/g, '<br>')}</div>
          </div>
        </div>

        ${contract.terms.additionalTerms.length > 0 ? `
          <div class="section">
            <h3>3. Términos Adicionales</h3>
            <ul>
              ${contract.terms.additionalTerms.map(term => `<li>${term}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="alert-box">
          <strong>⚠️ AVISO LEGAL:</strong> Este contrato es legalmente vinculante. Al firmarlo, ambas partes aceptan cumplir todos los términos descritos. Documento firmado electrónicamente.
        </div>

        <div class="footer">
          <p><strong>Memorialo</strong> - Plataforma de Servicios para Eventos | www.memorialo.com</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0A1F44; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            🖨️ Imprimir / Guardar como PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Cerrar
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(contractHTML);
    printWindow.document.close();
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="hidden sm:flex"
                title="Descargar/Imprimir PDF"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownloadPDF}
                className="sm:hidden"
                title="Descargar/Imprimir PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
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
                  {/* Cliente puede ver contacto del proveedor solo después de que ambos firmen */}
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
                  {/* Proveedor puede ver contacto del cliente SIEMPRE (necesita coordinar antes de firmar) */}
                  {userType === 'artist' && (
                    <div className="mt-2 space-y-1">
                      {contract.clientWhatsapp && (
                        <a 
                          href={`https://wa.me/${contract.clientWhatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {contract.clientWhatsapp}
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
                {/* Mensaje especial para proveedores sobre coordinación */}
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
                          <li>Pago del depósito (50% adelantado)</li>
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
