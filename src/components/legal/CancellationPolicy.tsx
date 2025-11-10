import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface CancellationPolicyProps {
  onBack: () => void;
}

export function CancellationPolicy({ onBack }: CancellationPolicyProps) {
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
          <h1 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Política de Cancelación</h1>
          <p className="text-gray-600 mb-8">Última actualización: Noviembre 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Introducción</h2>
              <p className="text-gray-700">
                Esta Política de Cancelación establece las reglas y procedimientos para cancelar reservas 
                en Memorialo. Es importante que tanto Clientes como Proveedores comprendan estas políticas 
                antes de realizar o aceptar una reserva.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Cancelación por Parte del Cliente</h2>
              
              <h3 className="mb-3 text-gray-800">2.1 Política Flexible (Más de 7 días de anticipación)</h3>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Cancelación con más de 7 días antes del evento:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Reembolso del 100% del monto pagado</li>
                  <li>Sin penalizaciones</li>
                  <li>Comisión de Memorialo no reembolsable</li>
                </ul>
              </div>

              <h3 className="mb-3 text-gray-800">2.2 Política Moderada (3-7 días de anticipación)</h3>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Cancelación entre 3 y 7 días antes del evento:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Reembolso del 50% del monto pagado</li>
                  <li>El Proveedor retiene el 50% como compensación</li>
                  <li>Comisión de Memorialo no reembolsable</li>
                </ul>
              </div>

              <h3 className="mb-3 text-gray-800">2.3 Política Estricta (Menos de 3 días)</h3>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Cancelación con menos de 3 días antes del evento:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Sin reembolso</li>
                  <li>El Proveedor retiene el 100% del pago</li>
                  <li>Aplica también para no-shows (no presentarse al evento)</li>
                </ul>
              </div>

              <h3 className="mb-3 text-gray-800">2.4 Circunstancias Especiales</h3>
              <p className="text-gray-700 mb-4">
                En casos excepcionales, se pueden considerar cancelaciones fuera de estas políticas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Emergencias médicas:</strong> Con documentación médica certificada</li>
                <li><strong>Fallecimiento:</strong> De familiar directo con acta de defunción</li>
                <li><strong>Desastres naturales:</strong> Que impidan la realización del evento</li>
                <li><strong>Orden gubernamental:</strong> Que prohiba eventos o reuniones</li>
              </ul>
              <p className="text-gray-700">
                Estos casos se evalúan individualmente y requieren documentación comprobatoria.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Cancelación por Parte del Proveedor</h2>
              
              <h3 className="mb-3 text-gray-800">3.1 Penalizaciones por Cancelación</h3>
              <p className="text-gray-700 mb-4">
                Los Proveedores que cancelen una reserva confirmada enfrentan las siguientes consecuencias:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Reembolso completo:</strong> El Cliente recibe el 100% de su pago de vuelta</li>
                <li><strong>Penalización económica:</strong> El Proveedor paga una multa del 20% del valor del servicio</li>
                <li><strong>Impacto en reputación:</strong> La cancelación se registra en su perfil</li>
                <li><strong>Suspensión temporal:</strong> Después de 3 cancelaciones en 6 meses</li>
                <li><strong>Pérdida de verificación:</strong> En casos de cancelaciones frecuentes</li>
              </ul>

              <h3 className="mb-3 text-gray-800">3.2 Cancelaciones Justificadas</h3>
              <p className="text-gray-700 mb-4">
                Los Proveedores pueden cancelar sin penalización en estos casos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Emergencia médica:</strong> Personal o familiar directo</li>
                <li><strong>Daño de equipo:</strong> Imposibilidad de reemplazar equipo esencial</li>
                <li><strong>Caso fortuito:</strong> Eventos fuera de control del proveedor</li>
                <li><strong>Violación del cliente:</strong> Si el cliente viola términos o código de conducta</li>
              </ul>
              <p className="text-gray-700">
                Se requiere notificación inmediata y documentación comprobatoria.
              </p>

              <h3 className="mb-3 text-gray-800">3.3 Obligación de Sustitución</h3>
              <p className="text-gray-700">
                Cuando sea posible, el Proveedor debe intentar proporcionar un sustituto de calidad comparable. 
                Si el Cliente acepta el sustituto, no se aplicarán penalizaciones.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Proceso de Cancelación</h2>
              
              <h3 className="mb-3 text-gray-800">4.1 Cómo Cancelar</h3>
              <p className="text-gray-700 mb-4">Para cancelar una reserva:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Inicia sesión en tu cuenta de Memorialo</li>
                <li>Ve a "Mis Reservas" (Clientes) o "Mi Negocio" (Proveedores)</li>
                <li>Encuentra la reserva que deseas cancelar</li>
                <li>Haz clic en "Cancelar Reserva"</li>
                <li>Selecciona el motivo de cancelación</li>
                <li>Proporciona detalles adicionales si es necesario</li>
                <li>Confirma la cancelación</li>
              </ol>

              <h3 className="mb-3 text-gray-800">4.2 Notificaciones</h3>
              <p className="text-gray-700">
                Ambas partes recibirán notificaciones inmediatas por correo electrónico y en la plataforma 
                cuando se realice una cancelación.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Reembolsos</h2>
              <p className="text-gray-700 mb-4">
                Los reembolsos aprobados se procesan de la siguiente manera:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Tiempo de procesamiento:</strong> 5-10 días hábiles</li>
                <li><strong>Método:</strong> Al mismo método de pago original</li>
                <li><strong>Notificación:</strong> Recibirás confirmación por correo electrónico</li>
                <li><strong>Consultas:</strong> Contacta a soporte si no recibes el reembolso en 15 días</li>
              </ul>
              <p className="text-gray-700">
                Los tiempos pueden variar según tu institución financiera.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Modificación de Reservas</h2>
              <p className="text-gray-700 mb-4">
                En lugar de cancelar, puedes intentar modificar tu reserva:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Cambio de fecha:</strong> Sujeto a disponibilidad del Proveedor</li>
                <li><strong>Cambio de servicio:</strong> Puede implicar ajuste de precio</li>
                <li><strong>Duración:</strong> Extensión o reducción del tiempo contratado</li>
              </ul>
              <p className="text-gray-700">
                Las modificaciones requieren aceptación de ambas partes y pueden estar sujetas a cargos adicionales.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Disputas</h2>
              <p className="text-gray-700 mb-4">
                Si hay desacuerdo sobre una cancelación:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Intenta resolver directamente con la otra parte</li>
                <li>Si no se resuelve, contacta al equipo de soporte de Memorialo</li>
                <li>Proporciona toda la documentación relevante</li>
                <li>El equipo de Memorialo mediará y tomará una decisión final</li>
              </ol>
              <p className="text-gray-700">
                Las decisiones de Memorialo en casos de disputa son finales y vinculantes.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Recomendaciones</h2>
              
              <h3 className="mb-3 text-gray-800">Para Clientes:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Reserva con suficiente anticipación para evitar prisas</li>
                <li>Revisa cuidadosamente las fechas antes de confirmar</li>
                <li>Considera contratar un seguro de eventos para coberturas adicionales</li>
                <li>Comunica cualquier duda o cambio lo antes posible</li>
                <li>Mantén toda la comunicación dentro de la plataforma</li>
              </ul>

              <h3 className="mb-3 text-gray-800">Para Proveedores:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Mantén tu calendario actualizado para evitar conflictos</li>
                <li>No aceptes reservas si no estás seguro de tu disponibilidad</li>
                <li>Establece recordatorios para todas tus reservas</li>
                <li>Ten planes de contingencia para emergencias</li>
                <li>Construye una red de sustitutos confiables</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>9. Contacto</h2>
              <p className="text-gray-700">
                Para preguntas sobre cancelaciones o para solicitar asistencia:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email:</strong> contacto@memorialo.com<br />
                <strong>Soporte:</strong> Disponible en tu panel de control<br />
                <strong>Ubicación:</strong> Venezuela
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
