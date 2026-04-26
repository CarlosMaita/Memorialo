import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, DollarSign, Plus, Trash2, Edit2, Save, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { PaymentMethod } from '../types';
import { toast } from 'sonner@2.0.3';

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  'Pago Móvil': <Smartphone className="w-4 h-4" />,
  'Binance': <DollarSign className="w-4 h-4" />,
  'Zelle': <CreditCard className="w-4 h-4" />,
  'PayPal': <CreditCard className="w-4 h-4" />,
  'Efectivo': <DollarSign className="w-4 h-4" />,
};

interface PaymentMethodsConfigProps {
  userId: string;
  api: {
    getPaymentMethods: (userId: string) => Promise<PaymentMethod[]>;
    createPaymentMethod: (data: { type: string; instructions: string; isActive: boolean }) => Promise<PaymentMethod>;
    updatePaymentMethod: (id: number, data: Partial<PaymentMethod>) => Promise<PaymentMethod>;
    deletePaymentMethod: (id: number) => Promise<void>;
  };
}

export function PaymentMethodsConfig({ userId, api }: PaymentMethodsConfigProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newType, setNewType] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [editType, setEditType] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  useEffect(() => {
    loadMethods();
  }, [userId]);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentMethods(userId);
      setMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newType.trim() || !newInstructions.trim()) {
      toast.error('Completa el tipo y las instrucciones del método de pago');
      return;
    }

    try {
      const method = await api.createPaymentMethod({
        type: newType.trim(),
        instructions: newInstructions.trim(),
        isActive: true,
      });
      setMethods((prev) => [...prev, method]);
      setNewType('');
      setNewInstructions('');
      setShowAddForm(false);
      toast.success('Método de pago agregado');
    } catch (error) {
      toast.error('Error al agregar el método de pago');
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const updated = await api.updatePaymentMethod(method.id, { isActive: !method.isActive });
      setMethods((prev) => prev.map((m) => (m.id === method.id ? updated : m)));
    } catch (error) {
      toast.error('Error al actualizar el método de pago');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setEditType(method.type);
    setEditInstructions(method.instructions);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editType.trim() || !editInstructions.trim()) {
      toast.error('Completa el tipo y las instrucciones');
      return;
    }

    try {
      const updated = await api.updatePaymentMethod(id, {
        type: editType.trim(),
        instructions: editInstructions.trim(),
      });
      setMethods((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
      toast.success('Método de pago actualizado');
    } catch (error) {
      toast.error('Error al actualizar el método de pago');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este método de pago?')) return;

    try {
      await api.deletePaymentMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success('Método de pago eliminado');
    } catch (error) {
      toast.error('Error al eliminar el método de pago');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 text-center py-4">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1B2A47]">Métodos de Pago</h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed border-[#D4AF37]">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Tipo de pago *</Label>
              <Input
                placeholder="Ej: Pago Móvil, Zelle, Binance..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Instrucciones y datos *</Label>
              <Textarea
                placeholder="Ingresa los datos necesarios para el pago (número de cuenta, usuario, dirección, etc.)"
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void handleAdd()} className="flex-1 bg-[#1B2A47] hover:bg-[#1B2A47]/90">
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {methods.length === 0 && !showAddForm && (
        <div className="text-sm text-gray-500 text-center py-6 border rounded-lg border-dashed">
          No tienes métodos de pago configurados.
          <br />
          <button
            className="text-[#D4AF37] hover:underline mt-1 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            Agregar el primero
          </button>
        </div>
      )}

      <div className="space-y-3">
        {methods.map((method) => (
          <Card key={method.id} className={!method.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              {editingId === method.id ? (
                <div className="space-y-3">
                  <Input
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="text-sm font-medium"
                  />
                  <Textarea
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void handleSaveEdit(method.id)} className="flex-1 bg-[#1B2A47] hover:bg-[#1B2A47]/90">
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {PAYMENT_METHOD_ICONS[method.type] || <CreditCard className="w-4 h-4" />}
                      </span>
                      <span className="font-medium text-sm text-[#1B2A47]">{method.type}</span>
                      {!method.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={method.isActive}
                        onCheckedChange={() => void handleToggleActive(method)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(method)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => void handleDelete(method.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 whitespace-pre-line">{method.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface PaymentMethodsViewProps {
  providerUserId: string;
  contractId: string;
  clientName?: string;
  api: {
    getPaymentMethods: (userId: string) => Promise<PaymentMethod[]>;
  };
}

export function PaymentMethodsView({ providerUserId, contractId, clientName, api }: PaymentMethodsViewProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMethods();
  }, [providerUserId]);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentMethods(providerUserId);
      setMethods(Array.isArray(data) ? data.filter((m) => m.isActive) : []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 text-center py-4">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">
          ¡Contrato firmado! Elige un método de pago para finalizar.
        </span>
      </div>

      <h3 className="font-semibold text-[#1B2A47]">Métodos de Pago del Proveedor</h3>

      {methods.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-6 border rounded-lg border-dashed">
          El proveedor aún no ha configurado métodos de pago.
          <br />
          Contacta al proveedor directamente para coordinar el pago.
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card key={method.id} className="border-[#D4AF37]/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">
                    {PAYMENT_METHOD_ICONS[method.type] || <CreditCard className="w-4 h-4" />}
                  </span>
                  <span className="font-semibold text-sm text-[#1B2A47]">{method.type}</span>
                </div>
                <Separator />
                <p className="text-sm text-gray-700 whitespace-pre-line">{method.instructions}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Una vez realizado el pago, notifica al proveedor para que confirme la recepción.
      </p>
    </div>
  );
}
