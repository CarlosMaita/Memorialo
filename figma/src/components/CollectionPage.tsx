import { ArrowLeft, Link2 } from 'lucide-react';
import { Artist } from '../types';
import { buildMarketplaceStructuredData, SEOHead } from './SEOHead';
import { ArtistCard } from './ArtistCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type ServiceCollection = {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  services: Artist[];
};

interface CollectionPageProps {
  collection: ServiceCollection | null;
  isLoading?: boolean;
  notFound?: boolean;
  onBack: () => void;
  onViewProfile: (artist: Artist, anchorElement?: HTMLElement | null) => void;
}

export function CollectionPage({
  collection,
  isLoading = false,
  notFound = false,
  onBack,
  onViewProfile,
}: CollectionPageProps) {
  if (isLoading && !collection) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-500">Cargando colección...</p>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#1B2A47]">Colección no encontrada</h1>
        <p className="text-sm text-gray-600">La colección solicitada no existe o ya no está disponible.</p>
        <Button type="button" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al marketplace
        </Button>
      </div>
    );
  }

  const visibleServices = collection.services.filter((service) => !(service.isArchived || service.isPublished === false));
  const canonicalPath = `/coleccion/${collection.slug}`;
  const subtitle = collection.subtitle?.trim() || 'Explora servicios seleccionados por Memorialo para tu próximo evento.';

  return (
    <div className="space-y-6">
      <SEOHead
        title={collection.title}
        description={subtitle}
        canonical={canonicalPath}
        keywords={`${collection.title}, coleccion de servicios, servicios para eventos, memorialo`}
        noindex={visibleServices.length === 0}
        structuredData={[
          ...buildMarketplaceStructuredData(visibleServices),
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: typeof window !== 'undefined' ? window.location.origin : '',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: collection.title,
                item: typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : canonicalPath,
              },
            ],
          },
        ]}
      />

      <section className="rounded-2xl border border-[#1B2A47]/10 bg-white p-6 md:p-8 shadow-sm">
        <Button type="button" variant="ghost" className="mb-4 -ml-3 text-[#1B2A47]" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="space-y-3">
          <Badge variant="outline" className="border-[#D4AF37]/40 bg-amber-50 text-[#8A6116]">
            <Link2 className="w-3 h-3 mr-1" />
            /coleccion/{collection.slug}
          </Badge>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#1B2A47]">{collection.title}</h1>
            <p className="mt-2 max-w-3xl text-sm md:text-base text-gray-600">{subtitle}</p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {visibleServices.length} servicio{visibleServices.length === 1 ? '' : 's'} en esta colección
          </p>
        </div>
      </section>

      {visibleServices.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-[#1B2A47]">Servicios seleccionados</h2>
            <p className="text-sm text-gray-600">Descubre publicaciones agrupadas para esta intención de búsqueda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3">
            {visibleServices.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-600">Esta colección aún no tiene servicios públicos disponibles.</p>
        </section>
      )}
    </div>
  );
}
