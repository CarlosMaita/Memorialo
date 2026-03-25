import { useCallback, useEffect, useMemo, useState } from 'react';
import { Artist, Contract, Provider } from '../types';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, FileText, History, Loader2, RefreshCw, Receipt, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;

type BillingStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue' | 'empty';

interface CompletedContractEntry {
  contractId: string;
  clientName: string;
  serviceName: string;
  price: number;
  completedAt?: string;
}

interface BillingSettings {
  commissionRate: number;
  closureDay: number;
  paymentGraceDays: number;
  nextClosureDate?: string;
  lastClosedMonth?: string | null;
}

interface BillingInvoice {
  id: string;
  providerId: string;
  month: string;
  commissionRate: number;
  completedContracts: CompletedContractEntry[];
  totalSales: number;
  commissionAmount: number;
  amount: number;
  status: BillingStatus;
  dueDate?: string;
  gracePeriodEnd?: string;
  paymentReference?: string;
  paymentSubmittedAt?: string;
  paidAt?: string;
  paymentReviewedAt?: string;
  paymentRejectionReason?: string;
  generatedAt?: string;
}

interface BillingPreview {
  providerId: string;
  providerName?: string;
  commissionRate: number;
  month: string;
  completedContracts: CompletedContractEntry[];
  contractCount: number;
  totalSales: number;
  commissionAmount: number;
}

interface BillingResponse {
  settings: BillingSettings;
  currentInvoice: BillingInvoice | null;
  history: BillingInvoice[];
  preview: BillingPreview;
}

interface BillingSectionProps {
  provider: Provider | null;
  services: Artist[];
  contracts: Contract[];
  accessToken: string | null;
}

function formatMonth(month?: string | null): string {
  if (!month) return 'Sin periodo';
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const classes: Record<BillingStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    empty: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const labels: Record<BillingStatus, string> = {
    pending: 'Pendiente',
    submitted: 'En revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    overdue: 'En mora',
    empty: 'Sin cargos',
  };

  return <Badge className={classes[status]}>{labels[status]}</Badge>;
}

export function BillingSection({ provider, services, contracts, accessToken }: BillingSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BillingResponse | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!provider?.id || !accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/billing/provider/${provider.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      setBillingData(await response.json());
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la facturación');
    } finally {
      setLoading(false);
    }
  }, [accessToken, provider?.id]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const localPreview = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const providerServiceIds = new Set(services.map((service) => service.id));
    const completedContracts = contracts.filter((contract) => {
      if (!providerServiceIds.has(contract.artistId)) return false;
      if (contract.status !== 'completed') return false;
      const completedAt = (contract as any).completedAt || contract.createdAt || '';
      return completedAt.startsWith(currentMonth);
    });
    const totalSales = completedContracts.reduce((sum, contract) => sum + contract.terms.price, 0);
    const commissionRate = 0.08;

    return {
      providerId: provider?.id || '',
      providerName: provider?.businessName,
      commissionRate,
      month: currentMonth,
      completedContracts: completedContracts.map((contract) => ({
        contractId: contract.id,
        clientName: contract.clientName,
        serviceName: contract.artistName,
        price: contract.terms.price,
        completedAt: (contract as any).completedAt || contract.createdAt,
      })),
      contractCount: completedContracts.length,
      totalSales,
      commissionAmount: totalSales * commissionRate,
    };
  }, [contracts, provider?.businessName, provider?.id, services]);

  const settings = billingData?.settings || {
    commissionRate: localPreview.commissionRate,
    closureDay: 1,
    paymentGraceDays: 5,
    nextClosureDate: undefined,
  };

  const currentInvoice = billingData?.currentInvoice || null;
  const history = billingData?.history || [];
  const preview = billingData?.preview || localPreview;
  const showPayButton = !!currentInvoice && ['pending', 'rejected', 'overdue'].includes(currentInvoice.status) && (currentInvoice.commissionAmount || currentInvoice.amount) > 0;

  const handleSubmitPayment = async () => {
    if (!provider?.id || !currentInvoice || !accessToken) return;
    setSubmittingPayment(true);
    try {
      const response = await fetch(`${API_BASE}/billing/provider/${provider.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          month: currentInvoice.month,
          paymentReference: paymentReference.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      toast.success('Pago registrado. Quedó en revisión administrativa.');
      setShowPayDialog(false);
      setPaymentReference('');
      await fetchBilling();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo registrar el pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!provider) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Configura tu perfil de proveedor para ver la facturación.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Facturación</h1>
          <p className="text-sm text-gray-500">Corte mensual el día {settings.closureDay}. El pago debe registrarse dentro de {settings.paymentGraceDays} días para evitar suspensión por mora.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBilling} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Último cierre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#1B2A47]">{formatMonth(settings.lastClosedMonth)}</div>
            <div className="text-xs text-gray-500 mt-1">Próximo corte: {formatDate(settings.nextClosureDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Comisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <div className="text-2xl font-semibold text-[#1B2A47]">{(settings.commissionRate * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Sobre reservas completadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Periodo abierto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#1B2A47]">{formatCurrency(preview.totalSales)}</div>
            <div className="text-xs text-gray-500 mt-1">{preview.contractCount} contrato(s) acumulados en {formatMonth(preview.month)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Comisión proyectada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-[#1B2A47]">{formatCurrency(preview.commissionAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">Se convierte en factura al hacer el corte</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-[#1B2A47]/10">
        <CardHeader>
          <CardTitle>Factura vigente</CardTitle>
          <CardDescription>Factura ya emitida y habilitada para pago del periodo cerrado.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cargando factura...
            </div>
          ) : !currentInvoice ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
              <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-[#1B2A47] font-medium">Aún no hay una factura emitida para pago.</p>
              <p className="text-sm text-gray-500 mt-1">El sistema emitirá la factura del mes anterior el día {settings.closureDay} de cada mes.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <BillingStatusBadge status={currentInvoice.status} />
                    <span className="text-sm text-gray-500">Periodo: {formatMonth(currentInvoice.month)}</span>
                    {currentInvoice.paymentReference ? <span className="text-xs font-mono text-gray-500">Ref: {currentInvoice.paymentReference}</span> : null}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500 mb-1">Ventas del periodo</div>
                      <div className="text-xl font-semibold text-[#1B2A47]">{formatCurrency(currentInvoice.totalSales)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500 mb-1">Comisión a pagar</div>
                      <div className="text-xl font-semibold text-[#1B2A47]">{formatCurrency(currentInvoice.commissionAmount || currentInvoice.amount)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500 mb-1">Fecha límite</div>
                      <div className="text-xl font-semibold text-[#1B2A47]">{formatDate(currentInvoice.dueDate)}</div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-72">
                  {currentInvoice.status === 'submitted' ? (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                      <div className="font-semibold mb-1">Pago enviado</div>
                      <div>Tu comprobante fue registrado el {formatDate(currentInvoice.paymentSubmittedAt)} y está pendiente de aprobación administrativa.</div>
                    </div>
                  ) : currentInvoice.status === 'approved' ? (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                      <div className="font-semibold mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Cuenta solvente</div>
                      <div>Factura aprobada el {formatDate(currentInvoice.paidAt)}.</div>
                    </div>
                  ) : currentInvoice.status === 'overdue' ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                      <div className="font-semibold mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Cuenta suspendible por mora</div>
                      <div>Si la cuenta fue suspendida, solo se reactivará cuando el administrador apruebe el pago.</div>
                    </div>
                  ) : currentInvoice.status === 'rejected' ? (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                      <div className="font-semibold mb-1">Pago rechazado</div>
                      <div>{currentInvoice.paymentRejectionReason || 'Debes registrar un nuevo pago para continuar.'}</div>
                    </div>
                  ) : null}

                  {showPayButton ? (
                    <Button className="w-full mt-4" onClick={() => setShowPayDialog(true)}>
                      <CreditCard className="w-4 h-4 mr-2" /> Registrar pago
                    </Button>
                  ) : null}
                </div>
              </div>

              {(currentInvoice.completedContracts || []).length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Contratos incluidos</div>
                  <div className="space-y-2">
                    {currentInvoice.completedContracts.map((entry) => (
                      <div key={entry.contractId} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-[#1B2A47] truncate">{entry.clientName}</div>
                          <div className="text-sm text-gray-500 truncate">{entry.serviceName}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-[#1B2A47]">{formatCurrency(entry.price)}</div>
                          <div className="text-xs text-gray-500">Completado: {formatDate(entry.completedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Periodo en curso</CardTitle>
          <CardDescription>Vista previa de lo que entrará en la siguiente factura cuando se ejecute el corte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
            <div>
              <div className="text-sm text-gray-500">Periodo abierto</div>
              <div className="text-xl font-semibold text-[#1B2A47]">{formatMonth(preview.month)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ventas acumuladas</div>
              <div className="text-xl font-semibold text-[#1B2A47]">{formatCurrency(preview.totalSales)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Comisión proyectada</div>
              <div className="text-xl font-semibold text-[#1B2A47]">{formatCurrency(preview.commissionAmount)}</div>
            </div>
          </div>
          {(preview.completedContracts || []).length === 0 ? (
            <div className="text-sm text-gray-500">Todavía no hay contratos completados dentro del periodo abierto.</div>
          ) : (
            <div className="space-y-2">
              {preview.completedContracts.map((entry) => (
                <div key={entry.contractId} className="rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1B2A47] truncate">{entry.clientName}</div>
                    <div className="text-sm text-gray-500 truncate">{entry.serviceName}</div>
                  </div>
                  <div className="text-right shrink-0 font-medium text-[#1B2A47]">{formatCurrency(entry.price)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="w-4 h-4" /> Historial</CardTitle>
            <CardDescription>Facturas emitidas en cortes anteriores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-medium text-[#1B2A47]">{formatMonth(invoice.month)}</div>
                  <div className="text-sm text-gray-500">Emitida: {formatDate(invoice.generatedAt)} · Límite: {formatDate(invoice.dueDate)}</div>
                  {invoice.paymentRejectionReason ? <div className="text-xs text-rose-600 mt-1">Motivo rechazo: {invoice.paymentRejectionReason}</div> : null}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Comisión</div>
                    <div className="font-semibold text-[#1B2A47]">{formatCurrency(invoice.commissionAmount || invoice.amount)}</div>
                  </div>
                  <BillingStatusBadge status={invoice.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              El pago quedará en revisión hasta que el administrador lo apruebe. Si la cuenta estaba suspendida, se reactivará cuando el pago sea aprobado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
              <div className="font-medium text-[#1B2A47]">Factura {currentInvoice ? formatMonth(currentInvoice.month) : '—'}</div>
              <div className="text-gray-500 mt-1">Monto: {formatCurrency(currentInvoice?.commissionAmount || currentInvoice?.amount || 0)}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Referencia de pago</Label>
              <Input id="paymentReference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Ej. transferencia, comprobante, número de operación" />
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>Si el administrador rechaza este pago, se habilitará nuevamente la opción para registrar otro comprobante.</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitPayment} disabled={submittingPayment || !currentInvoice}>
              {submittingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Enviar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
