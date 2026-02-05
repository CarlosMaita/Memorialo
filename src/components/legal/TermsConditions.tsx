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
          <p className="text-gray-600 mb-8">Última actualización: Noviembre 2024</p>

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
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Contratos y Pagos</h2>
              <h3 className="mb-3 text-gray-800">5.1 Contratos entre Clientes y Proveedores</h3>
              <p className="text-gray-700 mb-4">
                Memorialo actúa como intermediario facilitando la conexión entre Clientes y Proveedores. 
                El contrato de servicios se establece directamente entre el Cliente y el Proveedor. 
                Memorialo no es parte de este contrato y no asume responsabilidad por su cumplimiento.
              </p>

              <h3 className="mb-3 text-gray-800">5.2 Procesamiento de Pagos</h3>
              <p className="text-gray-700 mb-4">
                Los pagos se procesan de forma segura a través de la Plataforma. Memorialo puede retener 
                el pago hasta la confirmación de que el servicio fue prestado satisfactoriamente.
              </p>

              <h3 className="mb-3 text-gray-800">5.3 Comisiones</h3>
              <p className="text-gray-700">
                Memorialo cobra una comisión por cada transacción completada. Las tarifas específicas 
                se informan claramente antes de confirmar cualquier contrato.
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
              <p className="text-gray-700 mb-4">
                Todo el contenido de la Plataforma, incluyendo texto, gráficos, logos, imágenes y software, 
                es propiedad de Memorialo o sus licenciantes y está protegido por leyes de propiedad intelectual.
              </p>
              <p className="text-gray-700">
                Los Proveedores mantienen la propiedad de su contenido pero otorgan a Memorialo una licencia 
                para usar, mostrar y promocionar dicho contenido en la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                Memorialo no es responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>La calidad, seguridad o legalidad de los servicios ofrecidos por Proveedores</li>
                <li>La veracidad de la información proporcionada por los Usuarios</li>
                <li>Las disputas entre Clientes y Proveedores</li>
                <li>Daños indirectos, incidentales o consecuentes derivados del uso de la Plataforma</li>
                <li>Pérdidas causadas por interrupciones del servicio</li>
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
