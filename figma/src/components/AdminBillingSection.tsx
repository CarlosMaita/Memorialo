import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { CalendarClock, CheckCircle2, Clock, CreditCard, Loader2, RefreshCw, Receipt, ShieldAlert, Wallet } from 'lucide-react';

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;

type BillingStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue' | 'empty';

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
  providerName?: string;
  providerUserName?: string;
  month: string;
  contractCount: number;
  totalSales: number;
  commissionAmount: number;
  amount: number;
  status: BillingStatus;
  dueDate?: string;
  paymentReference?: string;
  paymentSubmittedAt?: string;
  paidAt?: string;
  paymentRejectionReason?: string;
  generatedAt?: string;
}

interface BillingOverviewResponse {
  settings: BillingSettings;
  currentMonth: string;
  selectedMonth?: string | null;
  months: string[];
  invoices: BillingInvoice[];
  paymentQueue: BillingInvoice[];
  totalOutstanding: number;
  totalPendingApproval: number;
  totalCollected: number;
}

interface AdminBillingSectionProps {
  accessToken: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatMonth(month?: string | null): string {
  if (!month) return 'Sin corte';
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function formatDate(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const config: Record<BillingStatus, string> = {
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
    overdue: 'Mora',
    empty: 'Sin cargos',
  };

  return <Badge className={config[status]}>{labels[status]}</Badge>;
}

export function AdminBillingSection({ accessToken }: AdminBillingSectionProps) {
  const PAYMENTS_BATCH_SIZE = 16;
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [closureDay, setClosureDay] = useState('1');
  const [savingConfig, setSavingConfig] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
  const [rejectingInvoice, setRejectingInvoice] = useState<BillingInvoice | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visiblePaymentsCount, setVisiblePaymentsCount] = useState(PAYMENTS_BATCH_SIZE);
  const [visibleInvoicesCount, setVisibleInvoicesCount] = useState(PAYMENTS_BATCH_SIZE);

  const fetchOverview = useCallback(async (month?: string) => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = month && month !== 'all' ? `?month=${encodeURIComponent(month)}` : '';
      const response = await fetch(`${API_BASE}/billing/admin/overview${query}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json() as BillingOverviewResponse;
      setOverview(data);
      setClosureDay(String(data.settings?.closureDay || 1));
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la facturación administrativa');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchOverview(selectedMonth === 'all' ? undefined : selectedMonth);
  }, [fetchOverview, selectedMonth]);

  const queue = overview?.paymentQueue || [];
  const invoices = overview?.invoices || [];
  const visibleQueue = queue.slice(0, visiblePaymentsCount);
  const visibleInvoices = invoices.slice(0, visibleInvoicesCount);

  useEffect(() => {
    setVisiblePaymentsCount(PAYMENTS_BATCH_SIZE);
  }, [queue.length, selectedMonth]);

  useEffect(() => {
    setVisibleInvoicesCount(PAYMENTS_BATCH_SIZE);
  }, [invoices.length, selectedMonth]);

  const latestMonths = useMemo(() => ['all', ...(overview?.months || [])], [overview?.months]);

  const handleSaveConfig = async () => {
    if (!accessToken) return;

    const numericClosureDay = Number(closureDay);
    if (!Number.isInteger(numericClosureDay) || numericClosureDay < 1 || numericClosureDay > 28) {
      toast.error('El día de corte debe estar entre 1 y 28');
      return;
    }

    setSavingConfig(true);
    try {
      const response = await fetch(`${API_BASE}/billing/admin/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ closureDay: numericClosureDay }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      toast.success('Fecha de cierre actualizada');
      await fetchOverview(selectedMonth === 'all' ? undefined : selectedMonth);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar la configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    if (!accessToken) return;
    setProcessingInvoiceId(invoiceId);
    try {
      const response = await fetch(`${API_BASE}/billing/admin/invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      toast.success('Pago aprobado y cuenta reactivada si correspondía');
      await fetchOverview(selectedMonth === 'all' ? undefined : selectedMonth);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo aprobar el pago');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !rejectingInvoice) return;
    if (!rejectionReason.trim()) {
      toast.error('Debes indicar el motivo del rechazo');
      return;
    }

    setProcessingInvoiceId(rejectingInvoice.id);
    try {
      const response = await fetch(`${API_BASE}/billing/admin/invoices/${rejectingInvoice.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      toast.success('Pago rechazado. El proveedor puede volver a registrar otro pago.');
      setRejectingInvoice(null);
      setRejectionReason('');
      await fetchOverview(selectedMonth === 'all' ? undefined : selectedMonth);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo rechazar el pago');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Facturación</h2>
          <p className="text-gray-500 text-sm">Control de corte mensual, pagos recibidos y estado de solvencia de proveedores.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOverview(selectedMonth === 'all' ? undefined : selectedMonth)} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cierre mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CalendarClock className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <div className="text-2xl font-semibold text-[#1B2A47]">Día {overview?.settings?.closureDay || 1}</div>
                <div className="text-xs text-gray-500">Próximo corte: {formatDate(overview?.settings?.nextClosureDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pendiente de aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-semibold text-[#1B2A47]">{formatCurrency(overview?.totalPendingApproval || 0)}</div>
                <div className="text-xs text-gray-500">{queue.length} pago(s) en revisión</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Saldo por cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-500" />
              <div>
                <div className="text-2xl font-semibold text-[#1B2A47]">{formatCurrency(overview?.totalOutstanding || 0)}</div>
                <div className="text-xs text-gray-500">Incluye pendientes, rechazadas y morosas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-semibold text-[#1B2A47]">{formatCurrency(overview?.totalCollected || 0)}</div>
                <div className="text-xs text-gray-500">Pagos aprobados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de cierre</CardTitle>
          <CardDescription>Por defecto el corte se ejecuta el día 1 y habilita el pago del mes anterior. El plazo de pago es de {overview?.settings?.paymentGraceDays || 5} días.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:w-56 space-y-2">
            <Label htmlFor="closureDay">Día de cierre</Label>
            <Input id="closureDay" type="number" min="1" max="28" value={closureDay} onChange={(event) => setClosureDay(event.target.value)} />
          </div>
          <div className="text-sm text-gray-500 md:pb-2">
            Último mes cerrado: <span className="font-medium text-[#1B2A47]">{formatMonth(overview?.settings?.lastClosedMonth)}</span>
          </div>
          <Button onClick={handleSaveConfig} disabled={savingConfig} className="md:ml-auto">
            {savingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Guardar fecha de corte
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos registrados</CardTitle>
          <CardDescription>Pagos enviados por proveedores y pendientes de aprobación administrativa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">No hay pagos pendientes por revisar.</TableCell>
                  </TableRow>
                ) : visibleQueue.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium text-[#1B2A47]">{invoice.providerName || invoice.providerUserName || 'Proveedor'}</div>
                      <div className="text-xs text-gray-500">{invoice.providerUserName || 'Sin nombre de usuario'}</div>
                    </TableCell>
                    <TableCell>{formatMonth(invoice.month)}</TableCell>
                    <TableCell>{formatCurrency(invoice.commissionAmount || invoice.amount)}</TableCell>
                    <TableCell className="font-mono text-xs">{invoice.paymentReference || '—'}</TableCell>
                    <TableCell>{formatDate(invoice.paymentSubmittedAt)}</TableCell>
                    <TableCell><BillingStatusBadge status={invoice.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleApprove(invoice.id)} disabled={processingInvoiceId === invoice.id}>
                          {processingInvoiceId === invoice.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectingInvoice(invoice); setRejectionReason(''); }} disabled={processingInvoiceId === invoice.id}>
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {visibleQueue.length < queue.length && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisiblePaymentsCount((prev) => Math.min(prev + PAYMENTS_BATCH_SIZE, queue.length))}
              >
                Cargar más pagos ({visibleQueue.length}/{queue.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Facturas emitidas</CardTitle>
              <CardDescription>Historial general por proveedor y estado de facturación.</CardDescription>
            </div>
            <div className="w-full lg:w-64 space-y-2">
              <Label htmlFor="billingMonth">Filtrar por mes</Label>
              <select
                id="billingMonth"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {latestMonths.map((month) => (
                  <option key={month} value={month}>
                    {month === 'all' ? 'Todos los meses' : formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin inline-flex mr-2" /> Cargando facturas...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">No hay facturas para el filtro seleccionado.</TableCell>
                  </TableRow>
                ) : visibleInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium text-[#1B2A47]">{invoice.providerName || invoice.providerUserName || 'Proveedor'}</div>
                      {invoice.paymentRejectionReason ? (
                        <div className="text-xs text-rose-600 mt-1">Motivo rechazo: {invoice.paymentRejectionReason}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatMonth(invoice.month)}</TableCell>
                    <TableCell>{invoice.contractCount}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalSales)}</TableCell>
                    <TableCell>{formatCurrency(invoice.commissionAmount || invoice.amount)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell><BillingStatusBadge status={invoice.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {visibleInvoices.length < invoices.length && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisibleInvoicesCount((prev) => Math.min(prev + PAYMENTS_BATCH_SIZE, invoices.length))}
              >
                Cargar más facturas ({visibleInvoices.length}/{invoices.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectingInvoice} onOpenChange={(open) => { if (!open) { setRejectingInvoice(null); setRejectionReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>
              Indica por qué se rechaza el pago de {rejectingInvoice?.providerName || 'este proveedor'}. El proveedor podrá registrar un nuevo pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Motivo</Label>
            <Textarea id="rejectionReason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} placeholder="Ej. comprobante ilegible, monto no coincide, banco incorrecto..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingInvoice(null); setRejectionReason(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processingInvoiceId === rejectingInvoice?.id}>
              {processingInvoiceId === rejectingInvoice?.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}