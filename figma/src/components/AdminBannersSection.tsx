import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { backendMode, laravelApiBaseUrl } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react';

const API_BASE = backendMode === 'laravel'
  ? laravelApiBaseUrl
  : `https://${projectId}.supabase.co/functions/v1/make-server-5d78aefb`;

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string | null;
  visible: boolean;
  order: number;
  createdAt?: string;
}

interface AdminBannersSectionProps {
  accessToken: string | null;
  bannersSectionEnabled: boolean;
  onToggleBannersSection: (enabled: boolean) => Promise<void>;
}

const EMPTY_FORM = { title: '', imageUrl: '', link: '', visible: true, order: 0 };

export function AdminBannersSection({ accessToken, bannersSectionEnabled, onToggleBannersSection }: AdminBannersSectionProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/banners`, { headers: apiHeaders() });
      if (!res.ok) throw new Error('Error al cargar banners');
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron cargar los banners');
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditingBanner(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link ?? '',
      visible: banner.visible,
      order: banner.order,
    });
    setImageFile(null);
    // Only set preview for safe URLs
    setImagePreview(/^https?:\/\//i.test(banner.imageUrl) ? banner.imageUrl : null);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          imageData: base64,
          fileName: file.name,
          contentType: file.type,
          folder: 'banner-images',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Error al subir la imagen');
      }

      const data = await res.json();
      return data.url as string;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    let finalImageUrl = form.imageUrl;

    if (imageFile) {
      try {
        finalImageUrl = await uploadImage(imageFile);
      } catch (err: any) {
        toast.error(err?.message ?? 'Error al subir la imagen');
        return;
      }
    }

    if (!finalImageUrl.trim()) {
      toast.error('La imagen es requerida');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        imageUrl: finalImageUrl,
        link: form.link.trim() || null,
        visible: form.visible,
        order: form.order,
      };

      if (editingBanner) {
        const res = await fetch(`${API_BASE}/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error al actualizar el banner');
        const updated = await res.json();
        setBanners((prev) => prev.map((b) => (b.id === editingBanner.id ? updated : b)));
        toast.success('Banner actualizado');
      } else {
        const res = await fetch(`${API_BASE}/admin/banners`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error al crear el banner');
        const created = await res.json();
        setBanners((prev) => [...prev, created]);
        toast.success('Banner creado');
      }

      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al guardar el banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (!res.ok) throw new Error('Error al eliminar el banner');
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner eliminado');
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al eliminar el banner');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisible = async (banner: Banner) => {
    try {
      const res = await fetch(`${API_BASE}/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ visible: !banner.visible }),
      });
      if (!res.ok) throw new Error('Error al actualizar visibilidad');
      const updated = await res.json();
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al actualizar visibilidad');
    }
  };

  const handleToggleSection = async (checked: boolean) => {
    setToggling(true);
    try {
      await onToggleBannersSection(checked);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1B2A47] mb-1">Banners</h2>
        <p className="text-gray-500 text-sm">Gestiona el carrusel de banners del inicio de la plataforma</p>
      </div>

      {/* Section toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visibilidad del carrusel</CardTitle>
          <CardDescription>Habilita o deshabilita la sección de banners en el inicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="banners-section-toggle"
              checked={bannersSectionEnabled}
              onCheckedChange={handleToggleSection}
              disabled={toggling}
            />
            <Label htmlFor="banners-section-toggle" className="cursor-pointer">
              {bannersSectionEnabled ? 'Sección habilitada' : 'Sección deshabilitada'}
            </Label>
            {toggling && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        </CardContent>
      </Card>

      {/* Banners list */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Banners ({banners.length})</CardTitle>
            <CardDescription>Los banners visibles se muestran en el carrusel del inicio</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo banner
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No hay banners creados aún. Crea el primero con el botón de arriba.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-16 h-10 object-cover rounded-md border border-gray-200"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[160px] truncate">{banner.title}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-gray-500">
                        {banner.link ? (
                          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {banner.link}
                          </a>
                        ) : (
                          <span className="text-gray-400">Sin link</span>
                        )}
                      </TableCell>
                      <TableCell>{banner.order}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(banner)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${banner.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {banner.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {banner.visible ? 'Visible' : 'Oculto'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openEdit(banner)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(banner.id)}
                            disabled={deletingId === banner.id}
                          >
                            {deletingId === banner.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Editar banner' : 'Nuevo banner'}</DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Modifica los datos del banner.' : 'Completa los datos para crear un nuevo banner.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="banner-title">Título *</Label>
              <Input
                id="banner-title"
                placeholder="Ej: Promoción de verano"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Imagen *</Label>
              <div className="space-y-2">
                {imagePreview && /^(https?:\/\/|data:image\/)/.test(imagePreview) && (
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-1" />
                    {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Seleccionar imagen para el banner"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {!imageFile && !imagePreview && (
                  <div className="space-y-1">
                    <Label htmlFor="banner-image-url" className="text-xs text-gray-500">O pega una URL de imagen</Label>
                    <Input
                      id="banner-image-url"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, imageUrl: value }));
                        // Only allow http/https URLs as image preview to prevent XSS
                        const safe = /^https?:\/\//i.test(value) ? value : null;
                        setImagePreview(safe);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-link">Link (opcional)</Label>
              <Input
                id="banner-link"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="banner-order">Orden</Label>
                <Input
                  id="banner-order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Visible</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="banner-visible"
                    checked={form.visible}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, visible: checked }))}
                  />
                  <Label htmlFor="banner-visible" className="cursor-pointer text-sm">
                    {form.visible ? 'Visible' : 'Oculto'}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving || uploadingImage}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving || uploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingBanner ? 'Guardar cambios' : 'Crear banner'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
