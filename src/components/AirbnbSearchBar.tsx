import { useState } from 'react';
import { Search, MapPin, Sparkles, DollarSign, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

export interface SearchCriteria {
  city: string;
  category: string;
  subcategory: string;
  priceRange: [number, number];
}

interface AirbnbSearchBarProps {
  onSearch: (criteria: SearchCriteria) => void;
}

// Definición de categorías y subcategorías
const SERVICE_CATEGORIES = {
  'ESPACIOS Y LOCACIONES': {
    icon: '🏛️',
    subcategories: [
      'Salones y Banquetes',
      'Lugares Únicos',
      'Espacios al Aire Libre'
    ]
  },
  'TALENTO Y ENTRETENIMIENTO': {
    icon: '🎭',
    subcategories: [
      'Música y DJs',
      'Artistas en Vivo',
      'Cultura y Ceremonia'
    ]
  },
  'GASTRONOMÍA Y SERVICIOS': {
    icon: '🍽️',
    subcategories: [
      'Catering y Banquetería',
      'Bebidas y Coctelería',
      'Pastelería y Repostería'
    ]
  },
  'AMBIENTACIÓN Y DECORACIÓN': {
    icon: '✨',
    subcategories: [
      'Decoración y Mobiliario',
      'Diseño Gráfico y Papelería',
      'Producción Técnica'
    ]
  },
  'DETALLES Y LOGÍSTICA': {
    icon: '📋',
    subcategories: [
      'Indumentaria y Estilismo',
      'Fotografía y Video',
      'Coordinación y Logística'
    ]
  }
};

const VENEZUELAN_CITIES = [
  'Caracas',
  'Maracaibo',
  'Valencia',
  'Barquisimeto',
  'Maracay',
  'Ciudad Guayana',
  'Barcelona',
  'Maturín',
  'Puerto La Cruz',
  'San Cristóbal',
  'Mérida',
  'Cumaná',
  'Punto Fijo',
  'Los Teques',
  'Guarenas',
  'Cabimas',
  'Barinas',
  'Turmero',
  'Valencia del Rey',
  'Porlamar'
];

export function AirbnbSearchBar({ onSearch }: AirbnbSearchBarProps) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  
  const [cityOpen, setCityOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      city,
      category,
      subcategory,
      priceRange
    });
  };

  const resetFilters = () => {
    setCity('');
    setCategory('');
    setSubcategory('');
    setPriceRange([0, 50000]);
    onSearch({
      city: '',
      category: '',
      subcategory: '',
      priceRange: [0, 50000]
    });
  };

  const hasActiveFilters = city || category || subcategory || priceRange[0] > 0 || priceRange[1] < 50000;

  return (
    <div className="w-full">
      {/* Airbnb-style search bar */}
      <div 
        className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center overflow-hidden hover:shadow-xl transition-shadow"
        style={{ maxWidth: '850px', margin: '0 auto' }}
      >
        {/* Ciudad */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <button className="flex-1 px-6 py-4 text-left hover:bg-gray-50 transition-colors border-r border-gray-200 group">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Ciudad</div>
                  <div className="text-sm text-gray-500 truncate" style={{ maxWidth: '150px' }}>
                    {city || 'Seleccionar ciudad'}
                  </div>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar ciudad..." />
              <CommandList>
                <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
                <CommandGroup>
                  {VENEZUELAN_CITIES.map((cityName) => (
                    <CommandItem
                      key={cityName}
                      value={cityName}
                      onSelect={(value) => {
                        setCity(value);
                        setCityOpen(false);
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {cityName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Tipo de Servicio */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <button className="flex-1 px-6 py-4 text-left hover:bg-gray-50 transition-colors border-r border-gray-200 group">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Tipo de servicio</div>
                  <div className="text-sm text-gray-500 truncate" style={{ maxWidth: '180px' }}>
                    {subcategory || category || 'Seleccionar servicio'}
                  </div>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-900 mb-3 block">Categoría Principal</Label>
                <div className="space-y-2">
                  {Object.entries(SERVICE_CATEGORIES).map(([cat, data]) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setSubcategory('');
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                        category === cat
                          ? 'bg-gradient-to-r from-blue-50 to-gold-50 border-2'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                      style={category === cat ? { borderColor: 'var(--gold)' } : {}}
                    >
                      <span className="text-2xl">{data.icon}</span>
                      <span className="text-sm font-medium">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {category && (
                <div>
                  <Label className="text-xs font-semibold text-gray-900 mb-3 block">Subcategoría</Label>
                  <div className="space-y-2">
                    {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES].subcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setSubcategory(sub);
                          setCategoryOpen(false);
                        }}
                        className={`w-full px-4 py-2 rounded-lg text-left text-sm transition-all ${
                          subcategory === sub
                            ? 'font-semibold'
                            : 'hover:bg-gray-100'
                        }`}
                        style={subcategory === sub ? { 
                          backgroundColor: 'var(--gold)', 
                          color: 'var(--navy-blue)' 
                        } : {}}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Rango de Precio */}
        <Popover open={priceOpen} onOpenChange={setPriceOpen}>
          <PopoverTrigger asChild>
            <button className="flex-1 px-6 py-4 text-left hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Presupuesto</div>
                  <div className="text-sm text-gray-500">
                    ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-900">Rango de Precio</Label>
              <div className="pt-4">
                <Slider
                  min={0}
                  max={50000}
                  step={1000}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                />
                <div className="flex justify-between mt-4 text-sm">
                  <div className="text-gray-700">
                    <span className="font-semibold">Min:</span> ${priceRange[0].toLocaleString()}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Max:</span> ${priceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <div className="px-2">
          <Button
            onClick={handleSearch}
            className="rounded-full h-12 w-12 p-0"
            style={{ 
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)',
              color: 'white'
            }}
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {city && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              {city}
              <button onClick={() => setCity('')} className="hover:bg-gray-100 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {subcategory && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              {subcategory}
              <button onClick={() => { setSubcategory(''); setCategory(''); }} className="hover:bg-gray-100 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 50000) && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              <button onClick={() => setPriceRange([0, 50000])} className="hover:bg-gray-100 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs"
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}
