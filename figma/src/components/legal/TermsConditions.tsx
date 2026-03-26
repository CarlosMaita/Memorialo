import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface TermsConditionsProps {
  onBack: () => void;
}

export function TermsConditions({ onBack }: TermsConditionsProps) {
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
          <h1 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Términos y Condiciones</h1>
          <p className="text-gray-600 mb-8">Última actualización: Marzo 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar Memorialo ("la Plataforma"), aceptas estar sujeto a estos Términos y Condiciones. 
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.
              </p>
              <p className="text-gray-700">
                Memorialo es un marketplace que conecta a proveedores de servicios para eventos (artistas, músicos, DJs, 
                animadores, mariachis, fotógrafos, y alquiler de salones) con clientes que buscan contratar estos servicios.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Definiciones</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Usuario:</strong> Cualquier persona que acceda o utilice la Plataforma</li>
                <li><strong>Cliente:</strong> Usuario que busca y contrata servicios a través de la Plataforma</li>
                <li><strong>Proveedor:</strong> Usuario que ofrece servicios profesionales a través de la Plataforma</li>
                <li><strong>Servicio:</strong> Cualquier servicio ofrecido por un Proveedor en la Plataforma</li>
                <li><strong>Contrato:</strong> Acuerdo entre un Cliente y un Proveedor para la prestación de un Servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Registro y Cuenta de Usuario</h2>
              <h3 className="mb-3 text-gray-800">3.1 Requisitos de Registro</h3>
              <p className="text-gray-700 mb-4">
                Para utilizar ciertas funciones de la Plataforma, debes crear una cuenta. Al registrarte, garantizas que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Eres mayor de 18 años o tienes el consentimiento de tus padres o tutores legales</li>
                <li>Toda la información proporcionada es verdadera, precisa y actualizada</li>
                <li>Mantendrás la seguridad de tu contraseña y cuenta</li>
                <li>Notificarás inmediatamente cualquier uso no autorizado de tu cuenta</li>
              </ul>
              
              <h3 className="mb-3 text-gray-800">3.2 Cuentas de Proveedores</h3>
              <p className="text-gray-700">
                Los Proveedores deben proporcionar información adicional incluyendo documentación profesional, 
                certificados, permisos necesarios y referencias verificables. Memorialo se reserva el derecho de 
                verificar esta información y aprobar o rechazar solicitudes de registro de Proveedores.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Uso de la Plataforma</h2>
              <h3 className="mb-3 text-gray-800">4.1 Para Clientes</h3>
              <p className="text-gray-700 mb-4">Los Clientes pueden:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Buscar Proveedores de servicios</li>
                <li>Ver perfiles, precios y reseñas de Proveedores</li>
                <li>Contactar y contratar Proveedores</li>
                <li>Dejar reseñas sobre los servicios recibidos</li>
                <li>Gestionar sus reservas y contratos</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.2 Para Proveedores</h3>
              <p className="text-gray-700 mb-4">Los Proveedores pueden:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Crear y gestionar perfiles profesionales</li>
                <li>Publicar servicios con descripciones, precios y disponibilidad</li>
                <li>Responder a solicitudes de clientes</li>
                <li>Gestionar contratos y reservas</li>
                <li>Recibir pagos por servicios prestados</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.3 Conducta Prohibida</h3>
              <p className="text-gray-700 mb-4">Los Usuarios NO pueden:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Proporcionar información falsa o engañosa</li>
                <li>Utilizar la Plataforma para actividades ilegales</li>
                <li>Acosar, amenazar o discriminar a otros usuarios</li>
                <li>Intentar evadir las comisiones de la Plataforma realizando transacciones fuera de ella</li>
                <li>Copiar, modificar o distribuir contenido de la Plataforma sin autorización</li>
                <li>Interferir con el funcionamiento normal de la Plataforma</li>
                <li>Crear múltiples cuentas para evadir restricciones</li>
              </ul>

              <h3 className="mb-3 mt-6 text-gray-800">4.4 Obligación de Indemnización del Proveedor</h3>
              <p className="text-gray-700">
                El Proveedor se compromete a mantener indemne a Memorialo, sus directivos y empleados, frente a
                cualquier reclamación, demanda, pérdida, responsabilidad o gasto (incluyendo honorarios de abogados)
                que surja de: (i) el incumplimiento de los servicios contratados por el Cliente; (ii) cualquier daño
                causado a terceros durante la prestación del servicio; o (iii) el uso de material (fotos, música,
                logos) que infrinja derechos de propiedad intelectual de terceros.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Condiciones de Pago y Precios</h2>
              <h3 className="mb-3 text-gray-800">5.1 Modalidad de Pago Directo</h3>
              <p className="text-gray-700 mb-4">
                Memorialo actúa exclusivamente como un punto de encuentro y gestión. Los pagos por los Servicios
                se realizan directamente entre el Cliente y el Proveedor utilizando los métodos de pago
                (transferencias, pago móvil, efectivo, etc.) que ambas partes acuerden de forma privada.
              </p>

              <h3 className="mb-3 text-gray-800">5.2 Ausencia de Retención</h3>
              <p className="text-gray-700 mb-4">
                La Plataforma no interviene en el flujo de dinero ni realiza retención de pagos de ningún tipo.
                Memorialo no es responsable por retrasos, reversiones de pago o falta de cumplimiento financiero por
                ninguna de las partes.
              </p>

              <h3 className="mb-3 text-gray-800">5.3 Referencia Cambiaria (Tasa BCV)</h3>
              <p className="text-gray-700">
                Todos los precios publicados o acordados dentro de la plataforma, cuando estén expresados en moneda
                extranjera y deban ser liquidados en moneda nacional, se calcularán de acuerdo con la tasa oficial del
                Banco Central de Venezuela (BCV) vigente al día y hora exacta en que se realice el pago.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Cancelaciones y Reembolsos</h2>
              <p className="text-gray-700 mb-4">
                Las políticas de cancelación y reembolso están detalladas en nuestra Política de Cancelación 
                y Política de Reembolso. Te recomendamos leerlas cuidadosamente antes de contratar servicios.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Propiedad Intelectual</h2>
              <h3 className="mb-3 text-gray-800">7.1 Titularidad de la Plataforma</h3>
              <p className="text-gray-700 mb-4">
                Todo el contenido de la Plataforma, incluyendo texto, gráficos, logos, imágenes y software, 
                es propiedad de Memorialo o sus licenciantes y está protegido por leyes de propiedad intelectual.
              </p>

              <h3 className="mb-3 text-gray-800">7.2 Contenido de Proveedores</h3>
              <p className="text-gray-700 mb-4">
                Los Proveedores mantienen la propiedad de su contenido pero otorgan a Memorialo una licencia 
                para usar, mostrar y promocionar dicho contenido en la Plataforma.
              </p>

              <h3 className="mb-3 text-gray-800">7.3 Política de "Notificación y Retirada" (Notice and Takedown)</h3>
              <p className="text-gray-700 mb-4">
                Memorialo respeta los derechos de autor. Si cualquier tercero considera que el contenido publicado
                por un Proveedor infringe sus derechos de propiedad intelectual, puede enviar una notificación formal
                a legal@memorialo.com incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Identificación del contenido infractor.</li>
                <li>Prueba de titularidad del derecho afectado.</li>
                <li>Datos de contacto del reclamante.</li>
              </ul>
              <p className="text-gray-700">
                Una vez recibida la notificación válida, Memorialo procederá a la retirada inmediata del contenido
                en un plazo máximo de 24 a 48 horas hábiles, notificando al Proveedor responsable para que ejerza
                su derecho a réplica si correspondiera.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Limitación de Responsabilidad y Proceso de Curaduría</h2>

              <h3 className="mb-3 text-gray-800">8.1 Proceso de Selección (Curaduría)</h3>
              <p className="text-gray-700 mb-4">
                Memorialo realiza un proceso razonable de curación, revisión de perfiles y validación de la
                información proporcionada por los Proveedores con el fin de mantener estándares de calidad en la
                Plataforma. Este proceso incluye la verificación de identidad y, en algunos casos, la revisión de
                portafolios o referencias previas.
              </p>

              <h3 className="mb-3 text-gray-800">8.2 Exención de Responsabilidad por Ejecución</h3>
              <p className="text-gray-700 mb-4">
                A pesar de los esfuerzos de curaduría mencionados, el Usuario acepta y reconoce que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Independencia del Servicio:</strong> La relación contractual se establece exclusivamente entre el Cliente y el Proveedor. Memorialo no es una agencia de empleos, una empresa de eventos ni un garante de servicios.</li>
                <li><strong>Fallas del Proveedor:</strong> Memorialo no se hace responsable por incumplimientos, retrasos, falta de calidad, daños materiales o morales, ni cualquier negligencia en la que pueda incurrir el Proveedor durante o después de la prestación del servicio.</li>
                <li><strong>Veracidad de Datos:</strong> Aunque realizamos validaciones, no garantizamos la veracidad absoluta de toda la información, reseñas o documentos cargados por los Usuarios.</li>
                <li><strong>Daños Derivados:</strong> Bajo ninguna circunstancia Memorialo será responsable por daños indirectos, incidentales o consecuentes derivados del uso de la Plataforma o de la interacción entre los Usuarios.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">8.3 Continuidad y Disponibilidad Técnica</h3>
              <p className="text-gray-700 mb-4">
                Memorialo se compromete a emplear sus mejores esfuerzos técnicos y humanos para mantener la Plataforma
                operativa y accesible las 24 horas del día. Sin embargo, el Usuario reconoce y acepta que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Mantenimiento y Mejoras:</strong> El acceso puede ser suspendido temporalmente por razones de mantenimiento programado, actualizaciones de seguridad o mejoras en la infraestructura, las cuales intentarán ser notificadas con antelación.</li>
                <li><strong>Factores Externos y Fuerza Mayor:</strong> Memorialo no será responsable por interrupciones del servicio derivadas de fallas en proveedores de internet (ISPs), cortes de suministro eléctrico, ataques cibernéticos a gran escala (DDoS) o cualquier evento de fuerza mayor ajeno a nuestro control directo.</li>
                <li><strong>Mitigación de Daños:</strong> Ante una falla técnica verificada, nuestro equipo técnico actuará con la mayor celeridad posible para restablecer el servicio. El Usuario acepta que Memorialo no es responsable por lucros cesantes o pérdidas de oportunidad de negocio derivadas de una indisponibilidad temporal del sistema.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">8.4 Sistema de Acompañamiento y Recordatorios</h3>
              <p className="text-gray-700 mb-4">
                Como parte de su compromiso con la calidad del ecosistema, Memorialo dispone de un sistema automatizado
                de notificaciones.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Recordatorios de Cumplimiento:</strong> La Plataforma enviará correos electrónicos y/o notificaciones a los Proveedores con una antelación de 48 horas a la fecha del evento, recordándoles su compromiso de asistir y cumplir con los términos establecidos en el acuerdo firmado con el Cliente.</li>
                <li><strong>Alcance del Recordatorio:</strong> Este servicio se ofrece como una herramienta de apoyo y gestión logística. Sin embargo, el envío o la recepción de dicho recordatorio no constituye una garantía de asistencia por parte del Proveedor, ni traslada la responsabilidad del cumplimiento del contrato a Memorialo en caso de que el Proveedor no se presente o falle en su servicio.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>9. Modificaciones</h2>
              <p className="text-gray-700">
                Memorialo se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Los cambios serán efectivos inmediatamente después de su publicación. El uso continuado de la 
                Plataforma después de dichos cambios constituye tu aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>10. Terminación</h2>
              <p className="text-gray-700">
                Memorialo puede suspender o terminar tu cuenta si violas estos Términos y Condiciones o 
                por cualquier otra razón a su sola discreción, con o sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>11. Ley Aplicable y Jurisdicción</h2>
              <p className="text-gray-700">
                Estos Términos se rigen por las leyes de Venezuela. Cualquier disputa será resuelta en los 
                tribunales competentes de Venezuela.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>12. Contacto</h2>
              <p className="text-gray-700">
                Para preguntas sobre estos Términos y Condiciones, contáctanos en:
              </p>
              <p className="text-gray-700 mt-2">
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
