import { Music, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

interface FooterProps {
  onAboutClick?: () => void;
  onHowItWorksClick?: () => void;
  onForProvidersClick?: () => void;
  onForClientsClick?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onCancellationClick?: () => void;
  onRefundClick?: () => void;
  onConductClick?: () => void;
}

export function Footer({ 
  onAboutClick,
  onHowItWorksClick,
  onForProvidersClick, 
  onForClientsClick,
  onTermsClick,
  onPrivacyClick,
  onCancellationClick,
  onRefundClick,
  onConductClick
}: FooterProps = {}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: 'var(--navy-blue)', color: 'white' }}>
      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative" style={{ width: '40px', height: '40px' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#footerLogoGradient)" />
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
                <h3 className="font-bold">Memorialo</h3>
                <p className="text-xs opacity-80">El inicio de lo inolvidable</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Desde espacios únicos hasta el mejor talento, todo lo que necesitas para crear momentos memorables.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: 'var(--gold)' }}>Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={onAboutClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Sobre Nosotros
                </button>
              </li>
              <li>
                <button
                  onClick={onHowItWorksClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Cómo Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={onForProvidersClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Para Proveedores
                </button>
              </li>
              <li>
                <button 
                  onClick={onForClientsClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Para Clientes
                </button>
              </li>
              <li className="hidden">
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: 'var(--gold)' }}>Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={onTermsClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <button
                  onClick={onPrivacyClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button
                  onClick={onCancellationClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Política de Cancelación
                </button>
              </li>
              <li>
                <button
                  onClick={onRefundClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Política de Reembolso
                </button>
              </li>
              <li>
                <button
                  onClick={onConductClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer bg-transparent border-none p-0 text-inherit"
                >
                  Código de Conducta
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4" style={{ color: 'var(--gold)' }}>Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <span className="opacity-80">contacto@memorialo.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <span className="opacity-80">Venezuela</span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-6">
              <h5 className="font-bold mb-3 text-sm" style={{ color: 'var(--gold)' }}>Síguenos</h5>
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/profile.php?id=61584748781154"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                </a>
                <a 
                  href="https://instagram.com/memorialo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                </a>
                <a 
                  href="#" 
                  className="hidden w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                </a>
                <a 
                  href="#" 
                  className="hidden w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-80">
            <p>
              © {currentYear} Memorialo. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              <span>Hecho con pasión para proveedores y eventos inolvidables</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
