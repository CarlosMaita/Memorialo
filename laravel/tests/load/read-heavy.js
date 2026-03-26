import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'load.admin@memorialo.test';
const PROVIDER_EMAIL = __ENV.PROVIDER_EMAIL || 'load.provider.001@memorialo.test';
const CLIENT_EMAIL = __ENV.CLIENT_EMAIL || 'load.client.001@memorialo.test';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'LoadTest123!';

const PUBLIC_VUS = Number(__ENV.PUBLIC_VUS || 60);
const ADMIN_VUS = Number(__ENV.ADMIN_VUS || 12);
const PROVIDER_VUS = Number(__ENV.PROVIDER_VUS || 20);

const DURATION = __ENV.DURATION || '4m';

export const options = {
  scenarios: {
    public_read: {
      executor: 'constant-vus',
      exec: 'publicReadScenario',
      vus: PUBLIC_VUS,
      duration: DURATION,
    },
    admin_read: {
      executor: 'constant-vus',
      exec: 'adminReadScenario',
      vus: ADMIN_VUS,
      duration: DURATION,
      startTime: '10s',
    },
    provider_read: {
      executor: 'constant-vus',
      exec: 'providerReadScenario',
      vus: PROVIDER_VUS,
      duration: DURATION,
      startTime: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    'http_req_duration{endpoint:services}': ['p(95)<1800'],
    'http_req_duration{endpoint:admin_users}': ['p(95)<2200'],
    'http_req_duration{endpoint:billing_admin}': ['p(95)<2500'],
    'http_req_duration{endpoint:chat_conversations}': ['p(95)<2200'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

function login(email, password) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth_login' },
    }
  );

  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => Boolean(r.json('token')),
  });

  return {
    token: response.json('token'),
    user: response.json('user'),
  };
}

export function setup() {
  const admin = login(ADMIN_EMAIL, USER_PASSWORD);
  const provider = login(PROVIDER_EMAIL, USER_PASSWORD);
  const client = login(CLIENT_EMAIL, USER_PASSWORD);

  if (!admin.token || !provider.token || !client.token) {
    throw new Error('No se pudo autenticar usuarios de prueba. Ejecuta primero el seeder de carga.');
  }

  return {
    adminToken: admin.token,
    providerToken: provider.token,
    providerId: provider.user?.providerId || null,
    clientToken: client.token,
  };
}

export function publicReadScenario() {
  group('public-read', () => {
    const servicesRes = http.get(`${BASE_URL}/api/services`, {
      tags: { endpoint: 'services' },
    });

    check(servicesRes, {
      'services status 200': (r) => r.status === 200,
      'services response is array': (r) => Array.isArray(r.json()),
    });

    const providersRes = http.get(`${BASE_URL}/api/providers`, {
      tags: { endpoint: 'providers' },
    });

    check(providersRes, {
      'providers status 200': (r) => r.status === 200,
    });

    const reviewsRes = http.get(`${BASE_URL}/api/reviews`, {
      tags: { endpoint: 'reviews' },
    });

    check(reviewsRes, {
      'reviews status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 1.2 + 0.2);
}

export function adminReadScenario(data) {
  const headers = {
    Authorization: `Bearer ${data.adminToken}`,
    Accept: 'application/json',
  };

  group('admin-read', () => {
    const usersRes = http.get(`${BASE_URL}/api/admin/users`, {
      headers,
      tags: { endpoint: 'admin_users' },
    });

    check(usersRes, {
      'admin/users status 200': (r) => r.status === 200,
      'admin/users response is array': (r) => Array.isArray(r.json()),
    });

    const billingRes = http.get(`${BASE_URL}/api/billing/admin/overview`, {
      headers,
      tags: { endpoint: 'billing_admin' },
    });

    check(billingRes, {
      'billing/admin status 200': (r) => r.status === 200,
    });

    const notificationsRes = http.get(`${BASE_URL}/api/notifications?limit=20`, {
      headers,
      tags: { endpoint: 'notifications' },
    });

    check(notificationsRes, {
      'notifications status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 1.4 + 0.4);
}

export function providerReadScenario(data) {
  const headers = {
    Authorization: `Bearer ${data.providerToken}`,
    Accept: 'application/json',
  };

  group('provider-read', () => {
    const bookingsRes = http.get(`${BASE_URL}/api/bookings`, {
      headers,
      tags: { endpoint: 'bookings' },
    });

    check(bookingsRes, {
      'bookings status 200': (r) => r.status === 200,
    });

    const contractsRes = http.get(`${BASE_URL}/api/contracts`, {
      headers,
      tags: { endpoint: 'contracts' },
    });

    check(contractsRes, {
      'contracts status 200': (r) => r.status === 200,
    });

    if (data.providerId) {
      const providerBillingRes = http.get(`${BASE_URL}/api/billing/provider/${data.providerId}`, {
        headers,
        tags: { endpoint: 'billing_provider' },
      });

      check(providerBillingRes, {
        'billing/provider status 200': (r) => r.status === 200,
      });
    }

    const chatRes = http.get(`${BASE_URL}/api/chat/conversations`, {
      headers,
      tags: { endpoint: 'chat_conversations' },
    });

    check(chatRes, {
      'chat conversations status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 1.5 + 0.5);
}
