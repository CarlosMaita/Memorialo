import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../types';
import { toast } from 'sonner@2.0.3';
import { User as UserIcon, Mail, Lock, Phone, Briefcase } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export function AuthDialog({ open, onClose, onLogin }: AuthDialogProps) {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isProvider: false
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate login - in real app, this would call an API
    const mockUser: User = {
      id: 'user-' + Date.now(),
      email: loginForm.email,
      name: loginForm.email.split('@')[0],
      createdAt: new Date().toISOString(),
      isArtist: false
    };

    onLogin(mockUser);
    toast.success('¡Bienvenido de nuevo!');
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Simulate registration - in real app, this would call an API
    const newUser: User = {
      id: 'user-' + Date.now(),
      email: registerForm.email,
      name: registerForm.name,
      phone: registerForm.phone,
      createdAt: new Date().toISOString(),
      isProvider: registerForm.isProvider
    };

    onLogin(newUser);
    toast.success('¡Cuenta creada exitosamente!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Accede a tu Cuenta</DialogTitle>
          <DialogDescription>
            Inicia sesión o crea una cuenta para reservar artistas y gestionar tus contratos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="login-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name">Nombre Completo</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="register-name"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="register-email"
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="register-phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="register-password"
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-confirm-password">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Checkbox
                  id="isProvider"
                  checked={registerForm.isProvider}
                  onCheckedChange={(checked) => 
                    setRegisterForm({ ...registerForm, isProvider: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="isProvider"
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Quiero ofrecer mis servicios como proveedor</span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    Podrás crear publicaciones y recibir reservas de clientes
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Crear Cuenta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
