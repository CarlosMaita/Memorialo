import { useState, useRef } from 'react';
import { User, Booking, Contract, Review } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Camera, Mail, Phone, Briefcase, CalendarDays, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface UserProfileProps {
  user: User;
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
  contracts: Contract[];
  reviews: Review[];
  onBecomeProvider?: () => void;
  onUserUpdate?: (updates: Partial<User>) => Promise<void> | void;
}

export function UserProfile({ user, open, onClose, bookings, contracts, reviews, onBecomeProvider, onUserUpdate }: UserProfileProps) {
  if (!user) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(user.whatsappNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });

    const previousAvatar = avatarPreview;
    setAvatarPreview(dataUrl);

    try {
      if (onUserUpdate) {
        await onUserUpdate({ avatar: dataUrl });
      }
      toast.success('Foto de perfil actualizada');
    } catch {
      setAvatarPreview(previousAvatar || null);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<User> = {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        whatsappNumber: editWhatsapp.trim() || undefined,
      };

      if (onUserUpdate) {
        await onUserUpdate(updates);
      }

      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch {
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditWhatsapp(user.whatsappNumber || '');
    setIsEditing(false);
  };

  const currentAvatar = avatarPreview || user.avatar;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>Tu perfil de usuario</DialogDescription>
        </DialogHeader>

        {/* Cover + Avatar Section */}
        <div className="relative">
          {/* Gradient cover */}
          <div
            className="h-28 sm:h-36 rounded-t-lg"
            style={{
              background: 'linear-gradient(135deg, #0A1F44 0%, #1a3a6b 50%, #D4AF37 100%)',
            }}
          />

          {/* Avatar overlay */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 sm:-bottom-16">
            <div className="relative group">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-white shadow-xl">
                {currentAvatar ? (
                  <AvatarImage src={currentAvatar} alt={user.name} className="object-cover" />
                ) : null}
                <AvatarFallback
                  className="text-3xl sm:text-4xl text-white"
                  style={{ backgroundColor: '#0A1F44' }}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Camera overlay */}
              <button
                onClick={handleAvatarClick}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center cursor-pointer border-none"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-white text-[10px] font-medium">Cambiar foto</span>
                </div>
              </button>

              {/* Small camera badge */}
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#D4AF37] shadow-lg flex items-center justify-center cursor-pointer border-2 border-white hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4 text-[#0A1F44]" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-5 sm:px-6 pt-16 sm:pt-18 pb-5 sm:pb-6 space-y-5">
          {/* Name + Role */}
          <div className="text-center">
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-center text-xl font-semibold mb-1 max-w-xs mx-auto"
                placeholder="Tu nombre"
              />
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h2>
            )}
            <div className="flex items-center justify-center gap-2 mt-1">
              {user.isProvider && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#D4AF37/15', color: '#0A1F44', border: '1px solid #D4AF37' }}
                >
                  <Briefcase className="w-3 h-3" />
                  Proveedor
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <CalendarDays className="w-3 h-3" />
                Desde {new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Información de contacto
              </h3>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-[#0A1F44]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-500"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="text-xs bg-[#0A1F44] hover:bg-[#0A1F44]/90 text-white"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Email - read only */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Correo electrónico</p>
                  <p className="text-sm text-gray-900 truncate">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Teléfono</p>
                  {isEditing ? (
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+58 412 000 0000"
                      className="h-7 text-sm mt-0.5"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {user.phone || <span className="text-gray-400 italic">No agregado</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  {isEditing ? (
                    <Input
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      placeholder="+58 412 000 0000"
                      className="h-7 text-sm mt-0.5"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {user.whatsappNumber || <span className="text-gray-400 italic">No agregado</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - compact */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-lg font-bold text-blue-700">{bookings.length}</p>
              <p className="text-[11px] text-blue-600 font-medium">Reservas</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-700">{contracts.length}</p>
              <p className="text-[11px] text-green-600 font-medium">Contratos</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-lg font-bold text-purple-700">{reviews.length}</p>
              <p className="text-[11px] text-purple-600 font-medium">Reseñas</p>
            </div>
          </div>

          {/* Become Provider CTA */}
          {!user.isProvider && onBecomeProvider && (
            <>
              <Separator />
              <div
                className="rounded-xl p-4 border-2 border-dashed"
                style={{ borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: 'linear-gradient(135deg, #0A1F44, #1a3a6b)' }}
                  >
                    <Briefcase className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0A1F44] mb-1">
                      ¿Ofreces servicios para eventos?
                    </h3>
                    <p className="text-xs text-gray-500">
                      Activa tu perfil de proveedor y empieza a recibir clientes
                    </p>
                  </div>
                  <Button
                    onClick={onBecomeProvider}
                    className="bg-[#0A1F44] hover:bg-[#0A1F44]/90 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Activar Perfil de Proveedor
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
