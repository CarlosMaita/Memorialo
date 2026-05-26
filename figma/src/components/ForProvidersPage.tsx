import { useState } from 'react';
import { ArrowRight, CheckCircle, Users, Star, Briefcase, Calendar, BarChart3, HeartHandshake, Music, X, ClipboardCheck, User as UserIcon, Mail, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SEOHead } from './SEOHead';
import { toast } from 'sonner@2.0.3';

interface ForProvidersPageProps {
  onClose: () => void;
  onGetStarted: () => void;
  showRegistrationForm?: boolean;
  onProviderSignUp?: (email: string, password: string, name: string) => Promise<void>;
}

export function ForProvidersPage({ onClose, onGetStarted, showRegistrationForm = false, onProviderSignUp }: ForProvidersPageProps) {
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [registering, setRegistering] = useState(false);

  const scrollToRegistration = () => {
    const formSection = document.getElementById('provider-registration-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    onGetStarted();
  };

  const handleProviderRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onProviderSignUp) {
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setRegistering(true);
    try {
      await onProviderSignUp(registerForm.email, registerForm.password, registerForm.name);
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear la cuenta');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--cream-white)' }}>
      <SEOHead
        title="Únete como Proveedor de Eventos | Memorialo Venezuela"
        description="Publica tus servicios en Memorialo y conecta con cientos de clientes en Venezuela. Consigue más reservas, gestiona tus fechas y haz crecer tu negocio."
        canonical="/para-proveedores"
        keywords="proveedor eventos venezuela, agencia festejo, músicos eventos, catering venezuela, decoradores eventos, digitalizar negocio eventos, conseguir clientes eventos"
      />
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative" style={{ width: '40px', height: '40px' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="providerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#providerLogoGradient)" />
                  <path 
                    d="M 20 70 L 20 35 Q 20 25 30 25 L 35 25 L 50 50 L 65 25 L 70 25 Q 80 25 80 35 L 80 70" 
                    stroke="var(--navy-blue)" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M 50 42 L 52 48 L 58 50 L 52 52 L 50 58 L 48 52 L 42 50 L 48 48 Z" 
                    fill="var(--navy-blue)"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-white">Memorialo</h1>
                <p className="text-xs text-white/80">Para Proveedores</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge 
              className="mb-6 px-4 py-2 text-sm"
              style={{ 
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold)',
                border: '1px solid var(--gold)'
              }}
            >
              <Briefcase className="w-4 h-4 mr-2 inline" />
              Plataforma para Profesionales
            </Badge>
            
            <h1 className="text-white mb-6">
              Digitaliza tu negocio y multiplica tus contratos de eventos.
            </h1>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Conecta con miles de clientes que buscan servicios como el tuyo. 
              Gestiona tus reservas, construye tu reputación y aumenta tus ingresos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                style={{ 
                  backgroundColor: 'var(--gold)',
                  color: 'var(--navy-blue)'
                }}
                onClick={showRegistrationForm ? scrollToRegistration : onGetStarted}
              >
                {showRegistrationForm ? 'Registrarme como Proveedor' : 'Solicitar ser Proveedor'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showRegistrationForm && onProviderSignUp && (
        <section id="provider-registration-form" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto rounded-xl border bg-white shadow-sm p-6 md:p-8">
              <h2 className="mb-2 text-center" style={{ color: 'var(--navy-blue)' }}>
                Registro de Proveedores
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Crea tu cuenta y enviaremos tu solicitud de proveedor automáticamente.
              </p>

              <form onSubmit={handleProviderRegister} className="space-y-4">
                <div>
                  <Label htmlFor="provider-register-name" className="mb-1 block">Nombre Completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="provider-register-name"
                      required
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Juan Pérez"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="provider-register-email" className="mb-1 block">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="provider-register-email"
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
                  <Label htmlFor="provider-register-password" className="mb-1 block">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="provider-register-password"
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
                  <Label htmlFor="provider-register-confirm-password" className="mb-1 block">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="provider-register-confirm-password"
                      type="password"
                      required
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registering}
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}
                >
                  {registering ? 'Creando cuenta...' : 'Crear cuenta y solicitar perfil proveedor'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              Tus clientes ideales a un solo clic de distancia.
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Tenemos todo lo que necesitas para llevar tu negocio al siguiente nivel
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <Users className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Más Clientes</h3>
                <p className="text-gray-600 text-sm">
                  Accede a una red de clientes que buscan activamente servicios como el tuyo. 
                  Aumenta tu visibilidad y consigue más reservas.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <Calendar className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Gestión Simplificada</h3>
                <p className="text-gray-600 text-sm">
                  Panel de control intuitivo para gestionar tus reservas, servicios y contratos. 
                  Todo en un solo lugar.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <Star className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Construye tu Reputación</h3>
                <p className="text-gray-600 text-sm">
                  Sistema de reseñas y calificaciones que te ayuda a construir confianza 
                  y destacar entre la competencia.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <BarChart3 className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Estadísticas en Tiempo Real</h3>
                <p className="text-gray-600 text-sm">
                  Monitorea tu desempeño con métricas detalladas: vistas, conversiones, 
                  ingresos y más.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <HeartHandshake className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Soporte Dedicado</h3>
                <p className="text-gray-600 text-sm">
                  Equipo de soporte disponible de 9:00 a.m. a 6:00 p.m. (hora Venezuela, VET) para ayudarte en cada paso. 
                  Tu éxito es nuestro éxito.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Detailed Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center mb-12" style={{ color: 'var(--navy-blue)' }}>
              Todo bajo control: Chat, contratos y notificaciones en un solo lugar.
            </h2>

            <div className="space-y-12">
              {/* Feature 1 */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 rounded-full text-sm mb-4" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold)' }}>
                    Perfil Profesional
                  </div>
                  <h3 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
                    Muestra tu trabajo como se merece
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Galería de fotos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Portafolio completo de trabajos anteriores</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Múltiples planes y paquetes de servicio</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <div 
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  >
                    <Music className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--gold)' }} />
                    <p className="text-gray-600">Vista previa de perfil</p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 rounded-full text-sm mb-4" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold)' }}>
                    Panel de Control
                  </div>
                  <h3 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
                    Administra tu negocio desde un solo lugar
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Chat con clientes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Gestión de contratos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Notificaciones en tiempo real</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                      <span className="text-gray-700">Historial completo de reservas</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <div 
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  >
                    <BarChart3 className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--gold)' }} />
                    <p className="text-gray-600">Dashboard de métricas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-4" style={{ color: 'var(--navy-blue)' }}>
              Sencillo. Transparente. Diseñado para que crezcas.
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Para ser proveedor en Memorialo debes pasar por un proceso de revisión. Queremos garantizar la calidad de nuestra plataforma.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-2xl">1</span>
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Regístrate</h3>
                <p className="text-gray-600 text-sm">
                  Crea tu cuenta gratuita con tu email.
                </p>
              </div>

              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-2xl">2</span>
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Solicita ser Proveedor</h3>
                <p className="text-gray-600 text-sm">
                  {showRegistrationForm
                    ? 'Tu solicitud se enviará automáticamente al registrarte desde este formulario.'
                    : <>En <strong>Mi Perfil</strong>, envía tu solicitud para ser proveedor con la información de tu negocio.</>}
                </p>
              </div>

              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-2xl">3</span>
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Proceso de Revisión</h3>
                <p className="text-gray-600 text-sm">
                  Nuestro equipo revisará tu solicitud y realizará un proceso de conocimiento de tu negocio para aprobar tu cuenta.
                </p>
              </div>

              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-2xl">4</span>
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Recibe Reservas</h3>
                <p className="text-gray-600 text-sm">
                  Una vez aprobado, configura tu perfil y empieza a recibir clientes.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-lg p-6 text-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <ClipboardCheck className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--gold)' }} />
              <p className="text-gray-700 font-medium">
                El proceso de aprobación puede tomar algunos días hábiles. Nos aseguramos de conocer tu negocio antes de darte acceso como proveedor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-4" style={{ color: 'var(--navy-blue)' }}>
              ¿Qué tipo de servicios puedo ofrecer?
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Memorialo es perfecto para una amplia variedad de proveedores
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Músicos',
                'DJs',
                'Bandas',
                'Mariachis',
                'Fotógrafos',
                'Catering',
                'Decoración',
                'Salones',
                'Animadores',
                'Magos',
                'Maquillaje',
                'Videógrafos'
              ].map((category) => (
                <div
                  key={category}
                  className="p-4 rounded-lg text-center border-2 border-transparent hover:border-gold transition-colors"
                  style={{ backgroundColor: 'white' }}
                >
                  <span className="text-gray-700">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">
              ¿Listo para hacer crecer tu negocio?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Regístrate, envía tu solicitud desde <strong className="text-white">Mi Perfil</strong> y nuestro equipo estará en contacto contigo para conocer tu negocio.
            </p>
            <Button 
              size="lg"
              style={{ 
                backgroundColor: 'var(--gold)',
                color: 'var(--navy-blue)'
              }}
              onClick={showRegistrationForm ? scrollToRegistration : onGetStarted}
            >
              {showRegistrationForm ? 'Completar Registro' : 'Solicitar ser Proveedor'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
