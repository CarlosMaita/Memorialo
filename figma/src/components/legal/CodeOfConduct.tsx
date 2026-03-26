import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface CodeOfConductProps {
  onBack: () => void;
}

export function CodeOfConduct({ onBack }: CodeOfConductProps) {
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
          <h1 className="mb-2" style={{ color: 'var(--navy-blue)' }}>Código de Conducta</h1>
          <p className="text-gray-600 mb-8">Última actualización: Noviembre 2024</p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>1. Nuestro Compromiso</h2>
              <p className="text-gray-700 mb-4">
                En Memorialo, nos comprometemos a crear una comunidad segura, respetuosa e inclusiva para 
                todos los usuarios. Este Código de Conducta establece las expectativas de comportamiento 
                para Clientes, Proveedores y todos los miembros de nuestra comunidad.
              </p>
              <p className="text-gray-700">
                Al usar Memorialo, aceptas cumplir con este Código de Conducta. Las violaciones pueden 
                resultar en advertencias, suspensión temporal o permanente de tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>2. Principios Fundamentales</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="mb-2 text-gray-800">Respeto</h3>
                  <p className="text-gray-700">
                    Trata a todos los usuarios con dignidad y consideración, independientemente de su origen, 
                    identidad o circunstancias.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="mb-2 text-gray-800">Honestidad</h3>
                  <p className="text-gray-700">
                    Proporciona información veraz y precisa en tu perfil, servicios y comunicaciones.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="mb-2 text-gray-800">Profesionalismo</h3>
                  <p className="text-gray-700">
                    Mantén estándares profesionales en todas tus interacciones y cumple tus compromisos.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="mb-2 text-gray-800">Seguridad</h3>
                  <p className="text-gray-700">
                    Prioriza la seguridad y bienestar de todos los involucrados en cada transacción.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>3. Comportamiento Esperado</h2>
              
              <h3 className="mb-3 text-gray-800">3.1 Comunicación Respetuosa</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Usa lenguaje cortés y profesional</li>
                <li>Responde a mensajes de manera oportuna</li>
                <li>Sé claro y específico en tus solicitudes y ofertas</li>
                <li>Escucha activamente las necesidades de la otra parte</li>
                <li>Mantén la comunicación dentro de la plataforma</li>
              </ul>

              <h3 className="mb-3 text-gray-800">3.2 Integridad Profesional</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Cumple con todos los acuerdos y compromisos</li>
                <li>Llega puntualmente a eventos y citas</li>
                <li>Proporciona el servicio exactamente como se describió</li>
                <li>Notifica inmediatamente si surgen problemas</li>
                <li>Resuelve conflictos de manera constructiva</li>
              </ul>

              <h3 className="mb-3 text-gray-800">3.3 Transparencia</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Sé honesto sobre tus habilidades y experiencia</li>
                <li>Divulga cualquier limitación o condición especial</li>
                <li>Proporciona precios claros sin cargos ocultos</li>
                <li>Mantén información de perfil actualizada</li>
                <li>Declara cualquier conflicto de interés</li>
              </ul>

              <h3 className="mb-3 text-gray-800">3.4 Inclusión y Diversidad</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Respeta todas las culturas, religiones y tradiciones</li>
                <li>Acoge la diversidad en todas sus formas</li>
                <li>Adapta tus servicios a diferentes necesidades cuando sea posible</li>
                <li>Evita estereotipos y prejuicios</li>
                <li>Crea un ambiente acogedor para todos</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>4. Comportamiento Prohibido</h2>
              
              <h3 className="mb-3 text-gray-800">4.1 Discriminación y Acoso</h3>
              <p className="text-gray-700 mb-3">Absolutamente prohibido:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Discriminación por raza, etnia, nacionalidad, religión</li>
                <li>Discriminación por género, orientación sexual, identidad de género</li>
                <li>Discriminación por edad, discapacidad o condición de salud</li>
                <li>Acoso, intimidación o amenazas de cualquier tipo</li>
                <li>Lenguaje ofensivo, insultos o ataques personales</li>
                <li>Contacto no deseado o comportamiento invasivo</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.2 Fraude y Engaño</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Proporcionar información falsa o engañosa</li>
                <li>Usar fotos o credenciales de otras personas</li>
                <li>Crear reseñas falsas o manipular calificaciones</li>
                <li>Prometer servicios que no puedes cumplir</li>
                <li>Esquemas de estafa o phishing</li>
                <li>Evasión de comisiones de la plataforma</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.3 Actividades Ilegales</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Cualquier actividad que viole leyes locales, nacionales o internacionales</li>
                <li>Lavado de dinero o financiamiento ilegal</li>
                <li>Venta de productos o servicios prohibidos</li>
                <li>Violación de derechos de propiedad intelectual</li>
                <li>Uso de la plataforma para actividades criminales</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.4 Abuso de la Plataforma</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Spam o mensajes no solicitados masivos</li>
                <li>Intentos de hackeo o acceso no autorizado</li>
                <li>Sobrecarga deliberada del sistema</li>
                <li>Crear múltiples cuentas para evadir restricciones</li>
                <li>Scraping o extracción no autorizada de datos</li>
                <li>Uso de bots o automatización no permitida</li>
              </ul>

              <h3 className="mb-3 text-gray-800">4.5 Contenido Inapropiado</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Contenido sexualmente explícito o sugerente</li>
                <li>Violencia gráfica o contenido perturbador</li>
                <li>Incitación al odio o violencia</li>
                <li>Contenido que promueva actividades ilegales</li>
                <li>Información falsa o difamatoria</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>5. Expectativas Específicas para Proveedores</h2>
              
              <h3 className="mb-3 text-gray-800">5.1 Calidad del Servicio</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Mantén altos estándares de calidad profesional</li>
                <li>Usa equipo apropiado y en buen estado</li>
                <li>Llega preparado y con todo lo necesario</li>
                <li>Cumple los tiempos acordados</li>
                <li>Supera las expectativas cuando sea posible</li>
              </ul>

              <h3 className="mb-3 text-gray-800">5.2 Presentación Personal</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Viste apropiadamente para el tipo de evento</li>
                <li>Mantén buena higiene y apariencia profesional</li>
                <li>Sé cortés con todos los asistentes</li>
                <li>Respeta el espacio y las pertenencias del cliente</li>
              </ul>

              <h3 className="mb-3 text-gray-800">5.3 Ética Profesional</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>No solicites pagos fuera de la plataforma</li>
                <li>No intentes robar clientes de otros proveedores</li>
                <li>Respeta la privacidad de los eventos</li>
                <li>No uses fotos o videos de eventos sin permiso</li>
                <li>Mantén confidencialidad sobre información sensible</li>
              </ul>

              <h3 className="mb-3 text-gray-800">5.4 Disponibilidad y Comunicación</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Mantén tu calendario actualizado</li>
                <li>Responde a mensajes dentro de 24 horas</li>
                <li>Confirma reservas oportunamente</li>
                <li>Notifica cambios lo antes posible</li>
                <li>Sé accesible durante eventos activos</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>6. Expectativas Específicas para Clientes</h2>
              
              <h3 className="mb-3 text-gray-800">6.1 Trato a Proveedores</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Trata a los proveedores con respeto profesional</li>
                <li>Proporciona información completa sobre el evento</li>
                <li>Sé claro sobre tus expectativas</li>
                <li>Respeta los límites profesionales</li>
                <li>No hagas solicitudes irrazonables</li>
              </ul>

              <h3 className="mb-3 text-gray-800">6.2 Preparación del Evento</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Proporciona acceso e información del venue</li>
                <li>Asegura condiciones de trabajo adecuadas</li>
                <li>Informa sobre restricciones o requisitos especiales</li>
                <li>Facilita estacionamiento y carga/descarga</li>
                <li>Proporciona contactos de emergencia</li>
              </ul>

              <h3 className="mb-3 text-gray-800">6.3 Durante el Evento</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Permite que el proveedor trabaje sin interrupciones innecesarias</li>
                <li>Asegura que invitados traten al proveedor respetuosamente</li>
                <li>Proporciona breaks según acordado</li>
                <li>Comunica cambios inmediatamente</li>
                <li>Respeta el equipo y materiales del proveedor</li>
              </ul>

              <h3 className="mb-3 text-gray-800">6.4 Pagos y Reseñas</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Realiza pagos según los términos acordados</li>
                <li>No solicites servicios adicionales sin compensación</li>
                <li>Deja reseñas honestas y constructivas</li>
                <li>No amenaces con malas reseñas para obtener descuentos</li>
                <li>Comunica problemas directamente antes de dejar reseñas negativas</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>7. Manejo de Conflictos</h2>
              
              <h3 className="mb-3 text-gray-800">7.1 Resolución Directa</h3>
              <p className="text-gray-700 mb-4">
                Si surge un problema:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Comunícate directamente con la otra parte</li>
                <li>Mantén la calma y sé respetuoso</li>
                <li>Explica claramente el problema</li>
                <li>Escucha la perspectiva de la otra parte</li>
                <li>Busca una solución mutuamente aceptable</li>
              </ol>

              <h3 className="mb-3 text-gray-800">7.2 Escalamiento a Soporte</h3>
              <p className="text-gray-700 mb-4">
                Si no puedes resolver el problema directamente:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Contacta al equipo de soporte de Memorialo</li>
                <li>Proporciona toda la información relevante</li>
                <li>Mantén comunicación respetuosa con soporte</li>
                <li>Coopera con el proceso de investigación</li>
                <li>Acepta la mediación del equipo</li>
              </ul>

              <h3 className="mb-3 text-gray-800">7.3 Lo que NO Debes Hacer</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>No amenaces o intimides</li>
                <li>No expongas el conflicto públicamente</li>
                <li>No tomes represalias</li>
                <li>No contactes fuera de la plataforma de forma agresiva</li>
                <li>No involucres a terceros innecesariamente</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>8. Reportar Violaciones</h2>
              
              <h3 className="mb-3 text-gray-800">8.1 Cómo Reportar</h3>
              <p className="text-gray-700 mb-4">
                Si presencias o experimentas una violación de este Código:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Usa el botón "Reportar" en perfiles o conversaciones</li>
                <li>Contacta directamente a contacto@memorialo.com</li>
                <li>Proporciona detalles específicos del incidente</li>
                <li>Incluye capturas de pantalla u otra evidencia</li>
                <li>Indica testigos si los hay</li>
              </ul>

              <h3 className="mb-3 text-gray-800">8.2 Confidencialidad</h3>
              <p className="text-gray-700 mb-4">
                Todos los reportes se manejan con confidencialidad. Tu identidad se protegerá en la 
                medida de lo posible, a menos que sea necesario revelarla para la investigación o 
                acciones legales.
              </p>

              <h3 className="mb-3 text-gray-800">8.3 No Represalias</h3>
              <p className="text-gray-700">
                Está estrictamente prohibido tomar represalias contra cualquier persona que reporte 
                una violación de buena fe. Las represalias resultarán en acciones disciplinarias severas.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>9. Consecuencias de Violaciones</h2>
              
              <h3 className="mb-3 text-gray-800">9.1 Acciones Disciplinarias</h3>
              <p className="text-gray-700 mb-4">
                Las violaciones pueden resultar en:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Advertencia:</strong> Primera ofensa menor</li>
                <li><strong>Suspensión temporal:</strong> 7-30 días según severidad</li>
                <li><strong>Restricción de funciones:</strong> Limitación de ciertas capacidades</li>
                <li><strong>Suspensión permanente:</strong> Para violaciones graves o repetidas</li>
                <li><strong>Acciones legales:</strong> En casos de actividades criminales</li>
              </ul>

              <h3 className="mb-3 text-gray-800">9.2 Factores Considerados</h3>
              <p className="text-gray-700 mb-4">
                Al determinar consecuencias, consideramos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Severidad de la violación</li>
                <li>Impacto en otros usuarios</li>
                <li>Intencionalidad</li>
                <li>Historial del usuario</li>
                <li>Cooperación con la investigación</li>
                <li>Esfuerzos de remediación</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>10. Apelaciones</h2>
              <p className="text-gray-700 mb-4">
                Si crees que una acción disciplinaria fue injusta:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Envía una apelación a contacto@memorialo.com dentro de 14 días</li>
                <li>Explica por qué consideras la decisión injusta</li>
                <li>Proporciona cualquier evidencia nueva</li>
                <li>Un equipo diferente revisará tu caso</li>
                <li>Recibirás una decisión final en 7-14 días hábiles</li>
              </ol>
              <p className="text-gray-700">
                Las decisiones de apelación son finales.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>11. Actualizaciones del Código</h2>
              <p className="text-gray-700">
                Podemos actualizar este Código de Conducta periódicamente para reflejar cambios en 
                nuestra comunidad y mejores prácticas. Te notificaremos sobre cambios significativos 
                y el uso continuado de la plataforma constituye aceptación del código actualizado.
              </p>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>12. Compromiso Comunitario</h2>
              <p className="text-gray-700 mb-4">
                Todos somos responsables de mantener una comunidad positiva. Te animamos a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Ser un ejemplo de comportamiento positivo</li>
                <li>Apoyar y animar a otros miembros</li>
                <li>Compartir conocimiento y mejores prácticas</li>
                <li>Reportar problemas constructivamente</li>
                <li>Contribuir a un ambiente acogedor</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ color: 'var(--navy-blue)' }}>13. Contacto</h2>
              <p className="text-gray-700">
                Para preguntas sobre este Código de Conducta o para reportar violaciones:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email:</strong> contacto@memorialo.com<br />
                <strong>Soporte:</strong> Disponible 24/7 en la plataforma<br />
                <strong>Ubicación:</strong> Venezuela
              </p>
            </section>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <p className="text-gray-700">
                <strong>Gracias por ser parte de la comunidad Memorialo.</strong> Juntos creamos 
                experiencias memorables basadas en respeto, profesionalismo y excelencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
