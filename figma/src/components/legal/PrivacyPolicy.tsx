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
          <p className="text-gray-600 mb-8">Última actualización: Marzo 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Introducción</h2>
              <p className="text-gray-700 mb-4">
                En Memorialo, nos comprometemos a proteger tu privacidad. Esta política detalla cómo gestionamos tu
                información, especialmente ahora que nuestra plataforma actúa como un conector logístico y de
                curaduría para tus eventos.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Información que Recopilamos</h2>

              <h3 className="mb-3 text-gray-800">2.1 Información de Registro y Verificación (Curaduría)</h3>
              <p className="text-gray-700 mb-4">Para garantizar la seguridad del ecosistema, recopilamos:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Clientes:</strong> Nombre, correo, teléfono y ubicación.</li>
                <li><strong>Proveedores:</strong> Además de lo anterior, solicitamos documentación profesional, copias de identificación (cédulas), certificados y portafolios para nuestro proceso de curaduría y validación de perfiles.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.2 Información de Transacciones Directas</h3>
              <p className="text-gray-700 mb-4">Dado que los pagos se realizan directamente entre las partes:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Memorialo NO recopila ni almacena números de tarjetas de crédito, claves bancarias o datos de acceso a pasarelas de pago de las transacciones de los servicios contratados.</li>
                <li>Sin embargo, podemos registrar el monto acordado y la tasa BCV aplicada al momento del acuerdo para fines de historial, soporte en disputas y cálculo de comisiones de la plataforma.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.3 Comunicaciones y Recordatorios</h3>
              <p className="text-gray-700">
                Almacenamos los registros de los mensajes internos y los envíos de los recordatorios de 48 horas para
                asegurar el cumplimiento del servicio y tener evidencia en caso de reclamos.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Cómo Usamos tu Información</h2>
              <p className="text-gray-700 mb-4">Utilizamos tus datos para:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Validación:</strong> Ejecutar el proceso de curaduría de proveedores.</li>
                <li><strong>Gestión Logística:</strong> Enviar las notificaciones de recordatorio 48 horas antes de la fecha del evento acordada.</li>
                <li><strong>Conexión:</strong> Facilitar que el Cliente y el Proveedor intercambien sus métodos de pago directos (Pago Móvil, transferencias, etc.).</li>
                <li><strong>Seguridad:</strong> Atender solicitudes de Notificación y Retirada (Notice and Takedown) en caso de infracciones de propiedad intelectual.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Compartir tu Información</h2>

              <h3 className="mb-3 text-gray-800">4.1 Entre Usuarios</h3>
              <p className="text-gray-700 mb-4">
                Para concretar el servicio, una vez aceptado el presupuesto, Memorialo compartirá la información de
                contacto necesaria para que las partes coordinen el pago directo y los detalles logísticos del evento.
              </p>

              <h3 className="mb-3 text-gray-800">4.2 Por Razones Legales e Identidad</h3>
              <p className="text-gray-700">
                En caso de una denuncia por el servicio prestado o una infracción de derechos de autor, Memorialo podrá
                compartir información básica del Proveedor con el tercero afectado, conforme a nuestra cláusula de
                Indemnización y Notificación y Retirada.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Seguridad de los Datos</h2>
              <p className="text-gray-700 mb-4">Como desarrolladores de la plataforma, aplicamos:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Encriptación en el tránsito de datos (SSL/TLS).</li>
                <li>Protocolos de seguridad para proteger los documentos de identidad subidos por los proveedores durante la fase de curaduría.</li>
              </ul>
              <p className="text-gray-700">
                <strong>Nota Técnica:</strong> Aunque aplicamos nuestros mejores esfuerzos técnicos, el usuario reconoce
                la naturaleza abierta de internet y los factores externos mencionados en los Términos y Condiciones
                (Sección 8.3).
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Retención de Datos</h2>
              <p className="text-gray-700 mb-4">
                Conservamos la información de los acuerdos y mensajes incluso después de finalizado el evento por un
                período razonable, para servir como soporte ante posibles auditorías fiscales (por la tasa BCV
                aplicada) o reclamos legales entre las partes.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Si tienes preguntas sobre esta Política de Privacidad, contáctanos:
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
