import { useEffect } from 'react';
import { Music, Users, Target, Heart, Sparkles, TrendingUp, Shield, Award, CheckCircle, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface AboutPageProps {
  onGetStarted?: () => void;
  onClose?: () => void;
}

export function AboutPage({ onGetStarted, onClose }: AboutPageProps) {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--cream-white)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--navy-blue)' }}>
        {/* Close Button */}
        {onClose && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, var(--gold) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--copper) 0%, transparent 50%)',
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              <span className="text-sm" style={{ color: 'var(--gold)' }}>El inicio de lo inolvidable</span>
            </div>
            
            <h1 className="text-white mb-6">
              Sobre Memorialo
            </h1>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Somos la plataforma que conecta artistas talentosos con clientes que buscan hacer de sus eventos momentos memorables. Transformamos la forma en que se contratan servicios artísticos en Venezuela.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                <Target className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                <span className="text-sm" style={{ color: 'var(--navy-blue)' }}>Nuestra Misión</span>
              </div>
              
              <h2 className="mb-6" style={{ color: 'var(--navy-blue)' }}>
                Revolucionando la Contratación de Servicios para Eventos
              </h2>
              
              <p className="text-gray-700 mb-4 leading-relaxed">
                En Memorialo, creemos que encontrar el proveedor perfecto para tu evento no debería ser complicado. Hemos creado una plataforma que elimina la búsqueda interminable por WhatsApp y las llamadas sin respuesta.
              </p>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Nuestra misión es empoderar a músicos, DJs, animadores, fotógrafos, decoradores y todos los proveedores de servicios para eventos venezolanos, brindándoles las herramientas para que puedan mostrar su talento, gestionar sus servicios y hacer crecer sus negocios, mientras facilitamos a los clientes la búsqueda y contratación de los mejores proveedores para sus eventos especiales.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(10, 31, 68, 0.05)' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  <span className="text-sm">Transparente</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(10, 31, 68, 0.05)' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  <span className="text-sm">Confiable</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(10, 31, 68, 0.05)' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  <span className="text-sm">Eficiente</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1727831140213-18650ae7ef36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMGNvbmNlcnQlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjI3MjIzNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Músico en concierto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10, 31, 68, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)' }} />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl opacity-50" style={{ backgroundColor: 'var(--gold)' }} />
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl opacity-30" style={{ backgroundColor: 'var(--copper)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              El Problema que Resolvemos
            </h2>
            <p className="text-gray-700 text-lg">
              Transformamos un proceso caótico en una experiencia simple y profesional
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Antes */}
            <Card className="border-2" style={{ borderColor: 'rgba(220, 38, 38, 0.2)' }}>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                    <span className="text-3xl">😓</span>
                  </div>
                  <h3 className="text-red-600">Antes de Memorialo</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    <span className="text-gray-700">Búsqueda interminable de proveedores por WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    <span className="text-gray-700">Mensajes sin respuesta y llamadas perdidas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    <span className="text-gray-700">Imposible comparar precios y servicios fácilmente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    <span className="text-gray-700">Sin reseñas ni referencias confiables</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    <span className="text-gray-700">Gestión desorganizada de múltiples contratos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Después */}
            <Card className="border-2" style={{ borderColor: 'var(--gold)' }}>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
                    <span className="text-3xl">✨</span>
                  </div>
                  <h3 style={{ color: 'var(--navy-blue)' }}>Con Memorialo</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span className="text-gray-700">Busca proveedores en segundos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span className="text-gray-700">Comunicación directa y profesional</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span className="text-gray-700">Perfiles completos con precios transparentes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span className="text-gray-700">Sistema de reseñas y calificaciones verificadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span className="text-gray-700">Organiza todos tus eventos en un solo lugar</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>
              Nuestros Valores
            </h2>
            <p className="text-gray-700 text-lg">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
                  <Heart className="w-7 h-7" style={{ color: 'var(--navy-blue)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--navy-blue)' }}>Pasión</h3>
                <p className="text-sm text-gray-600">
                  Amamos la música y el arte, y trabajamos para que cada evento sea especial
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
                  <Shield className="w-7 h-7" style={{ color: 'var(--navy-blue)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--navy-blue)' }}>Confianza</h3>
                <p className="text-sm text-gray-600">
                  Construimos relaciones basadas en transparencia y honestidad
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
                  <TrendingUp className="w-7 h-7" style={{ color: 'var(--navy-blue)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--navy-blue)' }}>Innovación</h3>
                <p className="text-sm text-gray-600">
                  Mejoramos constantemente para ofrecer la mejor experiencia
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
                  <Award className="w-7 h-7" style={{ color: 'var(--navy-blue)' }} />
                </div>
                <h3 className="text-lg mb-2" style={{ color: 'var(--navy-blue)' }}>Excelencia</h3>
                <p className="text-sm text-gray-600">
                  Nos comprometemos con la calidad en cada detalle
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Artists & Clients Section */}
      <section className="py-16" style={{ backgroundColor: 'rgba(10, 31, 68, 0.03)' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Para Proveedores */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-3" style={{ background: 'linear-gradient(90deg, var(--gold) 0%, var(--copper) 100%)' }} />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
                    <Music className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                  </div>
                  <h3 style={{ color: 'var(--navy-blue)' }}>Para Proveedores</h3>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Memorialo es tu aliado para hacer crecer tu negocio. Te ofrecemos:
                </p>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Visibilidad Profesional</div>
                      <div className="text-sm text-gray-600">Perfil completo con fotos, videos y portafolio</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Gestión Simplificada</div>
                      <div className="text-sm text-gray-600">Panel de control para administrar reservas y servicios</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Más Clientes</div>
                      <div className="text-sm text-gray-600">Llega a personas que buscan exactamente tu talento</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Reputación Digital</div>
                      <div className="text-sm text-gray-600">Construye tu marca con reseñas y calificaciones</div>
                    </div>
                  </li>
                </ul>

                <Button 
                  className="w-full" 
                  style={{ 
                    backgroundColor: 'var(--navy-blue)',
                    color: 'white'
                  }}
                  onClick={onGetStarted}
                >
                  Únete como Proveedor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Para Clientes */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-3" style={{ background: 'linear-gradient(90deg, var(--gold) 0%, var(--copper) 100%)' }} />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
                    <Users className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                  </div>
                  <h3 style={{ color: 'var(--navy-blue)' }}>Para Clientes</h3>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Organiza eventos inolvidables con la mejor selección de proveedores venezolanos:
                </p>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Búsqueda Fácil</div>
                      <div className="text-sm text-gray-600">Filtra por ciudad, categoría y presupuesto</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Perfiles Detallados</div>
                      <div className="text-sm text-gray-600">Revisa fotos, videos y portafolios de cada proveedor</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Organización por Eventos</div>
                      <div className="text-sm text-gray-600">Agrupa todos tus servicios por evento</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <div>
                      <div className="text-gray-900 mb-1">Reseñas Reales</div>
                      <div className="text-sm text-gray-600">Toma decisiones informadas con opiniones verificadas</div>
                    </div>
                  </li>
                </ul>

                <Button 
                  className="w-full" 
                  style={{ 
                    backgroundColor: 'var(--gold)',
                    color: 'var(--navy-blue)'
                  }}
                  onClick={onGetStarted}
                >
                  Buscar Servicios
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">
              ¿Listo para Crear Momentos Inolvidables?
            </h2>
            
            <p className="text-xl text-white/80 mb-8">
              Únete a Memorialo y descubre una nueva forma de conectar artistas con eventos especiales
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
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={onGetStarted}
              >
                Explorar Artistas
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
