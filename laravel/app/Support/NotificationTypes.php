<?php

namespace App\Support;

class NotificationTypes
{
    public const WELCOME = 'welcome';

    public const SERVICE_REQUEST_CREATED = 'service_request_created';

    public const CONTRACT_APPROVED = 'contract_approved';

    public const REVIEW_REQUESTED = 'review_requested';

    public const REVIEW_RECEIVED = 'review_received';

    public const PROVIDER_ROLE_ACTIVATED = 'provider_role_activated';

    public const ALL = [
        self::WELCOME,
        self::SERVICE_REQUEST_CREATED,
        self::CONTRACT_APPROVED,
        self::REVIEW_REQUESTED,
        self::REVIEW_RECEIVED,
        self::PROVIDER_ROLE_ACTIVATED,
    ];
}
