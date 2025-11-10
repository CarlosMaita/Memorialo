import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface RefundPolicyProps {
  onBack: () => void;
}

export function RefundPolicy({ onBack }: RefundPolicyProps) {
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
          <h1 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Política de Reembolso</h1>
          <p className="text-gray-600 mb-8">Última actualización: Noviembre 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Introducción</h2>
              <p className="text-gray-700">
                Esta Política de Reembolso complementa nuestra Política de Cancelación y establece los 
                procedimientos y condiciones bajo las cuales los Clientes pueden recibir reembolsos por 
                servicios contratados a través de Memorialo.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Elegibilidad para Reembolsos</h2>
              
              <h3 className="mb-3 text-gray-800">2.1 Cancelaciones Anticipadas</h3>
              <p className="text-gray-700 mb-4">
                Los reembolsos por cancelación se rigen por nuestra Política de Cancelación:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Más de 7 días:</strong> 100% de reembolso del costo del servicio</li>
                <li><strong>3-7 días:</strong> 50% de reembolso del costo del servicio</li>
                <li><strong>Menos de 3 días:</strong> Sin reembolso</li>
              </ul>
              <p className="text-gray-700">
                <em>Nota: La comisión de servicio de Memorialo no es reembolsable en ningún caso.</em>
              </p>

              <h3 className="mb-3 text-gray-800">2.2 Servicio No Prestado</h3>
              <p className="text-gray-700 mb-4">
                Tienes derecho a reembolso completo (100%) si:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>El Proveedor no se presenta al evento sin aviso previo</li>
                <li>El Proveedor cancela el día del evento</li>
                <li>El Proveedor llega más de 2 horas tarde sin justificación</li>
                <li>El servicio contratado no puede ser prestado por culpa del Proveedor</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Reembolsos por Calidad del Servicio</h2>
              
              <h3 className="mb-3 text-gray-800">3.1 Servicio Insatisfactorio</h3>
              <p className="text-gray-700 mb-4">
                Si el servicio prestado no cumple con lo acordado, puedes solicitar reembolso parcial o total:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Servicio significativamente diferente:</strong> Hasta 100% de reembolso</li>
                <li><strong>Calidad inferior a lo prometido:</strong> Hasta 75% de reembolso</li>
                <li><strong>Incumplimiento parcial:</strong> Hasta 50% de reembolso</li>
                <li><strong>Problemas menores:</strong> Hasta 25% de reembolso</li>
              </ul>

              <h3 className="mb-3 text-gray-800">3.2 Requisitos para Solicitud</h3>
              <p className="text-gray-700 mb-4">
                Para solicitar reembolso por calidad del servicio, debes:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Notificar el problema durante o inmediatamente después del evento</li>
                <li>Proporcionar evidencia (fotos, videos, mensajes, testimonios)</li>
                <li>Presentar la solicitud dentro de 48 horas después del evento</li>
                <li>Cooperar con la investigación de Memorialo</li>
              </ol>

              <h3 className="mb-3 text-gray-800">3.3 Casos que NO Califican</h3>
              <p className="text-gray-700 mb-4">
                No se otorgan reembolsos por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Preferencias personales o cambio de opinión</li>
                <li>Problemas causados por el Cliente o sus invitados</li>
                <li>Condiciones climáticas o eventos fuera del control del Proveedor</li>
                <li>Expectativas no comunicadas previamente al Proveedor</li>
                <li>Problemas menores que no afectan sustancialmente el servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Reembolsos por Cancelación del Proveedor</h2>
              <p className="text-gray-700 mb-4">
                Cuando un Proveedor cancela una reserva confirmada:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Reembolso:</strong> 100% del pago realizado (incluyendo comisión de Memorialo)</li>
                <li><strong>Compensación adicional:</strong> Crédito del 10% para futuras reservas</li>
                <li><strong>Asistencia:</strong> Ayuda prioritaria para encontrar un reemplazo</li>
                <li><strong>Tiempo de procesamiento:</strong> Inmediato (1-3 días hábiles)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Proceso de Solicitud de Reembolso</h2>
              
              <h3 className="mb-3 text-gray-800">5.1 Pasos para Solicitar</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Inicia sesión en tu cuenta de Memorialo</li>
                <li>Ve a "Mis Reservas"</li>
                <li>Selecciona la reserva correspondiente</li>
                <li>Haz clic en "Solicitar Reembolso"</li>
                <li>Completa el formulario detallando el motivo</li>
                <li>Adjunta toda la evidencia relevante</li>
                <li>Envía la solicitud</li>
              </ol>

              <h3 className="mb-3 text-gray-800">5.2 Tiempos de Respuesta</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Cancelaciones simples:</strong> Respuesta automática inmediata</li>
                <li><strong>Casos con evidencia clara:</strong> 2-3 días hábiles</li>
                <li><strong>Casos complejos:</strong> 5-7 días hábiles</li>
                <li><strong>Casos en disputa:</strong> Hasta 14 días hábiles</li>
              </ul>

              <h3 className="mb-3 text-gray-800">5.3 Información Requerida</h3>
              <p className="text-gray-700 mb-4">
                Para procesar tu solicitud eficientemente, proporciona:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Número de reserva</li>
                <li>Fecha del evento</li>
                <li>Descripción detallada del problema</li>
                <li>Fotos o videos que documenten el problema</li>
                <li>Capturas de conversaciones relevantes</li>
                <li>Testimonios de testigos (si aplica)</li>
                <li>Cualquier otra evidencia relevante</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Métodos y Tiempos de Reembolso</h2>
              
              <h3 className="mb-3 text-gray-800">6.1 Métodos de Reembolso</h3>
              <p className="text-gray-700 mb-4">
                Los reembolsos se procesan mediante:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Método de pago original:</strong> Preferido y más rápido</li>
                <li><strong>Crédito en la plataforma:</strong> Disponible inmediatamente</li>
                <li><strong>Transferencia bancaria:</strong> Solo en casos especiales</li>
              </ul>

              <h3 className="mb-3 text-gray-800">6.2 Tiempos de Procesamiento</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2"><strong>Una vez aprobado el reembolso:</strong></p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Tarjeta de crédito/débito:</strong> 5-10 días hábiles</li>
                  <li><strong>PayPal o billeteras digitales:</strong> 3-5 días hábiles</li>
                  <li><strong>Transferencia bancaria:</strong> 7-14 días hábiles</li>
                  <li><strong>Crédito en plataforma:</strong> Inmediato</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Los tiempos pueden variar según tu institución financiera.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Reembolsos Parciales</h2>
              <p className="text-gray-700 mb-4">
                En algunos casos, puede otorgarse un reembolso parcial:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Servicio parcialmente completado:</strong> Proporcional al trabajo realizado</li>
                <li><strong>Modificación de último minuto:</strong> Por cambios solicitados por el Cliente</li>
                <li><strong>Resolución amistosa:</strong> Acordada entre Cliente y Proveedor</li>
                <li><strong>Compensación por inconvenientes:</strong> A discreción de Memorialo</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Disputas y Apelaciones</h2>
              
              <h3 className="mb-3 text-gray-800">8.1 Resolución de Disputas</h3>
              <p className="text-gray-700 mb-4">
                Si no estás de acuerdo con la decisión sobre tu reembolso:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Revisa la explicación proporcionada en la respuesta</li>
                <li>Si tienes información adicional, contáctanos con evidencia nueva</li>
                <li>Solicita una revisión de tu caso</li>
                <li>Un supervisor revisará tu caso independientemente</li>
              </ol>

              <h3 className="mb-3 text-gray-800">8.2 Mediación</h3>
              <p className="text-gray-700">
                Memorialo puede ofrecer mediación entre Cliente y Proveedor para llegar a una resolución 
                satisfactoria para ambas partes. Las decisiones de mediación son finales y vinculantes.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>9. Reembolsos por Circunstancias Excepcionales</h2>
              <p className="text-gray-700 mb-4">
                En situaciones extraordinarias, consideramos reembolsos especiales:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Emergencias médicas:</strong> Con certificación médica</li>
                <li><strong>Fallecimientos:</strong> Con acta de defunción</li>
                <li><strong>Desastres naturales:</strong> Declarados oficialmente</li>
                <li><strong>Restricciones gubernamentales:</strong> Órdenes de autoridades</li>
                <li><strong>Pandemias:</strong> Según declaraciones de salud pública</li>
              </ul>
              <p className="text-gray-700">
                Estos casos se evalúan individualmente y requieren documentación oficial.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>10. Prevención de Fraude</h2>
              <p className="text-gray-700 mb-4">
                Para proteger a todos los usuarios:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Verificamos todas las solicitudes de reembolso</li>
                <li>Podemos solicitar documentación adicional</li>
                <li>Investigamos patrones sospechosos</li>
                <li>Las solicitudes fraudulentas resultan en suspensión de cuenta</li>
                <li>Nos reservamos el derecho de rechazar reembolsos por fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>11. Créditos de la Plataforma</h2>
              <p className="text-gray-700 mb-4">
                Como alternativa al reembolso monetario, ofrecemos créditos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Ventajas:</strong> Disponibles inmediatamente, sin espera de procesamiento</li>
                <li><strong>Bonificación:</strong> 10% adicional sobre el monto del reembolso</li>
                <li><strong>Validez:</strong> 12 meses desde la emisión</li>
                <li><strong>Uso:</strong> En cualquier servicio de la plataforma</li>
                <li><strong>Transferencia:</strong> No transferibles a otras cuentas</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>12. Seguimiento de tu Reembolso</h2>
              <p className="text-gray-700 mb-4">
                Puedes rastrear el estado de tu reembolso:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>En tu panel de control bajo "Transacciones"</li>
                <li>Recibirás notificaciones por correo electrónico en cada etapa</li>
                <li>Puedes contactar a soporte para actualizaciones</li>
              </ul>
              <p className="text-gray-700">
                Mantén tu información de contacto actualizada para recibir notificaciones importantes.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>13. Contacto</h2>
              <p className="text-gray-700">
                Para preguntas sobre reembolsos o para solicitar asistencia:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email:</strong> contacto@memorialo.com<br />
                <strong>Soporte:</strong> Disponible 24/7 en tu panel de control<br />
                <strong>Ubicación:</strong> Venezuela
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
