import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Artist, Contract, Provider, User } from '../types';
import {
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Loader2,
  XCircle,
  FileText,
  BadgePercent,
  ShieldAlert,
  ShieldCheck,
  History
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;
const COMMISSION_RATE = 0.08;

interface CompletedContractEntry {
  contractId: string;
  clientName: string;
  serviceName: string;
  price: number;
  completedAt: string;
}

interface BillingInvoice {
  id: string;
  providerId: string;
  month: string;
  commissionRate: number;
  completedContracts: CompletedContractEntry[];
  totalSales: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'empty';
  dueDate: string;
  gracePeriodEnd?: string;
  paidAt?: string;
  paymentReference?: string;
  generatedAt: string;
  amount?: number;
}

interface BillingSectionProps {
  provider: Provider | null;
  services: Artist[];
  contracts: Contract[];
  accessToken: string | null;
}

function formatMonth(month: string): string {
  if (!month) return '';
  const [year, mon] = month.split('-');
  const date = new Date(parseInt(year), parseInt(mon) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Pagado
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Vencido
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pendiente
        </Badge>
      );
    case 'empty':
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Sin cargos
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export function BillingSection({ provider, services, contracts, accessToken }: BillingSectionProps) {
  const [loading, setLoading] = useState(true);
  const [currentInvoice, setCurrentInvoice] = useState<BillingInvoice | null>(null);
  const [history, setHistory] = useState<BillingInvoice[]>([]);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<BillingInvoice | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    if (!provider?.id || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/billing/provider/${provider.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setCurrentInvoice(data.currentInvoice);
      setHistory(data.history || []);
    } catch (err: any) {
      console.error('Billing fetch error:', err);
      setError(err.message || 'No se pudo cargar la facturación');
    } finally {
      setLoading(false);
    }
  }, [provider?.id, accessToken]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // Also compute current month locally from passed contracts as fallback/supplement
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const providerServiceIds = new Set(services.map(s => s.id));

  const localCurrentMonthContracts = contracts.filter(c => {
    if (!providerServiceIds.has(c.artistId)) return false;
    if (c.status !== 'completed') return false;
    const dateStr = (c as any).completedAt || c.createdAt || '';
    return dateStr.startsWith(currentMonth);
  });

  const localTotalSales = localCurrentMonthContracts.reduce((sum, c) => sum + c.terms.price, 0);
  const localCommissionAmount = localTotalSales * COMMISSION_RATE;

  // Use backend data if available, otherwise local
  const displayInvoice = currentInvoice ?? {
    id: `local-${currentMonth}`,
    providerId: provider?.id || '',
    month: currentMonth,
    commissionRate: COMMISSION_RATE,
    completedContracts: localCurrentMonthContracts.map(c => ({
      contractId: c.id,
      clientName: c.clientName,
      serviceName: c.artistName,
      price: c.terms.price,
      completedAt: (c as any).completedAt || c.createdAt
    })),
    totalSales: localTotalSales,
    commissionAmount: localCommissionAmount,
    status: localTotalSales > 0 ? 'pending' : 'empty',
    dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(),
    generatedAt: new Date().toISOString()
  } as BillingInvoice;

  const isOverdue = displayInvoice?.status === 'overdue' ||
    (displayInvoice?.status === 'pending' && new Date() > new Date(displayInvoice.dueDate));

  const handleOpenPayDialog = (invoice: BillingInvoice) => {
    setPayingInvoice(invoice);
    setPaymentRef('');
    setShowPayDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!payingInvoice || !provider?.id || !accessToken) return;
    setSubmittingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/billing/provider/${provider.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          month: payingInvoice.month,
          paymentReference: paymentRef || undefined,
          amount: payingInvoice.commissionAmount || payingInvoice.amount
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      toast.success('¡Pago registrado exitosamente!');
      setShowPayDialog(false);
      await fetchBilling();
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(`Error al registrar el pago: ${err.message}`);
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A47] mb-1">Facturación</h1>
          <p className="text-gray-500 text-sm">
            Comisión del plataforma: <span className="font-semibold text-[#1B2A47]">{(COMMISSION_RATE * 100).toFixed(0)}%</span> sobre ventas completadas · Vencimiento: 15 del mes siguiente
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBilling}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error al cargar datos de facturación</p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
            <button onClick={fetchBilling} className="text-red-700 underline text-xs mt-1">Reintentar</button>
          </div>
        </div>
      )}

      {/* Suspension / Overdue warning */}
      {isOverdue && displayInvoice?.status !== 'paid' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Pago vencido — Cuenta en riesgo de suspensión</p>
            <p className="text-sm text-red-700 mt-0.5">
              Tu factura del mes <strong>{formatMonth(displayInvoice?.month || currentMonth)}</strong> está vencida.
              Si no realizas el pago en los próximos días, tu cuenta podrá ser suspendida y tus servicios
              no serán visibles en el marketplace.
            </p>
          </div>
        </div>
      )}

      {/* ── Current Month Invoice ───────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Mes actual · {formatMonth(currentMonth)}
        </h2>

        {loading ? (
          <Card>
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
            </CardContent>
          </Card>
        ) : (
          <Card className={`overflow-hidden border-2 ${
            displayInvoice?.status === 'paid'
              ? 'border-green-200 bg-green-50/30'
              : isOverdue
              ? 'border-red-300 bg-red-50/20'
              : displayInvoice?.status === 'pending' && (displayInvoice?.commissionAmount || 0) > 0
              ? 'border-amber-300 bg-amber-50/20'
              : 'border-gray-200'
          }`}>
            {/* Colored top bar */}
            <div className={`h-1.5 w-full ${
              displayInvoice?.status === 'paid'
                ? 'bg-green-400'
                : isOverdue
                ? 'bg-red-500'
                : displayInvoice?.status === 'pending' && (displayInvoice?.commissionAmount || 0) > 0
                ? 'bg-amber-400'
                : 'bg-gray-200'
            }`} />

            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: amounts */}
                <div className="flex-1 space-y-4">
                  {/* Status row */}
                  <div className="flex items-center gap-3">
                    <InvoiceStatusBadge status={displayInvoice?.status === 'pending' && isOverdue ? 'overdue' : (displayInvoice?.status || 'empty')} />
                    {displayInvoice?.paidAt && (
                      <span className="text-xs text-gray-400">
                        Pagado el {formatDate(displayInvoice.paidAt)}
                      </span>
                    )}
                    {displayInvoice?.paymentReference && (
                      <span className="text-xs text-gray-400 font-mono">
                        Ref: {displayInvoice.paymentReference}
                      </span>
                    )}
                  </div>

                  {/* Main figures */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Ventas completadas
                      </p>
                      <p className="text-xl font-bold text-[#1B2A47]">
                        {formatCurrency(displayInvoice?.totalSales || 0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {displayInvoice?.completedContracts?.length || 0} contrato{(displayInvoice?.completedContracts?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <BadgePercent className="w-3 h-3" /> Comisión ({(COMMISSION_RATE * 100).toFixed(0)}%)
                      </p>
                      <p className={`text-xl font-bold ${
                        (displayInvoice?.commissionAmount || 0) > 0
                          ? displayInvoice?.status === 'paid' ? 'text-green-600' : 'text-amber-600'
                          : 'text-gray-400'
                      }`}>
                        {formatCurrency(displayInvoice?.commissionAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">A pagar a Memorialo</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm sm:col-span-1 col-span-2">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Fecha límite de pago
                      </p>
                      <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-[#1B2A47]'}`}>
                        {formatDate(displayInvoice?.dueDate || '')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {displayInvoice?.gracePeriodEnd
                          ? `Período de gracia: ${formatDate(displayInvoice.gracePeriodEnd)}`
                          : '5 días de gracia'}
                      </p>
                    </div>
                  </div>

                  {/* How commission is calculated */}
                  <div className="flex items-start gap-2 p-3 bg-[#1B2A47]/5 rounded-lg text-xs text-gray-600">
                    <Info className="w-4 h-4 text-[#1B2A47] shrink-0 mt-0.5" />
                    <p>
                      La comisión se calcula sobre el valor total de los contratos marcados como{' '}
                      <strong>completados</strong> durante el mes. Solo se contabilizan los contratos
                      completados en este período de facturación.
                    </p>
                  </div>
                </div>

                {/* Right: CTA */}
                {displayInvoice?.status !== 'paid' && (displayInvoice?.commissionAmount || 0) > 0 && (
                  <div className="sm:w-48 shrink-0">
                    <div className={`rounded-xl p-4 text-center space-y-3 ${
                      isOverdue
                        ? 'bg-red-600 text-white'
                        : 'bg-[#1B2A47] text-white'
                    }`}>
                      <DollarSign className="w-8 h-8 mx-auto opacity-80" />
                      <div>
                        <p className="text-xs opacity-80 mb-0.5">Monto a pagar</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(displayInvoice?.commissionAmount || 0)}
                        </p>
                      </div>
                      <Button
                        className={`w-full font-semibold ${
                          isOverdue
                            ? 'bg-white text-red-700 hover:bg-red-50'
                            : 'bg-[#D4AF37] text-[#1B2A47] hover:bg-[#c4a030]'
                        }`}
                        onClick={() => displayInvoice && handleOpenPayDialog(displayInvoice)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar ahora
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paid confirmation */}
                {displayInvoice?.status === 'paid' && (
                  <div className="sm:w-48 shrink-0">
                    <div className="rounded-xl p-4 text-center space-y-3 bg-green-600 text-white">
                      <ShieldCheck className="w-8 h-8 mx-auto" />
                      <div>
                        <p className="text-xs opacity-80 mb-0.5">Pagado</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(displayInvoice?.commissionAmount || displayInvoice?.amount || 0)}
                        </p>
                      </div>
                      <p className="text-xs opacity-70">¡Gracias por tu pago!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Completed contracts breakdown */}
              {(displayInvoice?.completedContracts?.length || 0) > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Detalle de ventas completadas
                  </h3>
                  <div className="space-y-2">
                    {displayInvoice!.completedContracts.map((entry, i) => (
                      <div
                        key={entry.contractId || i}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1B2A47] truncate">{entry.clientName}</p>
                          <p className="text-xs text-gray-500 truncate">{entry.serviceName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-[#1B2A47]">{formatCurrency(entry.price)}</p>
                          <p className="text-xs text-amber-600">−{formatCurrency(entry.price * COMMISSION_RATE)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals footer */}
                  <div className="mt-3 p-3 bg-[#1B2A47]/5 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Comisión total del mes</span>
                    <span className="text-base font-bold text-[#1B2A47]">
                      {formatCurrency(displayInvoice?.commissionAmount || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(displayInvoice?.status === 'empty' || (displayInvoice?.completedContracts?.length || 0) === 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center py-4">
                  <Receipt className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    No hay ventas completadas este mes todavía.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Las comisiones se generan al marcar reservas como completadas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Historical Invoices ─────────────────────────────────────────── */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Historial de facturas
          </h2>
          <div className="space-y-2">
            {history.map((inv) => {
              const isExpanded = expandedHistoryId === inv.id;
              return (
                <Card key={inv.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <button
                      className="w-full flex items-center gap-3 text-left"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : inv.id)}
                    >
                      {/* Month */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1B2A47] capitalize">
                            {formatMonth(inv.month)}
                          </p>
                          <InvoiceStatusBadge status={inv.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ventas: {formatCurrency(inv.totalSales || 0)} · Comisión: {formatCurrency(inv.commissionAmount || inv.amount || 0)}
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="shrink-0 text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400">Período</p>
                            <p className="font-medium">{formatMonth(inv.month)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Total ventas</p>
                            <p className="font-medium">{formatCurrency(inv.totalSales || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Comisión ({(COMMISSION_RATE * 100).toFixed(0)}%)</p>
                            <p className="font-medium">{formatCurrency(inv.commissionAmount || inv.amount || 0)}</p>
                          </div>
                          {inv.paidAt && (
                            <div>
                              <p className="text-gray-400">Fecha de pago</p>
                              <p className="font-medium text-green-600">{formatDate(inv.paidAt)}</p>
                            </div>
                          )}
                          {inv.paymentReference && (
                            <div className="col-span-2">
                              <p className="text-gray-400">Referencia de pago</p>
                              <p className="font-mono font-medium text-[#1B2A47]">{inv.paymentReference}</p>
                            </div>
                          )}
                        </div>

                        {/* Contracts breakdown for history */}
                        {inv.completedContracts?.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contratos</p>
                            {inv.completedContracts.map((entry, i) => (
                              <div key={entry.contractId || i} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="flex-1 truncate">{entry.clientName} · {entry.serviceName}</span>
                                <span className="font-semibold shrink-0">{formatCurrency(entry.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pay button for overdue/unpaid history */}
                        {inv.status !== 'paid' && (inv.commissionAmount || inv.amount || 0) > 0 && (
                          <Button
                            size="sm"
                            className="bg-[#1B2A47] text-white hover:bg-[#2d4270]"
                            onClick={() => handleOpenPayDialog(inv)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                            Registrar pago
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty history */}
      {!loading && history.length === 0 && (
        <div className="text-center py-6">
          <History className="w-10 h-10 mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">No hay facturas anteriores</p>
        </div>
      )}

      {/* ── Info card ──────────────────────────────────────────────────── */}
      <Card className="bg-[#1B2A47]/5 border-[#1B2A47]/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#1B2A47] shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-[#1B2A47]">Política de comisiones de Memorialo</p>
              <ul className="space-y-0.5 text-gray-500 list-disc list-inside">
                <li>Se cobra una comisión del <strong className="text-[#1B2A47]">8%</strong> sobre cada venta completada.</li>
                <li>La factura se genera al <strong className="text-[#1B2A47]">cierre de cada mes</strong> (último día).</li>
                <li>El vencimiento es el <strong className="text-[#1B2A47]">día 15 del mes siguiente</strong> con 5 días de gracia.</li>
                <li>Los negocios con pagos vencidos serán <strong className="text-red-600">suspendidos</strong> hasta regularizar su situación.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Payment Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              Registrar pago
            </DialogTitle>
            <DialogDescription>
              Registra el pago de tu comisión para el período{' '}
              <strong>{formatMonth(payingInvoice?.month || '')}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Amount summary */}
            <div className="bg-[#1B2A47]/5 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Monto a pagar</p>
              <p className="text-3xl font-bold text-[#1B2A47]">
                {formatCurrency(payingInvoice?.commissionAmount || payingInvoice?.amount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Comisión del {(COMMISSION_RATE * 100).toFixed(0)}% sobre{' '}
                {formatCurrency(payingInvoice?.totalSales || 0)} en ventas
              </p>
            </div>

            {/* Payment details */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-xl text-sm">
              <p className="font-semibold text-blue-800">Datos de transferencia</p>
              <div className="space-y-1 text-blue-700 text-xs">
                <p><span className="font-medium">Banco:</span> Banco Nacional de Venezuela</p>
                <p><span className="font-medium">Cuenta:</span> 0102-0000-00-0000000000</p>
                <p><span className="font-medium">RIF:</span> J-00000000-0</p>
                <p><span className="font-medium">A nombre de:</span> Memorialo C.A.</p>
                <p><span className="font-medium">Concepto:</span> Comisión {formatMonth(payingInvoice?.month || '')} - {provider?.businessName}</p>
              </div>
            </div>

            {/* Reference number */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentRef">Número de referencia / comprobante</Label>
              <Input
                id="paymentRef"
                placeholder="Ej: 000123456789"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="border-2 focus:border-[#D4AF37]"
              />
              <p className="text-xs text-gray-400">Ingresa el número de confirmación de tu pago</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#1B2A47] hover:bg-[#2d4270] text-white"
                onClick={handleSubmitPayment}
                disabled={submittingPayment}
              >
                {submittingPayment ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar pago</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
