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

    public const CHAT_MESSAGE_RECEIVED = 'chat_message_received';

    public const CHAT_INTERVENTION_REQUESTED = 'chat_intervention_requested';

    public const BILLING_INVOICE_GENERATED = 'billing_invoice_generated';

    public const BILLING_PAYMENT_SUBMITTED = 'billing_payment_submitted';

    public const BILLING_PAYMENT_APPROVED = 'billing_payment_approved';

    public const BILLING_PAYMENT_REJECTED = 'billing_payment_rejected';

    public const BILLING_ACCOUNT_SUSPENDED = 'billing_account_suspended';

    public const CONTRACT_SENT_TO_CLIENT = 'contract_sent_to_client';

    public const CONTRACT_REJECTED_BY_CLIENT = 'contract_rejected_by_client';

    public const ALL = [
        self::WELCOME,
        self::SERVICE_REQUEST_CREATED,
        self::CONTRACT_APPROVED,
        self::CONTRACT_SENT_TO_CLIENT,
        self::CONTRACT_REJECTED_BY_CLIENT,
        self::REVIEW_REQUESTED,
        self::REVIEW_RECEIVED,
        self::PROVIDER_ROLE_ACTIVATED,
        self::CHAT_MESSAGE_RECEIVED,
        self::CHAT_INTERVENTION_REQUESTED,
        self::BILLING_INVOICE_GENERATED,
        self::BILLING_PAYMENT_SUBMITTED,
        self::BILLING_PAYMENT_APPROVED,
        self::BILLING_PAYMENT_REJECTED,
        self::BILLING_ACCOUNT_SUSPENDED,
    ];
}
