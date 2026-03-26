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
          <p className="text-gray-600 mb-8">Última actualización: Marzo 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Categorización de Servicios</h2>
              <p className="text-gray-700">
                Para aplicar las reglas de cancelación, Memorialo divide los servicios en dos categorías según su
                naturaleza operativa:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li><strong>Categoría A (Servicios de Talento y Alquiler):</strong> DJs, músicos, animadores, fotógrafos, alquiler de trajes y equipos. (Bajo costo de insumos previos).</li>
                <li><strong>Categoría B (Servicios de Logística e Insumos):</strong> Salones de fiesta, espacios, banquetes (comida), servicios de postres y decoradores. (Alto costo de reserva de fecha y compra de materiales perecederos).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Cancelación por Parte del Cliente (Reembolsos Directos)</h2>
              <p className="text-gray-700">
                El Cliente reconoce que el Proveedor ya ha incurrido en costos de oportunidad o materiales. Los
                reembolsos se rigen bajo los siguientes esquemas:
              </p>

              <h3 className="mb-3 mt-6 text-gray-800">Para Categoría A (Talento y Alquileres)</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Más de 7 días: Reembolso del 100% del monto pagado.</li>
                <li>De 3 a 7 días: Reembolso del 50%.</li>
                <li>Menos de 72 horas: Sin derecho a reembolso.</li>
              </ul>

              <h3 className="mb-3 text-gray-800">Para Categoría B (Salones, Banquetes y Postres)</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Más de 15 días: Reembolso del 100% (permite al salón re-alquilar la fecha).</li>
                <li>De 7 a 15 días: Reembolso del 50%.</li>
                <li>Menos de 7 días: Sin derecho a reembolso.</li>
              </ul>
              <p className="text-gray-700">
                <strong>Nota:</strong> En banquetes y postres, a falta de 7 días ya se han realizado compras de materia
                prima e insumos que no pueden recuperarse.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Cancelación por Parte del Proveedor</h2>

              <p className="text-gray-700 mb-4">
                Independientemente de la categoría, la confianza es innegociable.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Devolución Total:</strong> El Proveedor debe devolver el 100% del dinero en un máximo de 48 horas.</li>
                <li><strong>Garantía de Tasa BCV:</strong> La devolución se hará calculando el monto en Bolívares a la tasa oficial del BCV del día del reembolso, garantizando que el Cliente no pierda poder adquisitivo.</li>
                <li><strong>Sanción por "Falla Crítica" (Salones y Banquetes):</strong> Si un salón o banquete cancela con menos de 72 horas de antelación, Memorialo iniciará un proceso de expulsión inmediata del proveedor de la plataforma, debido al daño irreparable que causa al evento.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Casos Especiales por Tipo de Servicio</h2>

              <h3 className="mb-3 text-gray-800">4.1 Alquiler de Trajes</h3>
              <p className="text-gray-700 mb-4">
                Si la cancelación ocurre por defectos en la prenda al momento de la prueba, el Cliente tiene derecho
                al reembolso total inmediato.
              </p>

              <h3 className="mb-3 text-gray-800">4.2 Salones y Espacios</h3>
              <p className="text-gray-700 mb-4">
                En caso de fallas de infraestructura (sin luz, sin agua o daños estructurales), el Proveedor debe
                notificar 48 horas antes. Si el evento no puede realizarse, la devolución es del 100%.
              </p>

              <h3 className="mb-3 text-gray-800">4.3 Banquetes</h3>
              <p className="text-gray-700">
                Si el Cliente reduce el número de invitados con menos de 5 días de antelación, el Proveedor no está
                obligado a reducir el precio, debido a la compra previa de insumos.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. El Rol de Mediación de Memorialo</h2>
              <p className="text-gray-700 mb-4">
                Al ser pagos directos, Memorialo monitorea el cumplimiento:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Registro de Evidencia:</strong> Guardamos los chats y los recordatorios de 48 horas como prueba de que el servicio estaba confirmado.</li>
                <li><strong>Reporte Negativo:</strong> Si un proveedor no reembolsa lo acordado, Memorialo marcará su perfil con una "Alerta de Incumplimiento" visible para todos los futuros clientes mientras dure la disputa.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
