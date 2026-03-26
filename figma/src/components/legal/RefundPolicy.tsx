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
          <p className="text-gray-600 mb-8">Última actualización: Marzo 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Introducción y Naturaleza de los Reembolsos</h2>
              <p className="text-gray-700">
                En Memorialo operamos bajo un modelo de Pagos Directos entre Usuarios. Por lo tanto, esta Política de
                Reembolso establece las normas y obligaciones que el Proveedor acepta cumplir para devolver los fondos
                al Cliente cuando corresponda. Memorialo no procesa los pagos ni retiene los fondos, pero actúa como
                mediador, garante de confianza y administrador de sanciones en caso de incumplimiento.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Elegibilidad y Categorías de Reembolso por Cancelación</h2>
              <p className="text-gray-700 mb-4">
                Los reembolsos por cancelación previa al evento se rigen por nuestra Política de Cancelación, dividida
                por tipo de servicio:
              </p>

              <h3 className="mb-3 text-gray-800">2.1 Categoría A (Talento y Alquileres: DJs, Músicos, Fotógrafos, Trajes)</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Más de 7 días: El Proveedor debe reembolsar el 100% del monto.</li>
                <li>3 a 7 días: El Proveedor debe reembolsar el 50%.</li>
                <li>Menos de 3 días: Sin derecho a reembolso.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">2.2 Categoría B (Logística e Insumos: Salones, Banquetes, Postres)</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Más de 15 días: El Proveedor debe reembolsar el 100%.</li>
                <li>7 a 15 días: El Proveedor debe reembolsar el 50%.</li>
                <li>Menos de 7 días: Sin derecho a reembolso (debido a la compra de insumos perecederos o bloqueo de espacios).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Reembolsos por Servicio No Prestado o Deficiente</h2>

              <p className="text-gray-700 mb-4">
                El Cliente tiene derecho a exigir un reembolso directo al Proveedor bajo las siguientes condiciones:
              </p>

              <h3 className="mb-3 text-gray-800">3.1 Reembolso Total (100%) exigible al Proveedor:</h3>
              <p className="text-gray-700 mb-4">
                
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>El Proveedor no se presenta al evento (No-show).</li>
                <li>El Proveedor llega con un retraso crítico (ej. más de 2 horas) que invalida el propósito de su contratación.</li>
                <li>El servicio no pudo prestarse por fallas técnicas imputables exclusivamente al Proveedor (ej. equipo de sonido dañado sin reemplazo).</li>
              </ul>

              <h3 className="mb-3 mt-6 text-gray-800">3.2 Reembolsos Parciales por Calidad (Acuerdo entre las partes)</h3>
              <p className="text-gray-700 mb-4">
                Si el servicio prestado fue significativamente inferior a lo ofertado en el perfil (ej. banquete
                incompleto, salón con áreas inhabilitadas), el Cliente puede solicitar un reembolso parcial (25% al
                75%). Este porcentaje debe ser acordado entre el Cliente y el Proveedor. Memorialo mediará en caso de
                desacuerdo basándose en las pruebas aportadas.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Reglas Financieras del Reembolso (Pagos Directos)</h2>
              <p className="text-gray-700 mb-4">
                Dado el entorno económico en Venezuela, todas las devoluciones de dinero están sujetas a las siguientes
                reglas obligatorias para el Proveedor:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Tasa BCV Aplicable:</strong> Si el servicio fue presupuestado en moneda extranjera pero pagado en Bolívares, el Proveedor deberá realizar el reembolso calculando el monto en Bolívares a la tasa oficial del Banco Central de Venezuela (BCV) vigente el día exacto en que se realiza la devolución, garantizando el valor del dinero del Cliente.</li>
                <li><strong>Método de Devolución:</strong> El reembolso debe enviarse mediante el mismo método de pago utilizado originalmente (Pago Móvil, Transferencia, Zelle, efectivo), salvo que ambas partes acuerden por escrito (en el chat de la plataforma) un método distinto.</li>
                <li><strong>Tiempos de Ejecución:</strong> Una vez confirmada la cancelación o acordado el reembolso, el Proveedor tiene un plazo máximo de 48 a 72 horas hábiles para transferir los fondos al Cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Proceso de Resolución y Disputas (El Rol de Memorialo)</h2>
              <p className="text-gray-700 mb-4">
                Si un Proveedor se niega a procesar un reembolso justificado o ignora los plazos establecidos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Apertura de Disputa:</strong> El Cliente debe ir a "Mis Reservas", seleccionar el servicio y hacer clic en "Abrir Disputa por Reembolso", adjuntando capturas de pago y evidencia del incumplimiento.</li>
                <li><strong>Mediación:</strong> El equipo de Memorialo revisará la evidencia, incluyendo el chat interno y los registros de los recordatorios automáticos de 48 horas.</li>
                <li><strong>Sanción y Expulsión:</strong> Si Memorialo determina que el Proveedor retiene indebidamente los fondos, su cuenta será suspendida permanentemente.</li>
                <li><strong>Soporte Legal al Cliente:</strong> Memorialo proporcionará al Cliente un informe detallado con los datos de registro del Proveedor, el contrato digital aceptado y el historial de la transacción para que el Cliente pueda proceder con denuncias formales ante la SUNDDE o autoridades competentes por estafa o apropiación indebida.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Excepciones y Casos de Fuerza Mayor</h2>
              <p className="text-gray-700 mb-4">
                Se evaluarán reembolsos excepcionales (incluso fuera de los plazos) cuando se presente documentación
                comprobable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Emergencias médicas graves del Proveedor o Cliente (familiar directo).</li>
                <li>Fallecimientos (acta de defunción).</li>
                <li>Fallas críticas y demostrables de servicios públicos en la zona del evento que impidan su realización.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Prevención de Fraude</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Memorialo no atenderá reclamos de reembolsos si la contratación inicial y las comunicaciones se realizaron fuera de la plataforma (evasión de sistema).</li>
                <li>Las solicitudes de reembolso basadas en falsedades por parte del Cliente resultarán en el baneo de su cuenta.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Contacto y Soporte</h2>
              <p className="text-gray-700">
                Para asistencia en disputas o dudas sobre el proceso:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email:</strong> soporte@memorialo.com<br />
                <strong>Ubicación:</strong> Venezuela
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
