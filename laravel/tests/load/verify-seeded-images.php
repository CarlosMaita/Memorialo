<?php

declare(strict_types=1);

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$totalServices = App\Models\Service::query()->count();
$activeServices = App\Models\Service::query()->where('is_active', true)->count();

fwrite(STDOUT, "total_services={$totalServices}\n");
fwrite(STDOUT, "active_services={$activeServices}\n");

$service = App\Models\Service::query()
    ->whereJsonContains('metadata->seed', 'load-test')
    ->latest()
    ->first();

if (! $service) {
    fwrite(STDOUT, "no-service\n");
    exit(0);
}

$metadata = is_array($service->metadata) ? $service->metadata : [];
$image = (string) ($metadata['image'] ?? 'no-image');
$portfolioCount = is_array($metadata['portfolio'] ?? null) ? count($metadata['portfolio']) : 0;
$isArchived = (bool) ($metadata['isArchived'] ?? false);
$isPublished = array_key_exists('isPublished', $metadata) ? (bool) $metadata['isPublished'] : null;
$availabilityCount = is_array($metadata['availability'] ?? null) ? count($metadata['availability']) : 0;
$specialtiesCount = is_array($metadata['specialties'] ?? null) ? count($metadata['specialties']) : 0;
$plansCount = is_array($metadata['servicePlans'] ?? null) ? count($metadata['servicePlans']) : 0;
$responseTime = (string) ($metadata['responseTime'] ?? 'n/a');

fwrite(STDOUT, "category={$service->category}\n");
fwrite(STDOUT, "subcategory={$service->subcategory}\n");
fwrite(STDOUT, "title={$service->title}\n");
fwrite(STDOUT, "description={$service->description}\n");
fwrite(STDOUT, "image={$image}\n");
fwrite(STDOUT, "portfolio_count={$portfolioCount}\n");
fwrite(STDOUT, "response_time={$responseTime}\n");
fwrite(STDOUT, "availability_count={$availabilityCount}\n");
fwrite(STDOUT, "specialties_count={$specialtiesCount}\n");
fwrite(STDOUT, "service_plans_count={$plansCount}\n");
fwrite(STDOUT, 'service_is_active='.(int) $service->is_active."\n");
fwrite(STDOUT, 'service_is_archived='.(int) $isArchived."\n");
fwrite(STDOUT, 'service_is_published='.(is_null($isPublished) ? 'null' : (string) (int) $isPublished)."\n");
