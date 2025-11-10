import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream-white)' }}>
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Política de Privacidad</h1>
          <p className="text-gray-600 mb-8">Última actualización: Noviembre 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Introducción</h2>
              <p className="text-gray-700 mb-4">
                En Memorialo, nos comprometemos a proteger tu privacidad y tus datos personales. Esta Política 
                de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos tu información cuando 
                utilizas nuestra plataforma.
              </p>
              <p className="text-gray-700">
                Al usar Memorialo, aceptas las prácticas descritas en esta Política de Privacidad.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Información que Recopilamos</h2>
              
              <h3 className="mb-3 text-gray-800">2.1 Información que Proporcionas</h3>
              <p className="text-gray-700 mb-4">Recopilamos información que nos proporcionas directamente:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Información de cuenta:</strong> Nombre, correo electrónico, contraseña, número de teléfono</li>
                <li><strong>Información de perfil:</strong> Foto de perfil, biografía, ubicación, preferencias</li>
                <li><strong>Información de pago:</strong> Datos de facturación y métodos de pago</li>
                <li><strong>Comunicaciones:</strong> Mensajes que envías a través de la plataforma</li>
                <li><strong>Reseñas y calificaciones:</strong> Comentarios y valoraciones sobre servicios</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.2 Información de Proveedores</h3>
              <p className="text-gray-700 mb-4">Los Proveedores proporcionan información adicional:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Información profesional y credenciales</li>
                <li>Portafolio de trabajos anteriores</li>
                <li>Disponibilidad y tarifas</li>
                <li>Documentación legal y permisos</li>
                <li>Información bancaria para pagos</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.3 Información Recopilada Automáticamente</h3>
              <p className="text-gray-700 mb-4">Cuando usas nuestra plataforma, recopilamos automáticamente:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Datos de uso:</strong> Páginas visitadas, funciones utilizadas, tiempo en la plataforma</li>
                <li><strong>Datos del dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador</li>
                <li><strong>Datos de ubicación:</strong> Dirección IP, ubicación geográfica aproximada</li>
                <li><strong>Cookies y tecnologías similares:</strong> Para mejorar tu experiencia</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.4 Información de Terceros</h3>
              <p className="text-gray-700">
                Podemos recibir información de terceros como redes sociales si eliges conectar tu cuenta, 
                o de proveedores de verificación de identidad y antecedentes.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Cómo Usamos tu Información</h2>
              <p className="text-gray-700 mb-4">Utilizamos tu información para:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Proporcionar servicios:</strong> Facilitar conexiones entre Clientes y Proveedores</li>
                <li><strong>Procesar transacciones:</strong> Gestionar pagos, reservas y contratos</li>
                <li><strong>Comunicación:</strong> Enviarte confirmaciones, actualizaciones y notificaciones</li>
                <li><strong>Seguridad:</strong> Verificar identidades, prevenir fraudes y abusos</li>
                <li><strong>Mejoras:</strong> Analizar el uso de la plataforma para mejorar servicios</li>
                <li><strong>Marketing:</strong> Enviarte promociones y ofertas (puedes cancelar suscripción)</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y regulatorias</li>
                <li><strong>Soporte:</strong> Responder a tus consultas y resolver problemas</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Compartir tu Información</h2>
              
              <h3 className="mb-3 text-gray-800">4.1 Con Otros Usuarios</h3>
              <p className="text-gray-700 mb-4">
                Compartimos información de perfil entre Clientes y Proveedores para facilitar transacciones. 
                Los Proveedores pueden ver información de contacto de Clientes cuando aceptan una reserva, 
                y viceversa.
              </p>

              <h3 className="mb-3 text-gray-800">4.2 Con Proveedores de Servicios</h3>
              <p className="text-gray-700 mb-4">
                Compartimos información con terceros que nos ayudan a operar la plataforma:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Procesadores de pagos</li>
                <li>Servicios de hosting y almacenamiento en la nube</li>
                <li>Servicios de análisis y marketing</li>
                <li>Servicios de verificación de identidad</li>
                <li>Servicios de atención al cliente</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.3 Por Razones Legales</h3>
              <p className="text-gray-700 mb-4">
                Podemos compartir información cuando sea necesario para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Cumplir con leyes, regulaciones o procesos legales</li>
                <li>Hacer cumplir nuestros Términos y Condiciones</li>
                <li>Proteger los derechos, propiedad y seguridad de Memorialo y sus usuarios</li>
                <li>Prevenir fraude o actividades ilegales</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.4 Transferencias Comerciales</h3>
              <p className="text-gray-700">
                En caso de fusión, adquisición o venta de activos, tu información puede ser transferida 
                a la entidad sucesora.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Seguridad de los Datos</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tu información:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Controles de acceso estrictos</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>
              <p className="text-gray-700">
                Sin embargo, ningún sistema es completamente seguro. Te recomendamos usar contraseñas fuertes 
                y mantener tu información de inicio de sesión confidencial.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Retención de Datos</h2>
              <p className="text-gray-700">
                Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para 
                proporcionar servicios, cumplir con obligaciones legales, resolver disputas y hacer cumplir 
                nuestros acuerdos. Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información, 
                excepto cuando estemos obligados a conservarla por ley.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Tus Derechos y Opciones</h2>
              <p className="text-gray-700 mb-4">Tienes derecho a:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Acceder:</strong> Solicitar una copia de tu información personal</li>
                <li><strong>Rectificar:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminar:</strong> Solicitar la eliminación de tu cuenta e información</li>
                <li><strong>Portabilidad:</strong> Recibir tu información en formato estructurado</li>
                <li><strong>Oponerte:</strong> Rechazar ciertos usos de tu información</li>
                <li><strong>Cancelar suscripción:</strong> Dejar de recibir comunicaciones de marketing</li>
                <li><strong>Gestionar cookies:</strong> Controlar cookies a través de tu navegador</li>
              </ul>
              <p className="text-gray-700">
                Para ejercer estos derechos, contáctanos en contacto@memorialo.com
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Cookies y Tecnologías de Rastreo</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Mantener tu sesión iniciada</li>
                <li>Recordar tus preferencias</li>
                <li>Entender cómo usas la plataforma</li>
                <li>Personalizar contenido y anuncios</li>
                <li>Medir el rendimiento de campañas</li>
              </ul>
              <p className="text-gray-700">
                Puedes gestionar las cookies a través de la configuración de tu navegador, pero esto 
                puede afectar algunas funcionalidades de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>9. Menores de Edad</h2>
              <p className="text-gray-700">
                Memorialo no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
                de menores. Si descubres que un menor ha proporcionado información, contáctanos inmediatamente 
                para que podamos eliminarla.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>10. Transferencias Internacionales</h2>
              <p className="text-gray-700">
                Tu información puede ser transferida y procesada en países diferentes a tu país de residencia. 
                Tomamos medidas para garantizar que tu información reciba un nivel adecuado de protección 
                independientemente de dónde se procese.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>11. Cambios a esta Política</h2>
              <p className="text-gray-700">
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios 
                significativos publicando la nueva política en la plataforma y actualizando la fecha de "Última 
                actualización". Te recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>12. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tienes preguntas sobre esta Política de Privacidad o quieres ejercer tus derechos, contáctanos:
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> contacto@memorialo.com<br />
                <strong>Ubicación:</strong> Venezuela
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
