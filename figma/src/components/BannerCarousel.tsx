import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  link?: string | null;
  visible: boolean;
  order: number;
}

interface BannerCarouselProps {
  banners: BannerItem[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = banners.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
    },
    [count],
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setTimeout(() => next(), 5000);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [current, count, next]);

  if (count === 0) return null;

  const banner = banners[current];
  const content = (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: '60vh', minHeight: '240px', maxHeight: '600px' }}>
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(idx); }}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <div className="absolute bottom-8 left-6 z-10">
        <p className="text-white text-base font-medium drop-shadow-sm">{banner.title}</p>
      </div>
    </div>
  );

  if (banner.link) {
    return (
      <a
        href={banner.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={banner.title}
      >
        {content}
      </a>
    );
  }

  return <div>{content}</div>;
}
