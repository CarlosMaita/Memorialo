<?php

declare(strict_types=1);

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$loadReviews = App\Models\Review::query()
    ->where('booking_id', 'like', 'load-booking-%')
    ->count();

fwrite(STDOUT, "load_reviews={$loadReviews}\n");

$service = App\Models\Service::query()
    ->whereJsonContains('metadata->seed', 'load-test')
    ->where('reviews_count', '>', 0)
    ->latest()
    ->first();

if (! $service) {
    fwrite(STDOUT, "service_with_reviews=none\n");
    exit(0);
}

fwrite(STDOUT, "service_id={$service->id}\n");
fwrite(STDOUT, "service_title={$service->title}\n");
fwrite(STDOUT, "service_reviews_count={$service->reviews_count}\n");
fwrite(STDOUT, "service_rating={$service->rating}\n");

$sampleReview = App\Models\Review::query()
    ->where('artist_id', $service->id)
    ->latest()
    ->first();

if ($sampleReview) {
    fwrite(STDOUT, "sample_review_rating={$sampleReview->rating}\n");
    fwrite(STDOUT, "sample_review_comment={$sampleReview->comment}\n");
}
