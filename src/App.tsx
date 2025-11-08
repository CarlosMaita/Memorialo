import { useState, useMemo } from 'react';
import { Users, LayoutDashboard, Menu, X, LogIn, UserCircle, LogOut, Briefcase } from 'lucide-react';
import { Artist, ServicePlan, Contract, User, Review, Booking, Provider } from './types';
import { mockArtists } from './data/mockData';
import { mockReviews } from './data/mockReviews';
import { ArtistCard } from './components/ArtistCard';
import { SearchFilters } from './components/SearchFilters';
import { ArtistProfile } from './components/ArtistProfile';
import { BookingDialog } from './components/BookingDialog';
import { CompareView } from './components/CompareView';
import { ArtistDashboard } from './components/ArtistDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { AuthDialog } from './components/AuthDialog';
import { UserProfile } from './components/UserProfile';
import { ReviewDialog } from './components/ReviewDialog';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

type ViewMode = 'client' | 'artist' | 'provider';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [artists, setArtists] = useState<Artist[]>(mockArtists);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
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
  
  // User authentication and profile
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Reviews and bookings
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  
  // Provider
  const [providers, setProviders] = useState<Provider[]>([]);
  const currentProvider = currentUser?.isProvider 
    ? providers.find(p => p.userId === currentUser.id) || null
    : null;

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    let filtered = artists.filter((artist) => {
      const matchesSearch = 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Map Spanish category names to English for filtering
      const categoryMap: { [key: string]: string } = {
        'Todos': 'All',
        'Músico': 'Musician',
        'DJ': 'DJ',
        'Mariachi': 'Mariachi',
        'Animador': 'Animator'
      };
      const englishCategory = categoryMap[selectedCategory] || selectedCategory;
      const matchesCategory = selectedCategory === 'Todos' || artist.category === englishCategory;
      
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
  }, [artists, searchQuery, selectedCategory, priceRange, sortBy]);

  const handleViewProfile = (artist: Artist) => {
    setSelectedArtist(artist);
    setShowProfile(true);
  };

  const handleBookNow = (artist: Artist, plan?: ServicePlan) => {
    // Check if user is logged in
    if (!currentUser) {
      toast.error('Debes iniciar sesión para contratar un servicio');
      setShowAuthDialog(true);
      return;
    }
    
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // If user is a provider, switch to provider view
    if (user.isProvider) {
      setViewMode('provider');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('client');
  };

  const handleProviderCreate = (provider: Provider) => {
    setProviders([...providers, provider]);
  };

  const handleServiceCreate = (service: Artist) => {
    setArtists([...artists, service]);
    
    // Link service to provider
    if (currentProvider) {
      setProviders(providers.map(p => 
        p.id === currentProvider.id 
          ? { ...p, services: [...p.services, service.id] }
          : p
      ));
    }
  };

  const handleServiceUpdate = (updatedService: Artist) => {
    setArtists(artists.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleServiceDelete = (serviceId: string) => {
    setArtists(artists.filter(s => s.id !== serviceId));
  };

  const handleReviewSubmit = (review: Review) => {
    setReviews(prev => [...prev, review]);
    
    // Update booking to mark it as reviewed
    setBookings(prev => 
      prev.map(b => 
        b.id === review.bookingId 
          ? { ...b, reviewId: review.id }
          : b
      )
    );
  };

  const openReviewDialog = (booking: Booking) => {
    setReviewBooking(booking);
    setShowReviewDialog(true);
  };

  // Get user-specific data
  const userBookings = currentUser 
    ? bookings.filter(b => b.userId === currentUser.id)
    : [];
  
  const userContracts = currentUser
    ? contracts.filter(c => c.clientId === currentUser.id)
    : [];
  
  const userReviews = currentUser
    ? reviews.filter(r => r.userId === currentUser.id)
    : [];

  // Get provider-specific data
  const providerServices = currentProvider
    ? artists.filter(a => currentProvider.services.includes(a.id))
    : [];

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
                <p className="text-xs text-gray-500">Encuentra y Contrata Artistas Talentosos</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant={viewMode === 'client' ? 'default' : 'outline'}
                onClick={() => setViewMode('client')}
              >
                <Users className="w-4 h-4 mr-2" />
                Buscar Artistas
              </Button>
              {currentUser?.isProvider && (
                <Button
                  variant={viewMode === 'provider' ? 'default' : 'outline'}
                  onClick={() => setViewMode('provider')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Mi Negocio
                </Button>
              )}
              {currentUser && (
                <Button
                  variant={viewMode === 'artist' ? 'default' : 'outline'}
                  onClick={() => setViewMode('artist')}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Panel de Artista
                </Button>
              )}
              
              {/* User Menu */}
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <UserCircle className="w-4 h-4 mr-2" />
                      {currentUser.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowUserProfile(true)}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </DropdownMenuItem>
                    {currentUser.isProvider && (
                      <DropdownMenuItem onClick={() => setViewMode('provider')}>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Mi Negocio
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
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
                Buscar Artistas
              </Button>
              {currentUser?.isProvider && (
                <Button
                  variant={viewMode === 'provider' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('provider');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Mi Negocio
                </Button>
              )}
              {currentUser && (
                <Button
                  variant={viewMode === 'artist' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('artist');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Panel de Artista
                </Button>
              )}
              
              {currentUser ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUserProfile(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setShowAuthDialog(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {viewMode === 'provider' ? (
          currentUser && (
            <ProviderDashboard
              user={currentUser}
              provider={currentProvider}
              services={providerServices}
              contracts={contracts}
              onServiceCreate={handleServiceCreate}
              onServiceUpdate={handleServiceUpdate}
              onServiceDelete={handleServiceDelete}
              onContractUpdate={(updated) => {
                setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
              }}
              onProviderCreate={handleProviderCreate}
            />
          )
        ) : viewMode === 'client' ? (
          <>
            {/* Search & Filters */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="mb-2">Descubre Artistas Increíbles</h2>
                <p className="text-gray-600">
                  Explora nuestra selección curada de músicos talentosos, DJs, animadores y bandas de mariachi
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
                      {compareArtists.length} artista{compareArtists.length !== 1 ? 's' : ''} seleccionado{compareArtists.length !== 1 ? 's' : ''}
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
                      Limpiar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCompare(true)}
                    >
                      Comparar ({compareArtists.length}/3)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="mb-4">
              <p className="text-gray-600">
                {filteredArtists.length} artista{filteredArtists.length !== 1 ? 's' : ''} encontrado{filteredArtists.length !== 1 ? 's' : ''}
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
                <p className="text-gray-500">No se encontraron artistas que coincidan con tus criterios</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Todos');
                    setPriceRange([0, 500]);
                  }}
                >
                  Restablecer Filtros
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
        reviews={reviews}
        isAuthenticated={!!currentUser}
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
        user={currentUser}
        onLoginRequired={() => setShowAuthDialog(true)}
      />

      <CompareView
        artists={compareArtists}
        open={showCompare}
        onClose={() => setShowCompare(false)}
        onRemove={handleRemoveFromCompare}
        onBook={handleBookNow}
      />

      <AuthDialog
        open={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onLogin={handleLogin}
      />

      {currentUser && (
        <UserProfile
          user={currentUser}
          open={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          bookings={userBookings}
          contracts={userContracts}
          reviews={userReviews}
        />
      )}

      {currentUser && (
        <ReviewDialog
          open={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          booking={reviewBooking}
          user={currentUser}
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
