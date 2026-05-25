import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock } from 'lucide-react';
import { apiRequest } from '../utils/supabase/client';

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_DELAY_MS = 280;

interface Suggestion {
  id: string;
  name: string;
  category: string;
}

interface SmartSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onInputFocus?: () => void;
  placeholder?: string;
  inputClassName?: string;
  wrapperClassName?: string;
  showSearchButton?: boolean;
  inputStyle?: React.CSSProperties;
}

export function SmartSearchBar({
  value,
  onChange,
  onSubmit,
  onInputFocus,
  placeholder = 'Buscar proveedores de servicio...',
  inputClassName = '',
  wrapperClassName = '',
  showSearchButton = false,
  inputStyle,
}: SmartSearchBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const data = await apiRequest(`/services/suggestions?${params.toString()}`, 'GET');
      const items: Suggestion[] = Array.isArray(data) ? data : [];
      setSuggestions(items.slice(0, MAX_SUGGESTIONS));
      setIsOpen(items.length > 0);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    setIsOpen(false);
    setActiveIndex(-1);
    onChange('');
    onSubmit(suggestion.name);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(false);
        onSubmit(value);
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
        onSubmit(value);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={inputClassName}
        style={inputStyle}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          onInputFocus?.();
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      />

      {showSearchButton && (
        <button
          type="button"
          onClick={() => { setIsOpen(false); onSubmit(value); inputRef.current?.blur(); }}
          className="absolute right-0 top-0 h-10 w-12 flex items-center justify-center border-l border-gray-300 bg-white hover:bg-gray-50"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-sm shadow-lg z-50 overflow-hidden"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-gray-800 transition-colors ${
                index === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                // Prevent input blur before click fires
                e.preventDefault();
              }}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="flex-1 truncate">{suggestion.name.charAt(0).toUpperCase() + suggestion.name.slice(1)}</span>
              {suggestion.category && (
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{suggestion.category}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {loading && !isOpen && (
        <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-sm shadow px-4 py-2.5 text-sm text-gray-400 z-50">
          Buscando...
        </div>
      )}
    </div>
  );
}
