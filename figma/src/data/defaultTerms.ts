// Plantilla de términos y condiciones por defecto para servicios
export const DEFAULT_TERMS = {
  paymentTerms: `Se requiere un depósito del 50% para confirmar la reserva. El saldo restante debe pagarse 7 días antes del evento. Los pagos pueden realizarse mediante transferencia bancaria, Pago Móvil, Zelle o efectivo.

El depósito es reembolsable solo de acuerdo a la política de cancelación establecida.`,

  cancellationPolicy: `Cancelaciones con más de 30 días de anticipación: reembolso completo del depósito.

Cancelaciones entre 15-30 días: reembolso del 50% del depósito.

Cancelaciones con menos de 15 días: sin reembolso.

En caso de emergencia médica grave o fuerza mayor comprobable, se evaluarán excepciones caso por caso.`,

  additionalTerms: [
    'El proveedor se compromete a llegar al lugar del evento con 30 minutos de anticipación para preparación.',
    'El cliente debe proporcionar un espacio adecuado y acceso a electricidad si es necesario para el servicio.',
    'Cualquier solicitud especial o cambio en el servicio debe comunicarse con al menos 7 días de anticipación.',
    'El proveedor se reserva el derecho de usar fotografías y videos del evento para fines promocionales, a menos que se acuerde lo contrario por escrito.',
    'En caso de fuerza mayor (clima extremo, emergencias, disturbios), ambas partes acordarán reprogramar el evento sin penalización adicional.',
    'Ambas partes acuerdan resolver cualquier disputa mediante mediación amistosa antes de proceder por vía legal.',
    'El cliente es responsable de la seguridad del equipo del proveedor durante el evento.',
    'El proveedor no se hace responsable por daños o pérdidas causadas por terceros durante el evento.'
  ]
};
