import { ArrowRight, Search, FileText, CheckCircle, Calendar, Users, CreditCard, Star, MessageCircle, Shield, X, UserPlus, Filter, Eye, Handshake, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface HowItWorksPageProps {
  onClose: () => void;
  onGetStarted: () => void;
}

export function HowItWorksPage({ onClose, onGetStarted }: HowItWorksPageProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--cream-white)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative" style={{ width: '40px', height: '40px' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="howItWorksLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#howItWorksLogoGradient)" />
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
                <p className="text-xs text-white/80">Cómo Funciona</p>
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
      <div className="py-20" style={{ background: 'linear-gradient(135deg, var(--navy-blue) 0%, #1a3a5c 100%)' }}>
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20">
            Proceso Simple y Seguro
          </Badge>
          <h1 className="text-white mb-6 max-w-4xl mx-auto">
            Conectamos Talento con Momentos Memorables
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Descubre cómo Memorialo hace que encontrar y contratar proveedores de servicios para tus eventos sea fácil, seguro y eficiente.
          </p>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}
            className="hover:opacity-90"
          >
            Empezar Ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Para Clientes */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
              Para Clientes
            </Badge>
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              Encuentra el Proveedor Perfecto en 4 Pasos
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desde la búsqueda hasta la confirmación, te guiamos en cada etapa para asegurar el éxito de tu evento.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Step 1 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--gold)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                  <Search className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>1. Busca</h3>
                  <p className="text-sm text-gray-600">
                    Usa nuestros filtros por ubicación, categoría y presupuesto para encontrar el proveedor ideal.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--gold)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                  <Eye className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>2. Compara</h3>
                  <p className="text-sm text-gray-600">
                    Revisa perfiles, precios, portafolios y reseñas de clientes anteriores para tomar la mejor decisión.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--gold)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>3. Contrata</h3>
                  <p className="text-sm text-gray-600">
                    Completa el formulario de reserva y firma el contrato digital con todos los detalles del servicio.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--gold)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>4. Confirma</h3>
                  <p className="text-sm text-gray-600">
                    El proveedor revisa y firma el contrato. ¡Tu reserva está confirmada y lista!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Features */}
          <Card className="border-2" style={{ borderColor: 'var(--gold)' }}>
            <CardContent className="p-8">
              <h3 className="mb-6 text-center" style={{ color: 'var(--navy-blue)' }}>
                Beneficios para Ti
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--gold)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Organiza tus Eventos</h4>
                    <p className="text-sm text-gray-600">Crea eventos y asigna múltiples servicios a cada uno</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--gold)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Contratos Seguros</h4>
                    <p className="text-sm text-gray-600">Todos los acuerdos quedan documentados y firmados digitalmente</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Star className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--gold)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Reseñas Verificadas</h4>
                    <p className="text-sm text-gray-600">Lee opiniones reales de otros clientes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Para Proveedores */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
              Para Proveedores
            </Badge>
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              Haz Crecer tu Negocio en 4 Pasos
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Llega a más clientes, gestiona tus reservas y construye tu reputación profesional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Provider Step 1 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--navy-blue)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
                  <UserPlus className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>1. Regístrate</h3>
                  <p className="text-sm text-gray-600">
                    Crea tu cuenta de proveedor y completa tu perfil profesional con tu información.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider Step 2 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--navy-blue)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>2. Publica</h3>
                  <p className="text-sm text-gray-600">
                    Agrega tus servicios con fotos, descripciones, precios y detalles de disponibilidad.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider Step 3 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--navy-blue)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
                  <Handshake className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>3. Recibe Reservas</h3>
                  <p className="text-sm text-gray-600">
                    Los clientes te encuentran, reservan y firman contratos directamente en la plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider Step 4 */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--navy-blue)' }} />
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" 
                     style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>4. Gestiona</h3>
                  <p className="text-sm text-gray-600">
                    Administra todas tus reservas, contratos y horarios desde tu panel de control.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Features */}
          <Card className="border-2" style={{ borderColor: 'var(--navy-blue)' }}>
            <CardContent className="p-8">
              <h3 className="mb-6 text-center" style={{ color: 'var(--navy-blue)' }}>
                Herramientas para tu Éxito
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <Users className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--navy-blue)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Mayor Visibilidad</h4>
                    <p className="text-sm text-gray-600">Llega a clientes que te están buscando activamente</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--navy-blue)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Ahorra Tiempo</h4>
                    <p className="text-sm text-gray-600">Gestiona todo desde un solo lugar, sin WhatsApp interminable</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Star className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--navy-blue)' }} />
                  <div>
                    <h4 className="text-sm mb-1" style={{ color: 'var(--navy-blue)' }}>Construye Reputación</h4>
                    <p className="text-sm text-gray-600">Recibe reseñas y destaca tu excelencia profesional</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Contratos */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
              Proceso de Contratación
            </Badge>
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              Sistema de Contratos Digitales
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un proceso transparente que protege a ambas partes con acuerdos claros y documentados.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Contract Flow Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    1
                  </div>
                </div>
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Cliente Solicita Servicio</h3>
                    <p className="text-gray-600 mb-3">
                      El cliente completa el formulario de reserva con todos los detalles: fecha, hora, ubicación, duración y requisitos especiales.
                    </p>
                    <Badge variant="outline" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                      Reserva Pendiente
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              </div>

              {/* Contract Flow Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    2
                  </div>
                </div>
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Cliente Firma Contrato</h3>
                    <p className="text-gray-600 mb-3">
                      Se genera un contrato digital con todos los términos. El cliente lo revisa y firma electrónicamente para confirmar su compromiso.
                    </p>
                    <Badge variant="outline" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                      Esperando Proveedor
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              </div>

              {/* Contract Flow Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    3
                  </div>
                </div>
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Proveedor Revisa y Firma</h3>
                    <p className="text-gray-600 mb-3">
                      El proveedor puede editar la fecha/hora si es necesario, revisa los términos y firma el contrato para confirmar el servicio.
                    </p>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      Reserva Confirmada ✓
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              </div>

              {/* Contract Flow Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    4
                  </div>
                </div>
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Se Realiza el Evento</h3>
                    <p className="text-gray-600 mb-3">
                      Ambas partes tienen acceso al contrato firmado. Después del evento, el cliente puede dejar una reseña del servicio.
                    </p>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                      Completado
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Gestión de Eventos */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                Organización Inteligente
              </Badge>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
                Gestiona Eventos Completos
              </h2>
              <p className="text-gray-600 mb-6">
                ¿Organizando una boda, quinceañera o evento corporativo? Crea un evento y asigna todos los servicios que necesitas: fotógrafo, DJ, salón, catering y más.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span className="text-gray-700">Agrupa múltiples servicios en un solo evento</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span className="text-gray-700">Visualiza el presupuesto total de tu evento</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span className="text-gray-700">Mantén toda la información organizada en un solo lugar</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span className="text-gray-700">Edita y actualiza detalles fácilmente</span>
                </li>
              </ul>
            </div>
            <Card className="border-2" style={{ borderColor: 'var(--gold)' }}>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Calendar className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                    <div>
                      <h4 className="mb-1" style={{ color: 'var(--navy-blue)' }}>Boda de María y Juan</h4>
                      <p className="text-sm text-gray-600">15 de Junio, 2025</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Fotógrafo - $800</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">DJ & Sonido - $600</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Salón de Eventos - $1,200</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-gray-700">Mariachi - $500</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total del Evento:</span>
                      <span className="text-green-600">$3,100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security & Trust */}
        <div className="mb-20">
          <Card className="border-2" style={{ borderColor: 'var(--gold)', backgroundColor: 'var(--cream-white)' }}>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--gold)' }} />
                <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
                  Seguridad y Confianza
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Tu tranquilidad es nuestra prioridad. Por eso implementamos medidas que protegen tanto a clientes como a proveedores.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Contratos Legales</h4>
                  <p className="text-sm text-gray-600">
                    Todos los acuerdos quedan documentados con firmas digitales verificables
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Reseñas Verificadas</h4>
                  <p className="text-sm text-gray-600">
                    Solo clientes con reservas confirmadas pueden dejar reseñas
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                       style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Soporte Continuo</h4>
                  <p className="text-sm text-gray-600">
                    Nuestro equipo está disponible para ayudarte en cada paso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 px-6 rounded-2xl" 
             style={{ background: 'linear-gradient(135deg, var(--navy-blue) 0%, #1a3a5c 100%)' }}>
          <h2 className="text-white mb-4">
            ¿Listo para Empezar?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a la comunidad de Memorialo y descubre una nueva forma de conectar talento con eventos inolvidables.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}
              className="hover:opacity-90"
            >
              Crear Cuenta Gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={onClose}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Explorar Proveedores
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
