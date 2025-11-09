import { Contract } from '../types';

// Mock contracts for testing the event grouping feature
export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    bookingId: 'booking-1',
    artistId: '1',
    artistName: 'Mariachi Los Gallos',
    clientId: 'user-1',
    clientName: 'Juan Pérez',
    eventId: 'event-1', // Assigned to "Boda María y Juan"
    createdAt: '2025-11-01T10:00:00Z',
    terms: {
      serviceDescription: 'Paquete Celebración - Mariachi para ceremonia y recepción',
      price: 450,
      duration: 3,
      date: '2026-06-15',
      startTime: '18:00',
      location: 'Jardín Botánico de Caracas',
      cancellationPolicy: 'Cancelación gratuita hasta 15 días antes del evento',
      paymentTerms: '50% al contratar, 50% el día del evento',
      additionalTerms: [
        'Incluye 6-8 músicos profesionales',
        'Repertorio personalizado',
        'Trajes tradicionales'
      ]
    },
    status: 'active',
    clientSignature: {
      signedBy: 'Juan Pérez',
      signedAt: '2025-11-02T14:30:00Z'
    },
    artistSignature: {
      signedBy: 'Mariachi Los Gallos',
      signedAt: '2025-11-02T16:00:00Z'
    }
  },
  {
    id: 'contract-2',
    bookingId: 'booking-2',
    artistId: '2',
    artistName: 'DJ Carlos Beats',
    clientId: 'user-1',
    clientName: 'Juan Pérez',
    eventId: 'event-1', // Assigned to "Boda María y Juan"
    createdAt: '2025-11-03T11:00:00Z',
    terms: {
      serviceDescription: 'Paquete Premium de DJ - Recepción de boda con luces y sonido',
      price: 800,
      duration: 4,
      date: '2026-06-15',
      startTime: '21:00',
      location: 'Jardín Botánico de Caracas',
      cancellationPolicy: 'Cancelación gratuita hasta 15 días antes del evento',
      paymentTerms: '50% al contratar, 50% el día del evento',
      additionalTerms: [
        'Sistema de sonido profesional',
        'Iluminación LED',
        'Equipo de luces y humo',
        'Playlist personalizada'
      ]
    },
    status: 'active',
    clientSignature: {
      signedBy: 'Juan Pérez',
      signedAt: '2025-11-03T12:00:00Z'
    },
    artistSignature: {
      signedBy: 'DJ Carlos Beats',
      signedAt: '2025-11-03T14:00:00Z'
    }
  },
  {
    id: 'contract-3',
    bookingId: 'booking-3',
    artistId: '4',
    artistName: 'Fotógrafo Profesional',
    clientId: 'user-1',
    clientName: 'Juan Pérez',
    eventId: 'event-2', // Assigned to "Cumpleaños 30 de Ana"
    createdAt: '2025-10-20T09:00:00Z',
    terms: {
      serviceDescription: 'Cobertura fotográfica completa de cumpleaños',
      price: 350,
      duration: 5,
      date: '2026-03-20',
      startTime: '19:00',
      location: 'Club Los Samanes, Maracaibo',
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes del evento',
      paymentTerms: '30% al contratar, 70% al entregar las fotos',
      additionalTerms: [
        '200+ fotos editadas',
        'Entrega digital en 7 días',
        'Álbum digital incluido'
      ]
    },
    status: 'active',
    clientSignature: {
      signedBy: 'Juan Pérez',
      signedAt: '2025-10-20T10:00:00Z'
    },
    artistSignature: {
      signedBy: 'Fotógrafo Profesional',
      signedAt: '2025-10-20T11:00:00Z'
    }
  },
  {
    id: 'contract-4',
    bookingId: 'booking-4',
    artistId: '3',
    artistName: 'Banda Los Tropicales',
    clientId: 'user-1',
    clientName: 'Juan Pérez',
    // No eventId - unassigned contract
    createdAt: '2025-11-05T15:00:00Z',
    terms: {
      serviceDescription: 'Presentación musical de 2 horas',
      price: 500,
      duration: 2,
      date: '2026-02-14',
      startTime: '20:00',
      location: 'Salón de Eventos El Paraíso, Valencia',
      cancellationPolicy: 'Cancelación gratuita hasta 10 días antes del evento',
      paymentTerms: '50% al contratar, 50% el día del evento',
      additionalTerms: [
        'Repertorio de música tropical',
        '6 músicos profesionales'
      ]
    },
    status: 'pending_client'
  }
];
