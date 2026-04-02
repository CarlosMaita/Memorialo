import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Loader2, RefreshCw, Search, Users } from 'lucide-react';

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;

interface InterestedProviderLead {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  createdAt?: string | null;
}

interface AdminInterestedProvidersSectionProps {
  accessToken: string | null;
}

function formatDate(date?: string | null): string {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminInterestedProvidersSection({ accessToken }: AdminInterestedProvidersSectionProps) {
  const [items, setItems] = useState<InterestedProviderLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterestedProviders = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/admin/interested-providers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la lista de interesados');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchInterestedProviders();
  }, [fetchInterestedProviders]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.email, item.phone || '', item.message || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Proveedores interesados</h2>
        <p className="text-gray-500 text-sm">Listado de personas que dejaron sus datos para el lanzamiento de Memorialo.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Lista de interesados</CardTitle>
              <CardDescription>
                {items.length} registro{items.length === 1 ? '' : 's'} captado{items.length === 1 ? '' : 's'} desde la landing.
              </CardDescription>
            </div>

            <Button variant="outline" onClick={fetchInterestedProviders} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando interesados...
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead>Mensaje / interés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span>No hay proveedores interesados para mostrar.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone || '—'}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm text-gray-600">
                          {item.message || 'Sin mensaje adicional'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
