import { Artist, Service } from '../types';

export const mockArtists: Artist[] = [
  {
    id: '1',
    name: 'Carlos Rodriguez',
    category: 'Mariachi',
    image: 'https://images.unsplash.com/photo-1729638276657-0a0978e66d38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJpYWNoaSUyMGJhbmR8ZW58MXx8fHwxNzYyNTcxMTkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 127,
    pricePerHour: 150,
    location: 'Los Angeles, CA',
    bio: 'Traditional mariachi band with 15+ years of experience. Perfect for weddings, quinceañeras, and celebrations.',
    specialties: ['Weddings', 'Quinceañeras', 'Corporate Events', 'Serenades'],
    availability: ['Weekends', 'Evenings'],
    portfolio: [
      'https://images.unsplash.com/photo-1729638276657-0a0978e66d38?w=400',
      'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?w=400'
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
    category: 'DJ',
    image: 'https://images.unsplash.com/photo-1618107095181-e3ba0f53ee59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxESiUyMHR1cm50YWJsZXN8ZW58MXx8fHwxNzYyNTAwNDIxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.8,
    reviews: 89,
    pricePerHour: 200,
    location: 'Miami, FL',
    bio: 'Professional DJ specializing in weddings, corporate events, and private parties. Full sound and lighting equipment included.',
    specialties: ['Weddings', 'Corporate Events', 'House Parties', 'EDM'],
    availability: ['Weekends', 'Evenings', 'Weekdays'],
    portfolio: [
      'https://images.unsplash.com/photo-1618107095181-e3ba0f53ee59?w=400'
    ],
    verified: true,
    responseTime: '< 2 hours',
    bookingsCompleted: 215,
    servicePlans: [
      {
        id: 'p2-1',
        name: 'Starter Party',
        price: 350,
        duration: 2,
        description: 'Perfect for small gatherings and intimate celebrations',
        includes: [
          'Professional DJ service',
          'Basic sound system',
          'Music mixing',
          'Up to 50 guests',
          'Digital music library'
        ]
      },
      {
        id: 'p2-2',
        name: 'Premium Event',
        price: 800,
        duration: 4,
        description: 'Complete entertainment package for weddings and large events',
        includes: [
          'Professional DJ & MC services',
          'Premium sound system',
          'LED lighting package',
          'Wireless microphones',
          'Up to 200 guests',
          'Custom playlist creation',
          'Event coordination meeting'
        ],
        popular: true
      },
      {
        id: 'p2-3',
        name: 'VIP Experience',
        price: 1500,
        duration: 6,
        description: 'Ultimate DJ experience with full production',
        includes: [
          'Professional DJ & MC',
          'Premium sound & lighting',
          'Fog machine & special effects',
          'Photo booth integration',
          'Video mixing capabilities',
          'Unlimited guests',
          'Custom monogram projection',
          'Backup equipment',
          'Assistant DJ'
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Sarah Martinez',
    category: 'Musician',
    image: 'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMHBlcmZvcm1pbmd8ZW58MXx8fHwxNzYyNDQ3NDUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 5.0,
    reviews: 156,
    pricePerHour: 175,
    location: 'Austin, TX',
    bio: 'Classical and contemporary violinist available for weddings, galas, and intimate events. Solo or quartet available.',
    specialties: ['Weddings', 'Classical', 'Contemporary', 'Chamber Music'],
    availability: ['Weekends', 'Evenings'],
    portfolio: [
      'https://images.unsplash.com/photo-1727831140213-18650ae7ef36?w=400'
    ],
    verified: true,
    responseTime: '< 3 hours',
    bookingsCompleted: 189,
    servicePlans: [
      {
        id: 'p3-1',
        name: 'Solo Performance',
        price: 300,
        duration: 2,
        description: 'Elegant violin performance for intimate occasions',
        includes: [
          'Solo violin performance',
          'Classical & contemporary repertoire',
          'Up to 10 songs',
          'Professional sound system',
          'Ceremony or cocktail hour'
        ]
      },
      {
        id: 'p3-2',
        name: 'Duo Ensemble',
        price: 550,
        duration: 3,
        description: 'Beautiful violin and piano/cello combination',
        includes: [
          'Violin + Piano or Cello',
          'Extended repertoire',
          'Custom song requests',
          'Ceremony & cocktail hour',
          'Professional audio setup',
          'Coordination meeting'
        ],
        popular: true
      },
      {
        id: 'p3-3',
        name: 'String Quartet',
        price: 1000,
        duration: 4,
        description: 'Full chamber ensemble for an unforgettable experience',
        includes: [
          'Professional string quartet',
          'Complete classical repertoire',
          'Custom arrangements available',
          'Multiple performance locations',
          'Premium sound equipment',
          'Music consultation',
          'Unlimited song requests',
          'Ceremony, cocktail & reception'
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
    location: 'San Francisco, CA',
    bio: '2D/3D animator specializing in commercial work, music videos, and explainer videos. Fast turnaround guaranteed.',
    specialties: ['2D Animation', '3D Animation', 'Motion Graphics', 'Commercial Work'],
    availability: ['Weekdays', 'Remote'],
    portfolio: [
      'https://images.unsplash.com/photo-1628494391267-befcfdfaef67?w=400'
    ],
    verified: true,
    responseTime: '< 4 hours',
    bookingsCompleted: 98,
    servicePlans: [
      {
        id: 'p4-1',
        name: 'Basic Animation',
        price: 500,
        duration: 10,
        description: 'Simple 2D animation project - perfect for social media',
        includes: [
          'Up to 30 seconds animation',
          '2D animation style',
          '2 revision rounds',
          'HD export (1080p)',
          '5-7 day delivery',
          'Source files included'
        ]
      },
      {
        id: 'p4-2',
        name: 'Professional Package',
        price: 1200,
        duration: 25,
        description: 'High-quality animation for commercial use',
        includes: [
          'Up to 60 seconds animation',
          '2D or simple 3D animation',
          'Custom character design',
          '4 revision rounds',
          '4K export available',
          'Background music integration',
          'Voiceover coordination',
          '10-14 day delivery'
        ],
        popular: true
      },
      {
        id: 'p4-3',
        name: 'Premium 3D Production',
        price: 3000,
        duration: 60,
        description: 'Full 3D animation production with advanced effects',
        includes: [
          'Up to 2 minutes animation',
          'Advanced 3D animation',
          'Custom 3D modeling',
          'Complex character rigging',
          'Unlimited revisions',
          '4K/8K export',
          'Motion graphics & VFX',
          'Sound design included',
          'Storyboard development',
          'Priority support'
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
    location: 'New York, NY',
    bio: 'High-energy DJ specializing in Latin, Hip-Hop, and Top 40. Available for clubs, weddings, and private events.',
    specialties: ['Latin Music', 'Hip-Hop', 'Top 40', 'Clubs'],
    availability: ['Weekends', 'Evenings'],
    portfolio: [],
    verified: true,
    responseTime: '< 2 hours',
    bookingsCompleted: 142,
    servicePlans: [
      {
        id: 'p5-1',
        name: 'Party Starter',
        price: 400,
        duration: 3,
        description: 'Great for house parties and small events',
        includes: [
          'DJ service - 3 hours',
          'Basic sound system',
          'Latin, Hip-Hop & Top 40 mix',
          'Up to 75 guests'
        ]
      },
      {
        id: 'p5-2',
        name: 'Club Experience',
        price: 900,
        duration: 5,
        description: 'Full club atmosphere for your event',
        includes: [
          'DJ service - 5 hours',
          'Professional club sound',
          'LED lighting effects',
          'Smoke machine',
          'Custom playlist',
          'Up to 150 guests',
          'MC services'
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
    location: 'Chicago, IL',
    bio: 'Professional jazz ensemble for upscale events, corporate functions, and private parties. Classic and contemporary jazz.',
    specialties: ['Jazz', 'Corporate Events', 'Cocktail Hours', 'Galas'],
    availability: ['Weekends', 'Evenings', 'Weekdays'],
    portfolio: [],
    verified: true,
    responseTime: '< 5 hours',
    bookingsCompleted: 167,
    servicePlans: [
      {
        id: 'p6-1',
        name: 'Cocktail Hour',
        price: 500,
        duration: 2,
        description: 'Sophisticated jazz for cocktail receptions',
        includes: [
          'Professional jazz quartet',
          'Classic jazz standards',
          'Elegant ambiance',
          'Premium audio setup'
        ]
      },
      {
        id: 'p6-2',
        name: 'Evening Gala',
        price: 1200,
        duration: 4,
        description: 'Complete evening of jazz entertainment',
        includes: [
          'Full quartet performance',
          'Jazz standards & contemporary',
          'Custom song selection',
          'Multiple sets',
          'Professional sound',
          'Dinner & dancing music',
          'Event coordination'
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
    bio: 'Character animator and storyboard artist. Specializing in children\'s content and educational animations.',
    specialties: ['Character Animation', 'Storyboarding', 'Educational Content', 'Children\'s Media'],
    availability: ['Weekdays', 'Remote'],
    portfolio: [],
    verified: false,
    responseTime: '< 6 hours',
    bookingsCompleted: 52,
    servicePlans: [
      {
        id: 'p7-1',
        name: 'Character Design',
        price: 350,
        duration: 8,
        description: 'Custom character creation for your project',
        includes: [
          'Original character design',
          '3 concept sketches',
          'Final colored design',
          '2 revision rounds',
          'Source files'
        ]
      },
      {
        id: 'p7-2',
        name: 'Educational Video',
        price: 800,
        duration: 20,
        description: 'Engaging animated educational content',
        includes: [
          'Up to 3 minutes animation',
          'Educational storyboard',
          'Character animation',
          'Voiceover integration',
          'Background illustrations',
          '3 revision rounds',
          'Full HD export'
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
    bio: 'Award-winning mariachi group with traditional and modern repertoire. 8-piece band available for all occasions.',
    specialties: ['Traditional Mariachi', 'Modern Fusion', 'Weddings', 'Festivals'],
    availability: ['Weekends'],
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
        description: 'Romantic serenade with traditional songs',
        includes: [
          '6-8 traditional songs',
          '4-5 professional musicians',
          'Traditional attire',
          'Romantic repertoire'
        ]
      },
      {
        id: 'p8-2',
        name: 'Fiesta Grande',
        price: 700,
        duration: 4,
        description: 'Complete mariachi experience for celebrations',
        includes: [
          'Full 8-piece band',
          'Traditional & modern songs',
          'Complete traditional attire',
          'Custom song requests',
          'Sound system included',
          'Event coordination',
          'Photo opportunities'
        ],
        popular: true
      },
      {
        id: 'p8-3',
        name: 'Boda Imperial',
        price: 1200,
        duration: 6,
        description: 'Premium wedding package with full production',
        includes: [
          '10-piece professional band',
          'Ceremony & reception music',
          'Premium traditional attire',
          'Unlimited song requests',
          'Professional sound & lighting',
          'Personalized coordination',
          'Multiple performance areas',
          'Champagne toast music',
          'Grand entrance & exits'
        ]
      }
    ]
  }
];

export const mockServices: Service[] = [
  {
    id: 's1',
    artistId: '1',
    name: 'Wedding Performance - 3 Hours',
    description: 'Full mariachi experience for your special day',
    price: 450,
    duration: 3,
    category: 'Mariachi'
  },
  {
    id: 's2',
    artistId: '2',
    name: 'Premium DJ Package - 4 Hours',
    description: 'Complete DJ service with lights and sound',
    price: 800,
    duration: 4,
    category: 'DJ'
  }
];
