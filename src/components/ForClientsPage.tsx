import { ArrowRight, CheckCircle, Search, Users, Shield, Clock, Star, Heart, Calendar, Filter, Globe, MessageCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface ForClientsPageProps {
  onClose: () => void;
  onGetStarted: () => void;
}

export function ForClientsPage({ onClose, onGetStarted }: ForClientsPageProps) {
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
                    <linearGradient id="clientLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#clientLogoGradient)" />
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
                <p className="text-xs text-white/80">Para Clientes</p>
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
              <Heart className="w-4 h-4 mr-2 inline" />
              Eventos Inolvidables
            </Badge>
            
            <h1 className="text-white mb-6">
              Encuentra los mejores proveedores para tu evento
            </h1>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Desde músicos hasta salones, todo lo que necesitas para crear momentos 
              memorables en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                style={{ 
                  backgroundColor: 'var(--gold)',
                  color: 'var(--navy-blue)'
                }}
                onClick={onGetStarted}
              >
                Explorar Servicios
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white bg-transparent hover:bg-white/10"
                style={{ color: 'white', borderWidth: '2px' }}
              >
                Cómo Funciona
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-white mb-2" style={{ fontSize: '2rem' }}>500+</div>
                <div className="text-white/60 text-sm">Proveedores Verificados</div>
              </div>
              <div className="text-center">
                <div className="text-white mb-2" style={{ fontSize: '2rem' }}>2,000+</div>
                <div className="text-white/60 text-sm">Eventos Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-white mb-2" style={{ fontSize: '2rem' }}>98%</div>
                <div className="text-white/60 text-sm">Clientes Satisfechos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              ¿Por qué elegir Memorialo?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Hacemos que organizar tu evento sea fácil, seguro y sin estrés
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
                  <Search className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Búsqueda Inteligente</h3>
                <p className="text-gray-600 text-sm">
                  Encuentra exactamente lo que buscas con filtros avanzados por ciudad, 
                  categoría, precio y disponibilidad.
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
                  <Globe className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Alcance Nacional</h3>
                <p className="text-gray-600 text-sm">
                  Accede a una red de proveedores en las principales ciudades del país. 
                  Donde sea tu evento, estamos ahí.
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
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Reseñas Verificadas</h3>
                <p className="text-gray-600 text-sm">
                  Lee opiniones reales de clientes que ya contrataron. Solo reseñas 
                  verificadas de eventos completados.
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
                  <Calendar className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Organiza por Eventos</h3>
                <p className="text-gray-600 text-sm">
                  Agrupa todos tus servicios por evento. Gestiona boda, cumpleaños o 
                  fiesta corporativa desde un solo panel.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
                >
                  <Shield className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Reserva Segura</h3>
                <p className="text-gray-600 text-sm">
                  Contratos digitales y pagos protegidos. Tu dinero está seguro hasta 
                  que el servicio se complete satisfactoriamente.
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
                  <MessageCircle className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-3" style={{ color: 'var(--navy-blue)' }}>Comunicación Directa</h3>
                <p className="text-gray-600 text-sm">
                  Chatea directamente con proveedores. Resuelve dudas, negocia detalles 
                  y coordina sin intermediarios.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-4" style={{ color: 'var(--navy-blue)' }}>
              Cómo funciona
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Contratar servicios para tu evento nunca fue tan fácil
            </p>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-xl">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Busca lo que necesitas</h3>
                  <p className="text-gray-600">
                    Usa nuestro buscador para encontrar proveedores por ciudad, categoría y fecha. 
                    Filtra por precio, calificación y servicios específicos.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-xl">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Revisa y elige</h3>
                  <p className="text-gray-600">
                    Revisa perfiles completos con fotos, videos y portafolios. Lee reseñas de otros 
                    clientes y elige la mejor opción para tu evento.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-xl">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Reserva con confianza</h3>
                  <p className="text-gray-600">
                    Selecciona el plan que más te convenga, completa los detalles de tu evento y 
                    confirma la reserva. Recibirás un contrato digital automáticamente.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}
                >
                  <span className="text-xl">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Disfruta tu evento</h3>
                  <p className="text-gray-600">
                    El proveedor llega en la fecha acordada. Después del evento, deja tu reseña 
                    para ayudar a otros clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-4" style={{ color: 'var(--navy-blue)' }}>
              ¿Qué servicios puedes encontrar?
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Todo lo que necesitas para tu evento en un solo lugar
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { icon: '🎵', name: 'Músicos' },
                { icon: '🎧', name: 'DJs' },
                { icon: '🎺', name: 'Bandas' },
                { icon: '🎸', name: 'Mariachis' },
                { icon: '📸', name: 'Fotógrafos' },
                { icon: '🍰', name: 'Catering' },
                { icon: '🎈', name: 'Decoración' },
                { icon: '🏛️', name: 'Salones' },
                { icon: '🎭', name: 'Animadores' },
                { icon: '🎩', name: 'Magos' },
                { icon: '💄', name: 'Maquillaje' },
                { icon: '🎥', name: 'Video' }
              ].map((service) => (
                <Card 
                  key={service.name}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <div className="text-sm text-gray-700">{service.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center mb-4" style={{ color: 'var(--navy-blue)' }}>
              Perfecto para cualquier tipo de evento
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Ya sea íntimo o multitudinario, tenemos los proveedores ideales
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-2" style={{ background: 'linear-gradient(90deg, var(--gold) 0%, var(--copper) 100%)' }} />
                <CardContent className="p-6">
                  <h3 className="mb-4" style={{ color: 'var(--navy-blue)' }}>Eventos Personales</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Bodas y Ceremonias
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Cumpleaños y Aniversarios
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Quinceañeras y XV Años
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Baby Showers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Fiestas Familiares
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-2" style={{ background: 'linear-gradient(90deg, var(--gold) 0%, var(--copper) 100%)' }} />
                <CardContent className="p-6">
                  <h3 className="mb-4" style={{ color: 'var(--navy-blue)' }}>Eventos Corporativos</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Conferencias y Seminarios
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Fiestas de Empresa
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Lanzamientos de Producto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Team Building
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      Reuniones de Negocios
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-12" style={{ color: 'var(--navy-blue)' }}>
              Lo que dicen nuestros clientes
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current" style={{ color: 'var(--gold)' }} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "Encontré el DJ perfecto para mi boda en minutos. El proceso fue súper 
                    fácil y el resultado superó nuestras expectativas. ¡Totalmente recomendado!"
                  </p>
                  <div>
                    <div className="text-gray-900">María Rodríguez</div>
                    <div className="text-sm text-gray-500">Boda en Caracas</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current" style={{ color: 'var(--gold)' }} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "Ver perfiles detallados y reseñas reales me dio mucha confianza. 
                    Contraté fotógrafo y decoración, ambos excelentes."
                  </p>
                  <div>
                    <div className="text-gray-900">Carlos Mendoza</div>
                    <div className="text-sm text-gray-500">Fiesta Corporativa en Valencia</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">
              ¿Listo para crear tu evento inolvidable?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Miles de proveedores verificados esperando para hacer realidad tu evento soñado
            </p>
            <Button 
              size="lg"
              style={{ 
                backgroundColor: 'var(--gold)',
                color: 'var(--navy-blue)'
              }}
              onClick={onGetStarted}
            >
              Explorar Servicios Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-white/60 text-sm mt-4">
              Gratis para siempre • Sin comisiones • Encuentra tu talento ideal
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
