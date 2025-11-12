import { Artist, Service, Event } from '../types';

export const mockArtists: Artist[] = [
  {
    id: '1',
    name: 'Mariachi Los Gallos',
    category: 'Música y DJs',
    image: 'https://images.unsplash.com/photo-1729638276657-0a0978e66d38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJpYWNoaSUyMGJhbmR8ZW58MXx8fHwxNzYyNTcxMTkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 127,
    pricePerHour: 150,
    location: 'Caracas',
    bio: 'Banda de mariachi tradicional con más de 15 años de experiencia. Perfecto para bodas, quinceañeras y celebraciones.',
    specialties: ['Música y DJs', 'Cultura y Ceremonia', 'Bodas', 'Quinceañeras'],
    availability: ['Fines de semana', 'Noches'],
    portfolio: [
      'https://images.unsplash.com/photo-1729638276657-0a0978e66d38?w=400',
      'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?w=400',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400'
    ],
    verified: true,
    responseTime: '< 1 hour',
    bookingsCompleted: 342,
    servicePlans: [
      {
        id: 'p1-1',
        name: 'Serenata Básica',
        price: 200,
        duration: 1,
        description: 'Serenata íntima con las canciones tradicionales más románticas',
        includes: [
          '5-6 canciones tradicionales',
          'Trajes tradicionales de mariachi',
          'Hasta 3 músicos',
          'Música en vivo'
        ]
      },
      {
        id: 'p1-2',
        name: 'Paquete Celebración',
        price: 450,
        duration: 3,
        description: 'Perfecto para bodas, quinceañeras y eventos especiales',
        includes: [
          'Hasta 20 canciones',
          '6-8 músicos profesionales',
          'Trajes tradicionales completos',
          'Repertorio personalizado',
          'Coordinación con el evento',
          'Sistema de sonido incluido'
        ],
        popular: true
      },
      {
        id: 'p1-3',
        name: 'Paquete Premium',
        price: 800,
        duration: 5,
        description: 'La experiencia completa de mariachi para tu evento',
        includes: [
          'Repertorio ilimitado',
          '8-10 músicos profesionales',
          'Trajes de gala',
          'Sistema de sonido profesional',
          'Coordinación personalizada',
          'Canciones a petición',
          'Recepción y ceremonia',
          'Fotografías de cortesía'
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'DJ Mike Thompson',
    category: 'Música y DJs',
    image: 'https://images.unsplash.com/photo-1618107095181-e3ba0f53ee59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxESiUyMHR1cm50YWJsZXN8ZW58MXx8fHwxNzYyNTAwNDIxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.8,
    reviews: 89,
    pricePerHour: 200,
    location: 'Maracaibo',
    bio: 'DJ profesional especializado en bodas, eventos corporativos y fiestas privadas. Equipo completo de sonido e iluminación incluido.',
    specialties: ['Música y DJs', 'Bodas', 'Eventos Corporativos', 'EDM'],
    availability: ['Fines de semana', 'Noches', 'Entre semana'],
    portfolio: [
      'https://images.unsplash.com/photo-1618107095181-e3ba0f53ee59?w=400',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400',
      'https://images.unsplash.com/photo-1571266028243-d220c2f71d05?w=400'
    ],
    verified: true,
    responseTime: '< 2 horas',
    bookingsCompleted: 215,
    servicePlans: [
      {
        id: 'p2-1',
        name: 'Fiesta Inicial',
        price: 350,
        duration: 2,
        description: 'Perfecto para reuniones pequeñas y celebraciones íntimas',
        includes: [
          'Servicio profesional de DJ',
          'Sistema de sonido básico',
          'Mezcla de música',
          'Hasta 50 invitados',
          'Biblioteca musical digital'
        ]
      },
      {
        id: 'p2-2',
        name: 'Evento Premium',
        price: 800,
        duration: 4,
        description: 'Paquete completo de entretenimiento para bodas y eventos grandes',
        includes: [
          'DJ profesional y servicios de MC',
          'Sistema de sonido premium',
          'Paquete de iluminación LED',
          'Micrófonos inalámbricos',
          'Hasta 200 invitados',
          'Creación de playlist personalizada',
          'Reunión de coordinación del evento'
        ],
        popular: true
      },
      {
        id: 'p2-3',
        name: 'Experiencia VIP',
        price: 1500,
        duration: 6,
        description: 'Experiencia DJ definitiva con producción completa',
        includes: [
          'DJ profesional y MC',
          'Sonido e iluminación premium',
          'Máquina de humo y efectos especiales',
          'Integración de cabina de fotos',
          'Capacidades de mezcla de video',
          'Invitados ilimitados',
          'Proyección de monograma personalizado',
          'Equipo de respaldo',
          'DJ asistente'
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Sarah Martinez',
    category: 'Música y DJs',
    image: 'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMHBlcmZvcm1pbmd8ZW58MXx8fHwxNzYyNDQ3NDUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 5.0,
    reviews: 156,
    pricePerHour: 175,
    location: 'Valencia',
    bio: 'Violinista clásica y contemporánea disponible para bodas, galas y eventos íntimos. Disponible en solo o cuarteto.',
    specialties: ['Música y DJs', 'Cultura y Ceremonia', 'Bodas', 'Clásica'],
    availability: ['Fines de semana', 'Noches'],
    portfolio: [
      'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?w=400'
    ],
    verified: true,
    responseTime: '< 3 horas',
    bookingsCompleted: 189,
    servicePlans: [
      {
        id: 'p3-1',
        name: 'Presentación en Solo',
        price: 300,
        duration: 2,
        description: 'Elegante presentación de violín para ocasiones íntimas',
        includes: [
          'Presentación de violín en solo',
          'Repertorio clásico y contemporáneo',
          'Hasta 10 canciones',
          'Sistema de sonido profesional',
          'Ceremonia o hora de cóctel'
        ]
      },
      {
        id: 'p3-2',
        name: 'Ensamble de Dúo',
        price: 550,
        duration: 3,
        description: 'Hermosa combinación de violín y piano/cello',
        includes: [
          'Violín + Piano o Cello',
          'Repertorio extendido',
          'Canciones personalizadas a petición',
          'Ceremonia y hora de cóctel',
          'Configuración de audio profesional',
          'Reunión de coordinación'
        ],
        popular: true
      },
      {
        id: 'p3-3',
        name: 'Cuarteto de Cuerdas',
        price: 1000,
        duration: 4,
        description: 'Ensamble de cámara completo para una experiencia inolvidable',
        includes: [
          'Cuarteto de cuerdas profesional',
          'Repertorio clásico completo',
          'Arreglos personalizados disponibles',
          'Múltiples ubicaciones de presentación',
          'Equipo de sonido premium',
          'Consultoría musical',
          'Solicitudes de canciones ilimitadas',
          'Ceremonia, cóctel y recepción'
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'Alex Chen',
    category: 'Animator',
    image: 'https://images.unsplash.com/photo-1628494391267-befcfdfaef67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYXRvciUyMGFydGlzdHxlbnwxfHx8fDE3NjI1NzExOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 73,
    pricePerHour: 125,
    location: 'Barquisimeto',
    bio: 'Animador 2D/3D especializado en trabajo comercial, videos musicales y videos explicativos. Entrega rápida garantizada.',
    specialties: ['Animación 2D', 'Animación 3D', 'Motion Graphics', 'Trabajo Comercial'],
    availability: ['Entre semana', 'Remoto'],
    portfolio: [
      'https://images.unsplash.com/photo-1628494391267-befcfdfaef67?w=400'
    ],
    verified: true,
    responseTime: '< 4 horas',
    bookingsCompleted: 98,
    servicePlans: [
      {
        id: 'p4-1',
        name: 'Animación Básica',
        price: 500,
        duration: 10,
        description: 'Proyecto simple de animación 2D - perfecto para redes sociales',
        includes: [
          'Hasta 30 segundos de animación',
          'Estilo de animación 2D',
          '2 rondas de revisión',
          'Exportación HD (1080p)',
          'Entrega en 5-7 días',
          'Archivos fuente incluidos'
        ]
      },
      {
        id: 'p4-2',
        name: 'Paquete Profesional',
        price: 1200,
        duration: 25,
        description: 'Animación de alta calidad para uso comercial',
        includes: [
          'Hasta 60 segundos de animación',
          'Animación 2D o 3D simple',
          'Diseño de personajes personalizado',
          '4 rondas de revisión',
          'Exportación 4K disponible',
          'Integración de música de fondo',
          'Coordinación de locución',
          'Entrega en 10-14 días'
        ],
        popular: true
      },
      {
        id: 'p4-3',
        name: 'Producción 3D Premium',
        price: 3000,
        duration: 60,
        description: 'Producción completa de animación 3D con efectos avanzados',
        includes: [
          'Hasta 2 minutos de animación',
          'Animación 3D avanzada',
          'Modelado 3D personalizado',
          'Rigging complejo de personajes',
          'Revisiones ilimitadas',
          'Exportación 4K/8K',
          'Motion graphics y VFX',
          'Diseño de sonido incluido',
          'Desarrollo de storyboard',
          'Soporte prioritario'
        ]
      }
    ]
  },
  {
    id: '5',
    name: 'DJ Luna',
    category: 'DJ',
    image: 'https://images.unsplash.com/photo-1618107095181-e3ba0f53ee59?w=400',
    rating: 4.7,
    reviews: 64,
    pricePerHour: 180,
    location: 'Maracay',
    bio: 'DJ de alta energía especializada en Latina, Hip-Hop y Top 40. Disponible para clubes, bodas y eventos privados.',
    specialties: ['Música Latina', 'Hip-Hop', 'Top 40', 'Clubes'],
    availability: ['Fines de semana', 'Noches'],
    portfolio: [],
    verified: true,
    responseTime: '< 2 horas',
    bookingsCompleted: 142,
    servicePlans: [
      {
        id: 'p5-1',
        name: 'Inicio de Fiesta',
        price: 400,
        duration: 3,
        description: 'Ideal para fiestas en casa y eventos pequeños',
        includes: [
          'Servicio de DJ - 3 horas',
          'Sistema de sonido básico',
          'Mezcla Latina, Hip-Hop y Top 40',
          'Hasta 75 invitados'
        ]
      },
      {
        id: 'p5-2',
        name: 'Experiencia de Club',
        price: 900,
        duration: 5,
        description: 'Ambiente completo de club para tu evento',
        includes: [
          'Servicio de DJ - 5 horas',
          'Sonido profesional de club',
          'Efectos de iluminación LED',
          'Máquina de humo',
          'Playlist personalizada',
          'Hasta 150 invitados',
          'Servicios de MC'
        ],
        popular: true
      }
    ]
  },
  {
    id: '6',
    name: 'The Jazz Quartet',
    category: 'Musician',
    image: 'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?w=400',
    rating: 4.8,
    reviews: 91,
    pricePerHour: 250,
    location: 'Mérida',
    bio: 'Ensamble de jazz profesional para eventos exclusivos, funciones corporativas y fiestas privadas. Jazz clásico y contemporáneo.',
    specialties: ['Jazz', 'Eventos Corporativos', 'Horas de Cóctel', 'Galas'],
    availability: ['Fines de semana', 'Noches', 'Entre semana'],
    portfolio: [],
    verified: true,
    responseTime: '< 5 horas',
    bookingsCompleted: 167,
    servicePlans: [
      {
        id: 'p6-1',
        name: 'Hora de Cóctel',
        price: 500,
        duration: 2,
        description: 'Jazz sofisticado para recepciones de cóctel',
        includes: [
          'Cuarteto de jazz profesional',
          'Clásicos del jazz',
          'Ambiente elegante',
          'Configuración de audio premium'
        ]
      },
      {
        id: 'p6-2',
        name: 'Gala Nocturna',
        price: 1200,
        duration: 4,
        description: 'Noche completa de entretenimiento de jazz',
        includes: [
          'Presentación completa del cuarteto',
          'Clásicos y jazz contemporáneo',
          'Selección de canciones personalizada',
          'Múltiples sets',
          'Sonido profesional',
          'Música para cena y baile',
          'Coordinación del evento'
        ],
        popular: true
      }
    ]
  },
  {
    id: '7',
    name: 'Maria Gonzalez',
    category: 'Animator',
    image: 'https://images.unsplash.com/photo-1628494391267-befcfdfaef67?w=400',
    rating: 5.0,
    reviews: 45,
    pricePerHour: 140,
    location: 'Los Angeles, CA',
    bio: 'Animadora de personajes y artista de storyboard. Especializada en contenido infantil y animaciones educativas.',
    specialties: ['Animación de Personajes', 'Storyboarding', 'Contenido Educativo', 'Medios Infantiles'],
    availability: ['Entre semana', 'Remoto'],
    portfolio: [],
    verified: false,
    responseTime: '< 6 horas',
    bookingsCompleted: 52,
    servicePlans: [
      {
        id: 'p7-1',
        name: 'Diseño de Personajes',
        price: 350,
        duration: 8,
        description: 'Creación de personajes personalizada para tu proyecto',
        includes: [
          'Diseño de personaje original',
          '3 bocetos conceptuales',
          'Diseño final coloreado',
          '2 rondas de revisión',
          'Archivos fuente'
        ]
      },
      {
        id: 'p7-2',
        name: 'Video Educativo',
        price: 800,
        duration: 20,
        description: 'Contenido educativo animado atractivo',
        includes: [
          'Hasta 3 minutos de animación',
          'Storyboard educativo',
          'Animación de personajes',
          'Integración de locución',
          'Ilustraciones de fondo',
          '3 rondas de revisión',
          'Exportación Full HD'
        ],
        popular: true
      }
    ]
  },
  {
    id: '8',
    name: 'Mariachi Los Reyes',
    category: 'Mariachi',
    image: 'https://images.unsplash.com/photo-1729638276657-0a0978e66d38?w=400',
    rating: 4.9,
    reviews: 203,
    pricePerHour: 175,
    location: 'San Antonio, TX',
    bio: 'Grupo de mariachi galardonado con repertorio tradicional y moderno. Banda de 8 piezas disponible para todas las ocasiones.',
    specialties: ['Mariachi Tradicional', 'Fusión Moderna', 'Bodas', 'Festivales'],
    availability: ['Fines de semana'],
    portfolio: [],
    verified: true,
    responseTime: '< 1 hour',
    bookingsCompleted: 428,
    servicePlans: [
      {
        id: 'p8-1',
        name: 'Serenata Especial',
        price: 250,
        duration: 1,
        description: 'Serenata romántica con canciones tradicionales',
        includes: [
          '6-8 canciones tradicionales',
          '4-5 músicos profesionales',
          'Vestimenta tradicional',
          'Repertorio romántico'
        ]
      },
      {
        id: 'p8-2',
        name: 'Fiesta Grande',
        price: 700,
        duration: 4,
        description: 'Experiencia completa de mariachi para celebraciones',
        includes: [
          'Banda completa de 8 piezas',
          'Canciones tradicionales y modernas',
          'Vestimenta tradicional completa',
          'Canciones a petición personalizadas',
          'Sistema de sonido incluido',
          'Coordinación del evento',
          'Oportunidades fotográficas'
        ],
        popular: true
      },
      {
        id: 'p8-3',
        name: 'Boda Imperial',
        price: 1200,
        duration: 6,
        description: 'Paquete premium para bodas con producción completa',
        includes: [
          'Banda profesional de 10 piezas',
          'Música para ceremonia y recepción',
          'Vestimenta tradicional premium',
          'Canciones ilimitadas a petición',
          'Sonido e iluminación profesional',
          'Coordinación personalizada',
          'Múltiples áreas de presentación',
          'Música para brindis con champagne',
          'Entradas y salidas grandiosas'
        ]
      }
    ]
  }
];

export const mockServices: Service[] = [
  {
    id: 's1',
    artistId: '1',
    name: 'Presentación para Boda - 3 Horas',
    description: 'Experiencia completa de mariachi para tu día especial',
    price: 450,
    duration: 3,
    category: 'Mariachi'
  },
  {
    id: 's2',
    artistId: '2',
    name: 'Paquete Premium de DJ - 4 Horas',
    description: 'Servicio completo de DJ con luces y sonido',
    price: 800,
    duration: 4,
    category: 'DJ'
  }
];

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    userId: 'user-1',
    name: 'Boda María y Juan',
    description: 'Nuestra ceremonia de boda y recepción',
    eventDate: '2026-06-15',
    eventType: 'Boda',
    location: 'Jardín Botánico de Caracas',
    budget: 15000,
    status: 'planning',
    contractIds: [],
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-01T10:00:00Z'
  },
  {
    id: 'event-2',
    userId: 'user-1',
    name: 'Cumpleaños 30 de Ana',
    description: 'Celebración de cumpleaños número 30',
    eventDate: '2026-03-20',
    eventType: 'Cumpleaños',
    location: 'Club Los Samanes, Maracaibo',
    budget: 8000,
    status: 'planning',
    contractIds: [],
    createdAt: '2025-10-15T14:30:00Z',
    updatedAt: '2025-10-15T14:30:00Z'
  },
  {
    id: 'event-3',
    userId: 'user-2',
    name: 'Aniversario 25 años',
    description: 'Celebración bodas de plata',
    eventDate: '2026-08-10',
    eventType: 'Aniversario',
    location: 'Hacienda El Encanto, Valencia',
    budget: 12000,
    status: 'confirmed',
    contractIds: [],
    createdAt: '2025-09-20T09:15:00Z',
    updatedAt: '2025-11-05T16:20:00Z'
  },
  {
    id: 'event-4',
    userId: 'user-1',
    name: 'Fiesta Corporativa Cancelada',
    description: 'Evento empresarial que fue cancelado',
    eventDate: '2025-12-15',
    eventType: 'Fiesta Corporativa',
    location: 'Hotel Eurobuilding, Caracas',
    budget: 10000,
    status: 'cancelled',
    contractIds: [],
    createdAt: '2025-10-01T11:00:00Z',
    updatedAt: '2025-11-10T09:30:00Z'
  }
];
