/**
 * Vercel Edge Middleware – Dynamic OG meta tags for service detail pages.
 *
 * Social-media bots (WhatsApp, Facebook, Twitter, …) typically do not execute
 * JavaScript, so the client-side SEOHead component cannot update the <head>
 * before the bot reads it.  This middleware intercepts requests that match the
 * service-detail URL pattern, fetches the service from the backend API, and
 * injects service-specific Open Graph / Twitter Card meta tags into the static
 * index.html before serving it, so every bot sees the right title, description
 * and image for the shared page.
 *
 * URL pattern: /{category-slug}/{MEM-xxxxxxx}-{name-slug}
 *   e.g.  /decoracion-y-mobiliario/MEM-0000001-cabina-de-kareoke
 */

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Escape a string so it is safe to embed in an HTML attribute value. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Truncate a string to at most `max` characters. */
function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

// --------------------------------------------------------------------------
// Pattern that matches a service-detail path
// --------------------------------------------------------------------------
const SERVICE_PATH_RE = /^\/[a-z0-9-]+\/(MEM-\d{7})-[a-z0-9-]+\/?$/i;

// --------------------------------------------------------------------------
// Middleware
// --------------------------------------------------------------------------

export const config = {
  // Only run on two-segment paths that look like service detail URLs.
  matcher: ['/:category/:service'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  // Guard: only process requests that match the service-detail pattern.
  if (!SERVICE_PATH_RE.test(url.pathname)) {
    return undefined; // pass through
  }

  const memCodeMatch = url.pathname.match(/\/(MEM-\d{7})-/i);
  if (!memCodeMatch) {
    return undefined; // pass through
  }

  const memCode = memCodeMatch[1].toUpperCase();

  // ------------------------------------------------------------------
  // Fetch service data from the backend API
  // ------------------------------------------------------------------
  const apiBase =
    process.env.VITE_LARAVEL_API_BASE_URL ||
    process.env.LARAVEL_API_BASE_URL ||
    '';

  if (!apiBase) {
    return undefined; // No API URL configured – serve index.html as-is
  }

  let serviceData: {
    name?: string;
    bio?: string;
    description?: string;
    image?: string;
    category?: string;
    subcategory?: string;
    city?: string;
    location?: string;
    pricePerHour?: number;
    price?: number;
  } | null = null;

  try {
    const apiUrl = `${apiBase}/services?public_code=${encodeURIComponent(memCode)}&per_page=1&view=summary`;
    const apiRes = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      // Edge fetch – short timeout so we don't block the response for too long
      signal: AbortSignal.timeout(3000),
    });

    if (apiRes.ok) {
      const json = (await apiRes.json()) as { data?: unknown[]; services?: unknown[] } | unknown[];
      const items = Array.isArray(json)
        ? json
        : (json as { data?: unknown[] }).data ?? (json as { services?: unknown[] }).services ?? [];

      serviceData = (items[0] as typeof serviceData) ?? null;
    }
  } catch {
    // API unreachable – fall back to default index.html
    return undefined;
  }

  if (!serviceData) {
    return undefined; // Service not found – let default SPA handle the 404
  }

  // ------------------------------------------------------------------
  // Build the service-specific meta values
  // ------------------------------------------------------------------
  const serviceName = serviceData.name ?? '';
  const category = serviceData.subcategory ?? serviceData.category ?? '';
  const location = serviceData.location ?? serviceData.city ?? '';
  const rawDesc =
    serviceData.bio ??
    serviceData.description ??
    `Contrata a ${serviceName}, servicio profesional de ${category} en ${location}.`;

  const ogTitle = escapeAttr(
    truncate(`${serviceName} - ${category} en ${location} | Memorialo`, 70)
  );
  const ogDescription = escapeAttr(truncate(rawDesc, 160));
  const ogImage = escapeAttr(
    serviceData.image && serviceData.image.startsWith('http')
      ? serviceData.image
      : 'https://memorialo.com/og-image.jpg'
  );
  const ogUrl = escapeAttr(request.url);

  // ------------------------------------------------------------------
  // Fetch and patch index.html
  // ------------------------------------------------------------------
  let html: string;
  try {
    const indexUrl = new URL('/index.html', request.url).toString();
    const htmlRes = await fetch(indexUrl, { signal: AbortSignal.timeout(3000) });
    if (!htmlRes.ok) return undefined;
    html = await htmlRes.text();
  } catch {
    return undefined;
  }

  // Replace each static tag with service-specific values.
  // The regexes are anchored to the known patterns in index.html.
  html = html
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${ogTitle}</title>`
    )
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${ogDescription}" />`
    )
    .replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${ogTitle}" />`
    )
    .replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${ogDescription}" />`
    )
    .replace(
      /<meta property="og:type"[^>]*>/,
      `<meta property="og:type" content="product" />`
    )
    .replace(
      /<meta property="og:url"[^>]*>/,
      `<meta property="og:url" content="${ogUrl}" />`
    )
    .replace(
      /<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${ogImage}" />`
    )
    .replace(
      /<meta name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${ogTitle}" />`
    )
    .replace(
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${ogDescription}" />`
    )
    .replace(
      /<meta name="twitter:image"[^>]*>/,
      `<meta name="twitter:image" content="${ogImage}" />`
    );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Cache the enriched page for 10 minutes on the CDN edge.
      'Cache-Control': 's-maxage=600, stale-while-revalidate=60',
    },
  });
}
