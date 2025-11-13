import { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, DollarSign, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { VENEZUELAN_CITIES } from '../data/cities';
import { SERVICE_CATEGORIES } from '../data/serviceCategories';

export interface SearchCriteria {
  city: string;
  category: string;
  subcategory: string;
  priceRange: [number, number];
}

interface AirbnbSearchBarProps {
  onSearch: (criteria: SearchCriteria) => void;
  searchCriteria?: SearchCriteria;
}

// Función helper para capitalizar correctamente
const capitalizeCategory = (text: string): string => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function AirbnbSearchBar({ onSearch, searchCriteria }: AirbnbSearchBarProps) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  
  const [cityOpen, setCityOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<'city' | 'service' | 'price'>('city');

  // Sincronizar estado interno con el prop searchCriteria cuando cambia desde el padre
  useEffect(() => {
    if (searchCriteria) {
      setCity(searchCriteria.city);
      setCategory(searchCriteria.category);
      setSubcategory(searchCriteria.subcategory);
      setPriceRange(searchCriteria.priceRange);
    }
  }, [searchCriteria]);

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
    setPriceRange([0, 5000]);
    onSearch({
      city: '',
      category: '',
      subcategory: '',
      priceRange: [0, 5000]
    });
  };

  const hasActiveFilters = city || category || subcategory || priceRange[0] > 0 || priceRange[1] < 5000;

  return (
    <div className="w-full">
      {/* Mobile Search Button - visible only on mobile */}
      <button
        onClick={() => setMobileModalOpen(true)}
        className="md:hidden w-full bg-white rounded-full shadow-lg border border-gray-200 px-6 py-4 flex items-center gap-3 hover:shadow-xl transition-shadow"
        style={{ maxWidth: '850px', margin: '0 auto' }}
      >
        <Search className="w-5 h-5" style={{ color: 'var(--gold)' }} />
        <div className="flex-1 text-left">
          <div className="text-sm">
            {city || subcategory || category 
              ? `${city ? city + ' • ' : ''}${subcategory || (category ? capitalizeCategory(category) : '')}`
              : 'Inicia tu búsqueda'
            }
          </div>
          <div className="text-xs text-gray-500">
            Ciudad • Servicio • Presupuesto
          </div>
        </div>
      </button>

      {/* Desktop Search Bar - visible only on desktop */}
      <div 
        className="hidden md:flex bg-white rounded-full shadow-lg border border-gray-200 items-center overflow-hidden hover:shadow-xl transition-shadow"
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
                        // Búsqueda reactiva inmediata
                        onSearch({
                          city: value,
                          category,
                          subcategory,
                          priceRange
                        });
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
                    {subcategory || (category ? capitalizeCategory(category) : 'Seleccionar servicio')}
                  </div>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            {!category ? (
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
                      className="w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    >
                      <span className="text-2xl">{data.icon}</span>
                      <span className="text-sm font-medium">{capitalizeCategory(cat)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES].icon}</span>
                    <Label className="text-xs font-semibold text-gray-900">{capitalizeCategory(category)}</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategory('');
                      setSubcategory('');
                      // Búsqueda reactiva al limpiar categoría
                      onSearch({
                        city,
                        category: '',
                        subcategory: '',
                        priceRange
                      });
                    }}
                    className="text-xs h-8"
                  >
                    ← Cambiar
                  </Button>
                </div>
                <div className="space-y-2">
                  {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES].subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSubcategory(sub);
                        setCategoryOpen(false);
                        // Búsqueda reactiva inmediata
                        onSearch({
                          city,
                          category,
                          subcategory: sub,
                          priceRange
                        });
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left text-sm transition-all ${
                        subcategory === sub
                          ? 'font-semibold'
                          : 'hover:bg-gray-100 bg-gray-50'
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
                  max={5000}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value as [number, number]);
                    // Búsqueda reactiva con el nuevo rango de precio
                    onSearch({
                      city,
                      category,
                      subcategory,
                      priceRange: value as [number, number]
                    });
                  }}
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
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Search Modal */}
      <Dialog open={mobileModalOpen} onOpenChange={(open) => {
        setMobileModalOpen(open);
        if (!open) {
          // Resetear al paso inicial cuando se cierra
          setMobileStep('city');
        }
      }}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar servicios</DialogTitle>
            <DialogDescription>
              {mobileStep === 'city' && 'Paso 1 de 3: Selecciona tu ciudad'}
              {mobileStep === 'service' && 'Paso 2 de 3: Elige el tipo de servicio'}
              {mobileStep === 'price' && 'Paso 3 de 3: Define tu presupuesto'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Indicador de progreso */}
          <div className="flex gap-2 mb-4">
            <div 
              className={`flex-1 h-1 rounded-full transition-colors ${
                mobileStep === 'city' || mobileStep === 'service' || mobileStep === 'price' 
                  ? 'bg-gradient-to-r from-gold-500 to-copper-500' 
                  : 'bg-gray-200'
              }`}
              style={mobileStep === 'city' || mobileStep === 'service' || mobileStep === 'price' ? {
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)'
              } : {}}
            />
            <div 
              className={`flex-1 h-1 rounded-full transition-colors ${
                mobileStep === 'service' || mobileStep === 'price' 
                  ? 'bg-gradient-to-r from-gold-500 to-copper-500' 
                  : 'bg-gray-200'
              }`}
              style={mobileStep === 'service' || mobileStep === 'price' ? {
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)'
              } : {}}
            />
            <div 
              className={`flex-1 h-1 rounded-full transition-colors ${
                mobileStep === 'price' 
                  ? 'bg-gradient-to-r from-gold-500 to-copper-500' 
                  : 'bg-gray-200'
              }`}
              style={mobileStep === 'price' ? {
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)'
              } : {}}
            />
          </div>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* PASO 1: Ciudad */}
            {mobileStep === 'city' && (
              <div className="space-y-3">
                <Label className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  ¿Dónde buscas el servicio?
                </Label>
                <Command className="border rounded-lg">
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
                            // Avanzar automáticamente al siguiente paso
                            setTimeout(() => setMobileStep('service'), 300);
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {cityName}
                          {city === cityName && (
                            <span className="ml-auto" style={{ color: 'var(--gold)' }}>✓</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {city && (
                  <div className="px-4 py-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--gold)', color: 'var(--navy-blue)' }}>
                    <span className="font-medium">{city}</span>
                    <button 
                      onClick={() => setCity('')} 
                      className="hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PASO 2: Tipo de Servicio */}
            {mobileStep === 'service' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    ¿Qué tipo de servicio necesitas?
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMobileStep('city')}
                    className="text-xs"
                  >
                    Atrás
                  </Button>
                </div>

                {/* Mostrar ciudad seleccionada */}
                {city && (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {city}
                  </div>
                )}
                
                {!category ? (
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Categoría Principal</Label>
                    <div className="space-y-2">
                      {Object.entries(SERVICE_CATEGORIES).map(([cat, data]) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setCategory(cat);
                            setSubcategory('');
                          }}
                          className="w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        >
                          <span className="text-xl">{data.icon}</span>
                          <span className="text-sm font-medium">{capitalizeCategory(cat)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES].icon}</span>
                        <Label className="text-xs font-semibold text-gray-900">{capitalizeCategory(category)}</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCategory('');
                          setSubcategory('');
                        }}
                        className="text-xs h-8"
                      >
                        ← Cambiar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES].subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setSubcategory(sub);
                            // Avanzar automáticamente al siguiente paso
                            setTimeout(() => setMobileStep('price'), 300);
                          }}
                          className={`w-full px-4 py-3 rounded-lg text-left text-sm transition-all ${
                            subcategory === sub
                              ? 'font-semibold'
                              : 'hover:bg-gray-100 bg-gray-50'
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
            )}

            {/* PASO 3: Rango de Precio */}
            {mobileStep === 'price' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    ¿Cuál es tu presupuesto?
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMobileStep('service')}
                    className="text-xs"
                  >
                    Atrás
                  </Button>
                </div>

                {/* Mostrar selecciones anteriores */}
                <div className="flex flex-wrap gap-2">
                  {city && (
                    <div className="px-3 py-1 bg-gray-50 rounded-full flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {city}
                    </div>
                  )}
                  {subcategory && (
                    <div className="px-3 py-1 bg-gray-50 rounded-full flex items-center gap-1 text-xs text-gray-600">
                      <Sparkles className="w-3 h-3" />
                      {subcategory}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Slider
                    min={0}
                    max={5000}
                    step={100}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                  <div className="flex justify-between mt-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Mínimo</div>
                      <div className="font-semibold" style={{ color: 'var(--navy-blue)' }}>
                        ${priceRange[0].toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Máximo</div>
                      <div className="font-semibold" style={{ color: 'var(--navy-blue)' }}>
                        ${priceRange[1].toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción - Siempre visibles en el paso 3 */}
          {mobileStep === 'price' && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCity('');
                  setCategory('');
                  setSubcategory('');
                  setPriceRange([0, 5000]);
                  setMobileStep('city');
                }}
                className="flex-1"
              >
                Limpiar Todo
              </Button>
              <Button
                onClick={() => {
                  handleSearch();
                  setMobileModalOpen(false);
                  setMobileStep('city');
                }}
                className="flex-1"
                style={{ 
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)',
                  color: 'white'
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {city && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              {city}
              <button 
                onClick={() => {
                  setCity('');
                  // Búsqueda reactiva al remover ciudad
                  onSearch({
                    city: '',
                    category,
                    subcategory,
                    priceRange
                  });
                }} 
                className="hover:bg-gray-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {subcategory && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              {subcategory}
              <button 
                onClick={() => { 
                  setSubcategory(''); 
                  setCategory('');
                  // Búsqueda reactiva al remover subcategoría
                  onSearch({
                    city,
                    category: '',
                    subcategory: '',
                    priceRange
                  });
                }} 
                className="hover:bg-gray-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 5000) && (
            <div className="px-3 py-1 bg-white rounded-full text-sm border border-gray-200 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              <button 
                onClick={() => {
                  setPriceRange([0, 5000]);
                  // Búsqueda reactiva al restablecer precio
                  onSearch({
                    city,
                    category,
                    subcategory,
                    priceRange: [0, 5000]
                  });
                }} 
                className="hover:bg-gray-100 rounded-full p-0.5"
              >
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
