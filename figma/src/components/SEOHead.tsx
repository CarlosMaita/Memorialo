import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  structuredData?: object | object[];
  keywords?: string;
}

const SITE_NAME = 'Memorialo';
const DEFAULT_DESCRIPTION =
  'Memorialo es el marketplace para conectar proveedores de eventos con clientes en Venezuela. Encuentra los mejores servicios para bodas, fiestas, eventos corporativos y celebraciones.';
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop';
const forceNoindexByEnv = String((import.meta as any).env?.VITE_NOINDEXE ?? (import.meta as any).env?.VITE_NOINDEX ?? 'false').toLowerCase() === 'true';

/**
 * SEOHead: Manages dynamic <head> meta tags for SEO.
 * Uses direct DOM manipulation since react-helmet is not available in this SPA environment.
 * Every page/view should render this component with the appropriate props.
 */
export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  structuredData,
  keywords,
}: SEOHeadProps) {
  const effectiveNoindex = noindex || forceNoindexByEnv;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Marketplace de Servicios para Eventos`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = canonical ? `${origin}${canonical}` : `${origin}${window.location.pathname}`;

  useEffect(() => {
    // --- Title ---
    document.title = fullTitle;

    // --- Helper to set/create a meta tag ---
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // --- Standard meta ---
    setMeta('name', 'description', description);
    if (keywords) {
      setMeta('name', 'keywords', keywords);
    }
    setMeta('name', 'robots', effectiveNoindex ? 'noindex, nofollow' : 'index, follow');

    // --- Canonical ---
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);

    // --- Open Graph ---
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'es_VE');

    // --- Twitter Card ---
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // --- JSON-LD Structured Data ---
    // Remove any previous structured data injected by this component
    document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());

    const schemas: object[] = [];

    // Always include Organization schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Memorialo',
      url: origin,
      logo: `${origin}/favicon.svg`,
      description: DEFAULT_DESCRIPTION,
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Spanish'],
      },
    });

    // Always include WebSite with SearchAction
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Memorialo',
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    // Add page-specific structured data
    if (structuredData) {
      if (Array.isArray(structuredData)) {
        schemas.push(...structuredData);
      } else {
        schemas.push(structuredData);
      }
    }

    // Inject all schemas
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    };
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, effectiveNoindex, keywords, structuredData]);

  return null; // This component only manages <head>
}

// =======================================================
// Utility: build JSON-LD for a service (Artist) listing
// =======================================================
export function buildServiceStructuredData(service: {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  bio?: string;
  image: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  location: string;
  verified?: boolean;
  portfolio?: string[];
  seoPath?: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const serviceUrl = service.seoPath ? `${origin}${service.seoPath}` : `${origin}/servicio/${service.id}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.bio || `Servicio profesional de ${service.subcategory || service.category} en ${service.location}`,
    url: serviceUrl,
    image: service.image,
    provider: {
      '@type': 'LocalBusiness',
      name: service.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: service.location,
        addressCountry: 'VE',
      },
    },
    areaServed: {
      '@type': 'Place',
      name: service.location,
    },
    category: service.subcategory || service.category,
    offers: {
      '@type': 'Offer',
      price: service.pricePerHour,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  // Add aggregate rating if reviews exist
  if (service.reviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: service.rating.toFixed(1),
      reviewCount: service.reviews,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add images
  if (service.portfolio && service.portfolio.length > 0) {
    schema.image = [service.image, ...service.portfolio];
  }

  // Breadcrumb for the service page
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: service.subcategory || service.category,
        item: `${origin}/?category=${encodeURIComponent(service.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.name,
        item: serviceUrl,
      },
    ],
  };

  return [schema, breadcrumb];
}

// =======================================================
// Utility: build JSON-LD for the home/marketplace page
// =======================================================
export function buildMarketplaceStructuredData(services: Array<{
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  location: string;
}>) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // ItemList of services for the marketplace
  const itemList: any = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Servicios disponibles en Memorialo',
    description: 'Encuentra los mejores proveedores de servicios para tus eventos en Venezuela',
    numberOfItems: services.length,
    itemListElement: services.slice(0, 30).map((svc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${origin}/servicio/${svc.id}`,
      name: svc.name,
      image: svc.image,
    })),
  };

  // FAQPage for common questions (boosts rich results)
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como funciona Memorialo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Memorialo es un marketplace que conecta proveedores de servicios para eventos con clientes. Puedes buscar servicios por categoria, ubicacion y precio, comparar opciones y reservar directamente en la plataforma.',
        },
      },
      {
        '@type': 'Question',
        name: 'Que tipos de servicios puedo encontrar en Memorialo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ofrecemos una amplia variedad de servicios: musica y DJs, catering, decoracion, fotografia y video, espacios para eventos, coordinacion logistica, pasteleria, y mucho mas.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como me registro como proveedor en Memorialo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Registrate gratis en la plataforma, activa tu perfil de proveedor, crea tus publicaciones de servicios con fotos y precios, y comienza a recibir reservas de clientes.',
        },
      },
      {
        '@type': 'Question',
        name: 'En que ciudades de Venezuela opera Memorialo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Memorialo opera en las principales ciudades de Venezuela, incluyendo Caracas, Maracaibo, Valencia, Barquisimeto, Merida, y muchas mas.',
        },
      },
    ],
  };

  return [itemList, faq];
}
