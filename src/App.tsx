import { useState, useMemo } from 'react';
import { Users, LayoutDashboard, Menu, X } from 'lucide-react';
import { Artist, ServicePlan, Contract } from './types';
import { mockArtists } from './data/mockData';
import { ArtistCard } from './components/ArtistCard';
import { SearchFilters } from './components/SearchFilters';
import { ArtistProfile } from './components/ArtistProfile';
import { BookingDialog } from './components/BookingDialog';
import { CompareView } from './components/CompareView';
import { ArtistDashboard } from './components/ArtistDashboard';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';

type ViewMode = 'client' | 'artist';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingArtist, setBookingArtist] = useState<Artist | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [compareArtists, setCompareArtists] = useState<Artist[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    let filtered = mockArtists.filter((artist) => {
      const matchesSearch = 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || artist.category === selectedCategory;
      
      const matchesPrice = artist.pricePerHour >= priceRange[0] && artist.pricePerHour <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return a.pricePerHour - b.pricePerHour;
        case 'price-high':
          return b.pricePerHour - a.pricePerHour;
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const handleViewProfile = (artist: Artist) => {
    setSelectedArtist(artist);
    setShowProfile(true);
  };

  const handleBookNow = (artist: Artist, plan?: ServicePlan) => {
    setBookingArtist(artist);
    setSelectedPlan(plan || null);
    setShowProfile(false);
    setShowBooking(true);
  };

  const handleToggleCompare = (artist: Artist) => {
    const isAlreadyComparing = compareArtists.some(a => a.id === artist.id);
    
    if (isAlreadyComparing) {
      setCompareArtists(compareArtists.filter(a => a.id !== artist.id));
    } else {
      if (compareArtists.length < 3) {
        setCompareArtists([...compareArtists, artist]);
      }
    }
  };

  const handleRemoveFromCompare = (artistId: string) => {
    setCompareArtists(compareArtists.filter(a => a.id !== artistId));
  };

  const handleContractCreated = (contract: Contract) => {
    setContracts(prev => [...prev, contract]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-2 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-sm">ArtistHub</h1>
                <p className="text-xs text-gray-500">Find & Book Talented Artists</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant={viewMode === 'client' ? 'default' : 'outline'}
                onClick={() => setViewMode('client')}
              >
                <Users className="w-4 h-4 mr-2" />
                Find Artists
              </Button>
              <Button
                variant={viewMode === 'artist' ? 'default' : 'outline'}
                onClick={() => setViewMode('artist')}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Artist Dashboard
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-2">
              <Button
                variant={viewMode === 'client' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('client');
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Artists
              </Button>
              <Button
                variant={viewMode === 'artist' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('artist');
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Artist Dashboard
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {viewMode === 'client' ? (
          <>
            {/* Search & Filters */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="mb-2">Discover Amazing Artists</h2>
                <p className="text-gray-600">
                  Browse through our curated selection of talented musicians, DJs, animators, and mariachi bands
                </p>
              </div>

              <SearchFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>

            {/* Compare Bar */}
            {compareArtists.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>
                      {compareArtists.length} artist{compareArtists.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      {compareArtists.map((artist) => (
                        <Badge key={artist.id} variant="secondary">
                          {artist.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareArtists([])}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCompare(true)}
                    >
                      Compare ({compareArtists.length}/3)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="mb-4">
              <p className="text-gray-600">
                {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Artist Grid */}
            {filteredArtists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onViewProfile={handleViewProfile}
                    onCompare={handleToggleCompare}
                    isComparing={compareArtists.some(a => a.id === artist.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No artists found matching your criteria</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setPriceRange([0, 500]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </>
        ) : (
          <ArtistDashboard contracts={contracts} onContractUpdate={(updated) => {
            setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
          }} />
        )}
      </main>

      {/* Dialogs */}
      <ArtistProfile
        artist={selectedArtist}
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onBookNow={handleBookNow}
      />

      <BookingDialog
        artist={bookingArtist}
        selectedPlan={selectedPlan}
        open={showBooking}
        onClose={() => {
          setShowBooking(false);
          setSelectedPlan(null);
        }}
        onContractCreated={handleContractCreated}
      />

      <CompareView
        artists={compareArtists}
        open={showCompare}
        onClose={() => setShowCompare(false)}
        onRemove={handleRemoveFromCompare}
        onBook={handleBookNow}
      />
    </div>
  );
}
