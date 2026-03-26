<?php

namespace Database\Seeders;

use App\Models\BillingInvoice;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatMessageRead;
use App\Models\ChatParticipant;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LoadTestSeeder extends Seeder
{
    public function run(): void
    {
        $providersCount = max(1, (int) env('LOAD_TEST_PROVIDERS', 120));
        $clientsCount = max(1, (int) env('LOAD_TEST_CLIENTS', 300));
        $servicesPerProvider = max(1, (int) env('LOAD_TEST_SERVICES_PER_PROVIDER', 20));
        $bookingsCount = max(1, (int) env('LOAD_TEST_BOOKINGS', 3000));
        $chatsCount = max(1, (int) env('LOAD_TEST_CHATS', 700));
        $messagesPerChat = max(1, (int) env('LOAD_TEST_MESSAGES_PER_CHAT', 8));
        $notificationsPerUser = max(0, (int) env('LOAD_TEST_NOTIFICATIONS_PER_USER', 4));
        $providerCategories = [
            'ESPACIOS Y LOCACIONES',
            'TALENTO Y ENTRETENIMIENTO',
            'GASTRONOMÍA Y SERVICIOS',
            'AMBIENTACIÓN Y DECORACIÓN',
            'DETALLES Y LOGÍSTICA',
        ];

        $this->cleanupLoadTestData();

        $adminUser = User::updateOrCreate(
            ['email' => 'load.admin@memorialo.test'],
            [
                'name' => 'Load Admin',
                'password' => Hash::make('LoadTest123!'),
                'phone' => '0000000000',
                'role' => 'admin',
                'is_provider' => false,
                'provider_request_status' => 'none',
                'banned' => false,
                'archived' => false,
                'provider_id' => null,
                'provider_requested_at' => null,
                'provider_approved_at' => null,
                'provider_approved_by' => null,
                'billing_suspended_at' => null,
                'billing_suspension_reason' => null,
            ]
        );

        $providers = [];
        $providerUsers = [];

        for ($i = 1; $i <= $providersCount; $i++) {
            $providerUser = User::create([
                'name' => sprintf('Load Provider %03d', $i),
                'email' => sprintf('load.provider.%03d@memorialo.test', $i),
                'password' => Hash::make('LoadTest123!'),
                'phone' => sprintf('0414%06d', $i),
                'role' => 'provider',
                'is_provider' => true,
                'provider_request_status' => 'approved',
                'provider_requested_at' => now()->subDays(30),
                'provider_approved_at' => now()->subDays(29),
                'provider_approved_by' => $adminUser->id,
                'banned' => false,
                'archived' => false,
            ]);

            $provider = Provider::create([
                'user_id' => $providerUser->id,
                'business_name' => sprintf('Proveedor Carga %03d', $i),
                'category' => $providerCategories[$i % count($providerCategories)],
                'description' => 'Cuenta de proveedor para pruebas de carga.',
                'legal_entity_type' => $i % 3 === 0 ? 'company' : 'person',
                'identification_number' => sprintf('J-%08d', $i),
                'verified' => true,
                'verified_at' => now()->subDays(20),
                'verified_by' => (string) $adminUser->id,
                'rating' => 4.6,
                'total_bookings' => 0,
                'services' => [],
            ]);

            $providerUser->forceFill(['provider_id' => $provider->id])->save();
            $providerUsers[] = $providerUser;
            $providers[] = $provider;
        }

        $services = [];
        $cities = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Puerto La Cruz'];
        $serviceTypeCatalog = [
            [
                'category' => 'ESPACIOS Y LOCACIONES',
                'subcategory' => 'Salones y Banquetes',
                'specialties' => ['Bodas', 'Fiestas privadas', 'Eventos corporativos', 'Montaje interior'],
            ],
            [
                'category' => 'ESPACIOS Y LOCACIONES',
                'subcategory' => 'Lugares Únicos',
                'specialties' => ['Experiencias boutique', 'Eventos al atardecer', 'Locaciones premium', 'Producción especial'],
            ],
            [
                'category' => 'TALENTO Y ENTRETENIMIENTO',
                'subcategory' => 'Música y DJs',
                'specialties' => ['Bodas', 'Fiestas privadas', 'Eventos corporativos', 'Animación en vivo'],
            ],
            [
                'category' => 'TALENTO Y ENTRETENIMIENTO',
                'subcategory' => 'Artistas en Vivo',
                'specialties' => ['Shows temáticos', 'Performance en vivo', 'Animación', 'Actos especiales'],
            ],
            [
                'category' => 'GASTRONOMÍA Y SERVICIOS',
                'subcategory' => 'Catering y Banquetería',
                'specialties' => ['Menús personalizados', 'Eventos sociales', 'Coffee breaks', 'Servicio premium'],
            ],
            [
                'category' => 'GASTRONOMÍA Y SERVICIOS',
                'subcategory' => 'Pastelería y Repostería',
                'specialties' => ['Tortas temáticas', 'Mesas dulces', 'Postres personalizados', 'Repostería creativa'],
            ],
            [
                'category' => 'AMBIENTACIÓN Y DECORACIÓN',
                'subcategory' => 'Decoración y Mobiliario',
                'specialties' => ['Centros de mesa', 'Backings decorativos', 'Mobiliario lounge', 'Montaje temático'],
            ],
            [
                'category' => 'DETALLES Y LOGÍSTICA',
                'subcategory' => 'Fotografía y Video',
                'specialties' => ['Retratos', 'Cobertura de eventos', 'Reels y video corto', 'Edición profesional'],
            ],
            [
                'category' => 'DETALLES Y LOGÍSTICA',
                'subcategory' => 'Coordinación y Logística',
                'specialties' => ['Cronograma del evento', 'Coordinación de proveedores', 'Logística operativa', 'Supervisión en sitio'],
            ],
        ];
        $availabilityPresets = [
            ['Lunes', 'Martes', 'Miércoles', 'Jueves'],
            ['Viernes', 'Sábado', 'Domingo'],
            ['Martes', 'Jueves', 'Sábado'],
            ['Miércoles', 'Viernes', 'Domingo'],
        ];
        $responseTimes = ['< 1 hora', '< 2 horas', 'Mismo dia', '24 horas'];
        $fakeServiceImagesBySubcategory = [
            'Salones y Banquetes' => [
                'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Lugares Únicos' => [
                'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Música y DJs' => [
                'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Artistas en Vivo' => [
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Catering y Banquetería' => [
                'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Pastelería y Repostería' => [
                'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Decoración y Mobiliario' => [
                'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Fotografía y Video' => [
                'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1495745966610-2a67f2297e63?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
            'Coordinación y Logística' => [
                'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=800&q=80',
            ],
        ];
        $defaultFakeServiceImages = [
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=800&q=80',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&h=800&q=80',
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&h=800&q=80',
            'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&h=800&q=80',
        ];

        foreach ($providers as $providerIndex => $provider) {
            $providerUser = $providerUsers[$providerIndex];

            for ($s = 1; $s <= $servicesPerProvider; $s++) {
                $imageSeedBase = ($providerIndex + 1) * 1000 + $s;
                $serviceType = $serviceTypeCatalog[$imageSeedBase % count($serviceTypeCatalog)];
                $category = $serviceType['category'];
                $subcategory = $serviceType['subcategory'];
                $imageSet = $fakeServiceImagesBySubcategory[$subcategory] ?? $defaultFakeServiceImages;
                $mainImage = $imageSet[$imageSeedBase % count($imageSet)];
                $portfolio = [
                    $imageSet[($imageSeedBase + 1) % count($imageSet)],
                    $imageSet[($imageSeedBase + 2) % count($imageSet)],
                    $imageSet[($imageSeedBase + 3) % count($imageSet)],
                ];
                $servicePrice = rand(80, 350);
                $specialties = $serviceType['specialties'];
                shuffle($specialties);
                $serviceTitle = sprintf('%s para eventos %03d-%03d', $subcategory, $providerIndex + 1, $s);
                $serviceDescription = sprintf(
                    'Servicio de %s generado para pruebas de carga y validacion visual, con enfoque en %s y cobertura en %s.',
                    mb_strtolower($subcategory),
                    implode(', ', array_slice($specialties, 0, 2)),
                    $cities[$s % count($cities)]
                );

                $servicePlans = [
                    [
                        'id' => sprintf('load-plan-%d-basic', $imageSeedBase),
                        'name' => 'Plan Basico',
                        'price' => max(40, $servicePrice - 35),
                        'duration' => 2,
                        'description' => 'Cobertura esencial para eventos pequenos.',
                        'includes' => [
                            'Atencion previa por chat',
                            '2 horas de servicio',
                            'Entrega estandar',
                        ],
                    ],
                    [
                        'id' => sprintf('load-plan-%d-pro', $imageSeedBase),
                        'name' => 'Plan Pro',
                        'price' => $servicePrice,
                        'duration' => 4,
                        'description' => 'La opcion mas solicitada para eventos medianos.',
                        'includes' => [
                            'Asesoria previa',
                            '4 horas de servicio',
                            'Soporte durante evento',
                            'Entrega prioritaria',
                        ],
                        'popular' => true,
                    ],
                    [
                        'id' => sprintf('load-plan-%d-premium', $imageSeedBase),
                        'name' => 'Plan Premium',
                        'price' => $servicePrice + 120,
                        'duration' => 6,
                        'description' => 'Cobertura completa para eventos de alto impacto.',
                        'includes' => [
                            'Reunion de planificacion',
                            '6 horas de servicio',
                            'Equipo extendido',
                            'Entrega express + soporte postevento',
                        ],
                    ],
                ];

                $service = Service::create([
                    'user_id' => $providerUser->id,
                    'provider_id' => $provider->id,
                    'title' => $serviceTitle,
                    'description' => $serviceDescription,
                    'category' => $category,
                    'subcategory' => $subcategory,
                    'city' => $cities[$s % count($cities)],
                    'price' => $servicePrice,
                    'rating' => 5.0,
                    'reviews_count' => 0,
                    'bookings_completed' => rand(10, 200),
                    'is_active' => true,
                    'metadata' => [
                        'publicCode' => sprintf('LOAD-%03d-%03d', $providerIndex + 1, $s),
                        'responseTime' => $responseTimes[$imageSeedBase % count($responseTimes)],
                        'availability' => $availabilityPresets[$imageSeedBase % count($availabilityPresets)],
                        'specialties' => array_slice($specialties, 0, 3),
                        'servicePlans' => $servicePlans,
                        'allowCustomHourly' => (bool) ($imageSeedBase % 2),
                        'image' => $mainImage,
                        'portfolio' => $portfolio,
                        'isPublished' => true,
                        'seed' => 'load-test',
                    ],
                ]);

                $services[] = $service;
            }
        }

        $clients = [];

        for ($i = 1; $i <= $clientsCount; $i++) {
            $clients[] = User::create([
                'name' => sprintf('Load Client %03d', $i),
                'email' => sprintf('load.client.%03d@memorialo.test', $i),
                'password' => Hash::make('LoadTest123!'),
                'phone' => sprintf('0424%06d', $i),
                'role' => 'user',
                'is_provider' => false,
                'provider_request_status' => 'none',
                'banned' => false,
                'archived' => false,
            ]);
        }

        $bookings = [];
        $contracts = [];
        $reviewsByService = [];
        $contractStatuses = ['draft', 'signed', 'active', 'completed'];
        $bookingStatuses = ['pending', 'confirmed', 'completed'];
        $reviewSnippets = [
            'Excelente servicio, muy puntual y super profesional durante todo el evento.',
            'La comunicacion fue rapida y el resultado supero nuestras expectativas.',
            'Todo el equipo quedo encantado, repetiriamos sin dudarlo.',
            'Muy buena atencion y cumplimiento en tiempos, recomendado.',
            'Se adapto perfecto a lo que necesitabamos y cuido cada detalle.',
            'Gran experiencia de principio a fin, trato amable y resultado impecable.',
        ];

        for ($i = 1; $i <= $bookingsCount; $i++) {
            $service = $services[array_rand($services)];
            $client = $clients[array_rand($clients)];
            $providerUser = $providerUsers[array_search($service->provider_id, array_map(static fn (Provider $provider) => $provider->id, $providers), true)];

            $bookingId = sprintf('load-booking-%05d', $i);
            $contractId = sprintf('load-contract-%05d', $i);

            $booking = Booking::create([
                'id' => $bookingId,
                'artist_id' => (string) $service->id,
                'artist_user_id' => (string) $providerUser->id,
                'artist_name' => $service->title,
                'user_id' => (string) $client->id,
                'client_name' => $client->name,
                'client_email' => $client->email,
                'client_phone' => $client->phone,
                'date' => now()->addDays(rand(1, 120))->toDateString(),
                'start_time' => sprintf('%02d:00', rand(8, 20)),
                'duration' => rand(1, 6),
                'event_type' => 'evento privado',
                'location' => $service->city,
                'special_requests' => null,
                'total_price' => $service->price,
                'status' => $bookingStatuses[array_rand($bookingStatuses)],
                'plan_id' => 'load-plan-basic',
                'plan_name' => 'Plan Basico',
                'contract_id' => $contractId,
                'metadata' => ['seed' => 'load-test'],
            ]);

            $contractStatus = $contractStatuses[array_rand($contractStatuses)];
            $contract = Contract::create([
                'id' => $contractId,
                'booking_id' => $bookingId,
                'artist_id' => (string) $service->id,
                'artist_user_id' => (string) $providerUser->id,
                'artist_name' => $service->title,
                'artist_email' => $providerUser->email,
                'artist_whatsapp' => $providerUser->phone,
                'client_id' => (string) $client->id,
                'client_name' => $client->name,
                'client_email' => $client->email,
                'client_whatsapp' => $client->phone,
                'event_id' => null,
                'status' => $contractStatus,
                'terms' => [
                    'price' => (float) $service->price,
                    'currency' => 'USD',
                    'startDate' => $booking->date,
                ],
                'artist_signature' => null,
                'client_signature' => null,
                'completed_at' => $contractStatus === 'completed' ? now()->subDays(rand(1, 30)) : null,
                'metadata' => ['seed' => 'load-test'],
            ]);

            $bookings[] = $booking;
            $contracts[] = $contract;

            if ($booking->status === 'completed' && rand(1, 100) <= 65) {
                $ratingRoll = rand(1, 100);
                $rating = $ratingRoll <= 8 ? 3 : ($ratingRoll <= 35 ? 4 : 5);

                Review::create([
                    'contract_id' => $contractId,
                    'booking_id' => $bookingId,
                    'artist_id' => (int) $service->id,
                    'user_id' => (int) $client->id,
                    'user_name' => $client->name,
                    'user_avatar' => null,
                    'rating' => $rating,
                    'comment' => $reviewSnippets[array_rand($reviewSnippets)],
                ]);

                if (! isset($reviewsByService[$service->id])) {
                    $reviewsByService[$service->id] = ['count' => 0, 'sum' => 0];
                }

                $reviewsByService[$service->id]['count']++;
                $reviewsByService[$service->id]['sum'] += $rating;
            }
        }

        foreach ($reviewsByService as $serviceId => $stats) {
            Service::query()
                ->whereKey($serviceId)
                ->update([
                    'reviews_count' => $stats['count'],
                    'rating' => round($stats['sum'] / max(1, $stats['count']), 2),
                ]);
        }

        foreach ($providers as $provider) {
            for ($monthOffset = 0; $monthOffset < 6; $monthOffset++) {
                $monthDate = now()->subMonths($monthOffset);

                BillingInvoice::create([
                    'provider_id' => $provider->id,
                    'month' => $monthDate->format('Y-m'),
                    'period_start' => $monthDate->copy()->startOfMonth()->toDateString(),
                    'period_end' => $monthDate->copy()->endOfMonth()->toDateString(),
                    'commission_rate' => 0.0800,
                    'contract_count' => rand(6, 30),
                    'total_sales' => rand(1000, 12000),
                    'amount' => rand(80, 960),
                    'status' => ['pending', 'submitted', 'approved'][rand(0, 2)],
                    'due_date' => $monthDate->copy()->endOfMonth()->addDays(5),
                    'grace_period_end' => $monthDate->copy()->endOfMonth()->addDays(12),
                    'generated_at' => $monthDate->copy()->endOfMonth(),
                    'billing_snapshot' => ['seed' => 'load-test'],
                ]);
            }
        }

        $conversationPool = [];

        for ($i = 1; $i <= min($chatsCount, count($bookings)); $i++) {
            $booking = $bookings[$i - 1];
            $service = Service::find((int) $booking->artist_id);

            if (! $service) {
                continue;
            }

            $conversation = ChatConversation::create([
                'id' => (string) Str::uuid(),
                'booking_id' => $booking->id,
                'service_id' => $service->id,
                'client_user_id' => (int) $booking->user_id,
                'provider_user_id' => (int) $booking->artist_user_id,
                'requires_admin_intervention' => false,
                'last_message_at' => now()->subMinutes(rand(1, 180)),
                'expires_at' => now()->addDays(30),
            ]);

            ChatParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => (int) $booking->user_id,
                'role' => 'client',
                'joined_at' => now()->subDays(2),
            ]);

            ChatParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => (int) $booking->artist_user_id,
                'role' => 'provider',
                'joined_at' => now()->subDays(2),
            ]);

            for ($m = 1; $m <= $messagesPerChat; $m++) {
                $isClientAuthor = $m % 2 === 0;
                $authorId = $isClientAuthor ? (int) $booking->user_id : (int) $booking->artist_user_id;
                $readerId = $isClientAuthor ? (int) $booking->artist_user_id : (int) $booking->user_id;

                $message = ChatMessage::create([
                    'id' => (string) Str::uuid(),
                    'conversation_id' => $conversation->id,
                    'author_user_id' => $authorId,
                    'body' => sprintf('Mensaje carga %d-%d', $i, $m),
                ]);

                if ($m < $messagesPerChat) {
                    ChatMessageRead::create([
                        'message_id' => $message->id,
                        'user_id' => $readerId,
                        'read_at' => now()->subMinutes(rand(1, 120)),
                    ]);
                }
            }

            $conversationPool[] = $conversation;
        }

        $allUsers = array_merge([$adminUser], $providerUsers, $clients);
        $notificationRows = [];

        if ($notificationsPerUser > 0) {
            foreach ($allUsers as $user) {
                for ($n = 1; $n <= $notificationsPerUser; $n++) {
                    $notificationRows[] = [
                        'id' => (string) Str::uuid(),
                        'type' => 'App\\Notifications\\DatabaseNotification',
                        'notifiable_type' => User::class,
                        'notifiable_id' => $user->id,
                        'data' => json_encode([
                            'notificationType' => 'system_alert',
                            'title' => 'Carga: evento de prueba',
                            'body' => sprintf('Notificacion %d para %s', $n, $user->email),
                            'priority' => 'normal',
                            'entity' => ['type' => 'seed', 'id' => 'load-test'],
                            'ctaUrl' => '/',
                        ], JSON_UNESCAPED_UNICODE),
                        'read_at' => $n % 3 === 0 ? now()->subMinutes(rand(1, 90)) : null,
                        'created_at' => now()->subMinutes(rand(1, 300)),
                        'updated_at' => now(),
                    ];
                }
            }

            foreach (array_chunk($notificationRows, 1000) as $chunk) {
                DB::table('notifications')->insert($chunk);
            }
        }

        $this->command?->info('LoadTestSeeder completado.');
        $this->command?->line('Credenciales de prueba:');
        $this->command?->line('- Admin: load.admin@memorialo.test / LoadTest123!');
        $this->command?->line('- Provider: load.provider.001@memorialo.test / LoadTest123!');
        $this->command?->line('- Client: load.client.001@memorialo.test / LoadTest123!');
        $this->command?->line(sprintf('Resumen: %d providers, %d clients, %d services, %d bookings, %d chats.', $providersCount, $clientsCount, count($services), count($bookings), count($conversationPool)));
    }

    private function cleanupLoadTestData(): void
    {
        DB::table('notifications')
            ->where('data', 'like', '%load-test%')
            ->delete();

        ChatMessageRead::query()
            ->whereIn('message_id', function ($query) {
                $query->select('id')->from('chat_messages')->where('body', 'like', 'Mensaje carga %');
            })
            ->delete();

        ChatMessage::query()->where('body', 'like', 'Mensaje carga %')->delete();

        ChatParticipant::query()
            ->whereIn('conversation_id', function ($query) {
                $query->select('id')->from('chat_conversations')->where('booking_id', 'like', 'load-booking-%');
            })
            ->delete();

        ChatConversation::query()->where('booking_id', 'like', 'load-booking-%')->delete();

        Contract::query()->where('id', 'like', 'load-contract-%')->delete();
        Booking::query()->where('id', 'like', 'load-booking-%')->delete();
        Review::query()->where('booking_id', 'like', 'load-booking-%')->delete();

        BillingInvoice::query()
            ->whereIn('provider_id', function ($query) {
                $query->select('id')->from('providers')->where('user_id', 'in', function ($sub) {
                    $sub->select('id')->from('users')->where('email', 'like', 'load.provider.%@memorialo.test');
                });
            })
            ->delete();

        Service::query()->whereJsonContains('metadata->seed', 'load-test')->delete();

        Provider::query()
            ->whereIn('user_id', function ($query) {
                $query->select('id')->from('users')->where('email', 'like', 'load.provider.%@memorialo.test');
            })
            ->delete();

        User::query()->where('email', 'like', 'load.client.%@memorialo.test')->delete();
        User::query()->where('email', 'like', 'load.provider.%@memorialo.test')->delete();
        User::query()->where('email', 'load.admin@memorialo.test')->delete();
    }
}
