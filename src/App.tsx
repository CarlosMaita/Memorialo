import { useState, useMemo, useEffect } from 'react';
import { Users, LayoutDashboard, Menu, X, LogIn, UserCircle, LogOut, Briefcase, Music } from 'lucide-react';
import { Artist, ServicePlan, Contract, User, Review, Booking, Provider, Event } from './types';
import { mockArtists, mockEvents } from './data/mockData';
import { mockReviews } from './data/mockReviews';
import { mockContracts } from './data/mockContracts';
import { useSupabase } from './utils/useSupabase';
import { ArtistCard } from './components/ArtistCard';
import { AirbnbSearchBar, SearchCriteria } from './components/AirbnbSearchBar';
import { ArtistProfile } from './components/ArtistProfile';
import { BookingDialog } from './components/BookingDialog';
import { CompareView } from './components/CompareView';
import { BusinessDashboard } from './components/BusinessDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AuthDialog } from './components/AuthDialog';
import { UserProfile } from './components/UserProfile';
import { ReviewDialog } from './components/ReviewDialog';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

type ViewMode = 'client' | 'business';

export default function App() {
  // Supabase hook
  const supabase = useSupabase();
  
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    city: '',
    category: '',
    subcategory: '',
    priceRange: [0, 50000]
  });
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
  const [showAbout, setShowAbout] = useState(false);
  
  // User authentication and profile
  const currentUser = supabase.currentUser;
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Reviews and bookings
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  
  // Provider
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);

  // Events
  const [events, setEvents] = useState<Event[]>([]);

  // Load initial data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  // Load provider when user changes
  useEffect(() => {
    if (currentUser?.isProvider) {
      loadCurrentProvider();
    } else {
      setCurrentProvider(null);
    }
  }, [currentUser]);

  // Update selected artist when artists state changes
  useEffect(() => {
    if (selectedArtist) {
      const updatedArtist = artists.find(a => a.id === selectedArtist.id);
      if (updatedArtist) {
        setSelectedArtist(updatedArtist);
      }
    }
  }, [artists]);

  const loadData = async () => {
    try {
      // Load services (artists) - use mock data as fallback
      const servicesData = await supabase.getServices();
      let loadedArtists: Artist[] = [];
      if (servicesData && servicesData.length > 0) {
        loadedArtists = servicesData;
      } else {
        // If no data in DB, use mock data
        loadedArtists = mockArtists;
      }

      // Load contracts - use mock data as fallback
      const contractsData = await supabase.getContracts();
      if (contractsData && contractsData.length > 0) {
        setContracts(contractsData);
      } else {
        setContracts(mockContracts);
      }

      // Load reviews - use mock data as fallback
      const reviewsData = await supabase.getReviews();
      let loadedReviews: Review[] = [];
      if (reviewsData && reviewsData.length > 0) {
        loadedReviews = reviewsData;
      } else {
        loadedReviews = mockReviews;
      }
      setReviews(loadedReviews);

      // Update artist ratings based on loaded reviews
      const updatedArtists = loadedArtists.map(artist => {
        const artistReviews = loadedReviews.filter(r => r.artistId === artist.id);
        
        if (artistReviews.length === 0) {
          return artist;
        }
        
        const totalRating = artistReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / artistReviews.length;
        
        return {
          ...artist,
          rating: Math.round(averageRating * 10) / 10,
          reviews: artistReviews.length
        };
      });
      
      setArtists(updatedArtists);

      // Load bookings
      const bookingsData = await supabase.getBookings();
      if (bookingsData) {
        setBookings(bookingsData);
      }

      // Load providers
      const providersData = await supabase.getProviders();
      if (providersData) {
        setProviders(providersData);
      }

      // Load mock events for now (will be replaced with Supabase later)
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos. Usando datos de ejemplo.');
      // Fallback to mock data
      setArtists(mockArtists);
      setReviews(mockReviews);
      setEvents(mockEvents);
      setContracts(mockContracts);
    }
  };

  const loadCurrentProvider = async () => {
    if (!currentUser) return;
    
    try {
      const provider = await supabase.getProviderByUserId(currentUser.id);
      setCurrentProvider(provider);
    } catch (error) {
      console.error('Error loading provider:', error);
    }
  };

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

  const handleContractCreated = async (contract: Contract) => {
    try {
      const createdContract = await supabase.createContract(contract);
      setContracts(prev => [...prev, createdContract]);
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Error al crear el contrato');
    }
  };

  const handleSignUp = async (email: string, password: string, name: string, phone: string, isProvider: boolean) => {
    try {
      const result = await supabase.signUp(email, password, name, phone, isProvider);
      
      // If provider, create provider profile
      if (isProvider && result.user) {
        const provider = await supabase.createProvider({
          businessName: name,
          category: 'Musician',
          description: ''
        });
        setProviders([...providers, provider]);
        setCurrentProvider(provider);
        setViewMode('business');
        
        // Update user to mark as provider
        await supabase.updateUser(result.user.id, { isProvider: true, providerId: provider.id });
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await supabase.signIn(email, password);
      
      // If user is a provider, load provider data and switch to business view
      if (supabase.currentUser?.isProvider) {
        await loadCurrentProvider();
        setViewMode('business');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.signOut();
      setViewMode('client');
      setCurrentProvider(null);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleProviderCreate = async (provider: Provider) => {
    try {
      const createdProvider = await supabase.createProvider(provider);
      setProviders([...providers, createdProvider]);
      setCurrentProvider(createdProvider);
      
      // Update current user to mark as provider
      if (currentUser) {
        await supabase.updateUser(currentUser.id, { isProvider: true, providerId: createdProvider.id });
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Error al crear perfil de proveedor');
    }
  };

  const handleServiceCreate = async (service: Artist) => {
    try {
      const createdService = await supabase.createService(service);
      setArtists([...artists, createdService]);
      
      // Link service to provider
      if (currentProvider) {
        const updatedProvider = {
          ...currentProvider,
          services: [...currentProvider.services, createdService.id]
        };
        setCurrentProvider(updatedProvider);
        setProviders(providers.map(p => 
          p.id === currentProvider.id ? updatedProvider : p
        ));
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Error al crear servicio');
    }
  };

  const handleServiceUpdate = async (updatedService: Artist) => {
    try {
      const updated = await supabase.updateService(updatedService.id, updatedService);
      setArtists(artists.map(s => s.id === updated.id ? updated : s));
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Error al actualizar servicio');
    }
  };

  const handleServiceDelete = async (serviceId: string) => {
    try {
      await supabase.deleteService(serviceId);
      setArtists(artists.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar servicio');
    }
  };

  // Function to recalculate and update artist ratings
  const updateArtistRatings = (artistId: string, allReviews: Review[]) => {
    // Get all reviews for this artist
    const artistReviews = allReviews.filter(r => r.artistId === artistId);
    
    if (artistReviews.length === 0) return;
    
    // Calculate average rating
    const totalRating = artistReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / artistReviews.length;
    
    // Update the artist with new rating and review count
    setArtists(prev => 
      prev.map(artist => 
        artist.id === artistId 
          ? { 
              ...artist, 
              rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
              reviews: artistReviews.length 
            }
          : artist
      )
    );
  };

  const handleReviewSubmit = async (review: Review) => {
    try {
      if (!currentUser) {
        toast.error('Debes iniciar sesión para dejar una reseña');
        return;
      }
      
      const createdReview = await supabase.createReview(review);
      setReviews(prev => {
        const newReviews = [...prev, createdReview];
        
        // Update artist rating and review count
        updateArtistRatings(review.artistId, newReviews);
        
        return newReviews;
      });
      
      // Update booking to mark it as reviewed
      setBookings(prev => 
        prev.map(b => 
          b.id === review.bookingId 
            ? { ...b, reviewId: review.id }
            : b
        )
      );
      
      // Close dialog and show success message
      setShowReviewDialog(false);
      setReviewBooking(null);
      toast.success('¡Reseña publicada exitosamente!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.message?.includes('logged in')) {
        toast.error('Debes iniciar sesión para dejar una reseña');
      } else {
        toast.error('Error al enviar reseña. Por favor intenta de nuevo.');
      }
    }
  };

  const openReviewDialog = (booking: Booking) => {
    setReviewBooking(booking);
    setShowReviewDialog(true);
  };

  const handleBookingCreate = async (booking: Booking) => {
    try {
      const createdBooking = await supabase.createBooking(booking);
      setBookings(prev => [...prev, createdBooking]);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error al crear reserva');
    }
  };

  const handleBookingUpdate = async (updatedBooking: Booking) => {
    try {
      const updated = await supabase.updateBooking(updatedBooking.id, updatedBooking);
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Error al actualizar reserva');
    }
  };

  // Event management functions
  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para crear un evento');
      return;
    }

    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEvents(prev => [...prev, newEvent]);
    toast.success('Evento creado exitosamente');
  };

  const handleUpdateEvent = (eventId: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, ...updates, updatedAt: new Date().toISOString() }
        : event
    ));
    toast.success('Evento actualizado');
  };

  const handleDeleteEvent = (eventId: string) => {
    // Remove event from all contracts
    setContracts(prev => prev.map(contract => 
      contract.eventId === eventId 
        ? { ...contract, eventId: undefined }
        : contract
    ));
    
    setEvents(prev => prev.filter(event => event.id !== eventId));
    toast.success('Evento eliminado');
  };

  const handleAssignContractToEvent = (contractId: string, eventId: string | null) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { ...contract, eventId: eventId || undefined }
        : contract
    ));

    // Update event's contract list
    if (eventId) {
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const contractIds = new Set(event.contractIds);
          contractIds.add(contractId);
          return { ...event, contractIds: Array.from(contractIds) };
        }
        // Remove from other events
        return {
          ...event,
          contractIds: event.contractIds.filter(id => id !== contractId)
        };
      }));
      toast.success('Reserva asignada al evento');
    } else {
      // Remove from all events
      setEvents(prev => prev.map(event => ({
        ...event,
        contractIds: event.contractIds.filter(id => id !== contractId)
      })));
      toast.success('Reserva removida del evento');
    }
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
  
  // Debug logging for client view
  if (currentUser && !currentUser.isProvider) {
    console.log('Client View - Current User ID:', currentUser.id);
    console.log('Client View - All Contracts:', contracts);
    console.log('Client View - User Contracts:', userContracts);
    console.log('Client View - All Bookings:', bookings);
    console.log('Client View - User Bookings:', userBookings);
  }

  // Get provider-specific data
  // Filter services by userId to show all services created by this provider
  const providerServices = currentProvider && currentUser
    ? artists.filter(a => a.userId === currentUser.id)
    : [];
  
  // Debug logging
  if (currentUser && currentUser.isProvider) {
    console.log('Provider View - Current User ID:', currentUser.id);
    console.log('Provider View - All Artists:', artists);
    console.log('Provider View - Filtered Provider Services:', providerServices);
  }

  // Filter and sort artists based on search criteria
  const filteredArtists = useMemo(() => {
    let filtered = [...artists];

    // Filter by city
    if (searchCriteria.city) {
      filtered = filtered.filter(artist => 
        artist.location.toLowerCase().includes(searchCriteria.city.toLowerCase())
      );
    }

    // Filter by category/subcategory
    if (searchCriteria.subcategory) {
      filtered = filtered.filter(artist => 
        artist.category.toLowerCase().includes(searchCriteria.subcategory.toLowerCase()) ||
        artist.specialties.some(s => s.toLowerCase().includes(searchCriteria.subcategory.toLowerCase()))
      );
    } else if (searchCriteria.category) {
      filtered = filtered.filter(artist => 
        artist.category.toLowerCase().includes(searchCriteria.category.toLowerCase()) ||
        artist.specialties.some(s => s.toLowerCase().includes(searchCriteria.category.toLowerCase()))
      );
    }

    // Filter by price range
    filtered = filtered.filter(artist => {
      const minPrice = Math.min(...artist.servicePlans.map(p => p.price));
      return minPrice >= searchCriteria.priceRange[0] && minPrice <= searchCriteria.priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => {
          const minPriceA = Math.min(...a.servicePlans.map(p => p.price));
          const minPriceB = Math.min(...b.servicePlans.map(p => p.price));
          return minPriceA - minPriceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const minPriceA = Math.min(...a.servicePlans.map(p => p.price));
          const minPriceB = Math.min(...b.servicePlans.map(p => p.price));
          return minPriceB - minPriceA;
        });
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
    }

    return filtered;
  }, [artists, searchCriteria, sortBy]);

  // Show loading screen while checking authentication
  if (supabase.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-full inline-block mb-4" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)' }}>
            <Music className="w-12 h-12 animate-pulse" style={{ color: 'var(--navy-blue)' }} />
          </div>
          <h2>Memorialo</h2>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream-white)' }}>
      <Toaster />
      
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                setShowAbout(false);
                setViewMode('client');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 hover:opacity-90 transition-opacity"
            >
              {/* Logo: El Enlace Armónico */}
              <div className="relative" style={{ width: '48px', height: '48px' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Gradiente de fondo */}
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Fondo con bordes redondeados */}
                  <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#logoGradient)" />
                  
                  {/* Letra M estilizada como arco/portal */}
                  <path 
                    d="M 20 70 L 20 35 Q 20 25 30 25 L 35 25 L 50 50 L 65 25 L 70 25 Q 80 25 80 35 L 80 70" 
                    stroke="var(--navy-blue)" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  
                  {/* Estrella de 4 puntas en el centro */}
                  <path 
                    d="M 50 42 L 52 48 L 58 50 L 52 52 L 50 58 L 48 52 L 42 50 L 48 48 Z" 
                    fill="var(--navy-blue)"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>Memorialo</h1>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>El inicio de lo inolvidable</p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowAbout(true)}
                className="text-white hover:text-white hover:bg-white/10"
              >
                Sobre Nosotros
              </Button>
              <Button
                variant={viewMode === 'client' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('client')}
                className={viewMode === 'client' ? '' : 'text-white hover:text-white hover:bg-white/10'}
              >
                <Users className="w-4 h-4 mr-2" />
                Buscar Artistas
              </Button>
              {currentUser?.isProvider && (
                <Button
                  variant={viewMode === 'business' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('business')}
                  className={viewMode === 'business' ? '' : 'text-white hover:text-white hover:bg-white/10'}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Mi Negocio
                </Button>
              )}
              {currentUser && !currentUser.isProvider && (
                <Button
                  variant={viewMode === 'business' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('business')}
                  className={viewMode === 'business' ? '' : 'text-white hover:text-white hover:bg-white/10'}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mis Reservas
                </Button>
              )}
              
              {/* User Menu */}
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 border border-white/20">
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
                      <DropdownMenuItem onClick={() => setViewMode('business')}>
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
                <Button variant="secondary" onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-white/20 space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAbout(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-white hover:text-white hover:bg-white/10"
              >
                Sobre Nosotros
              </Button>
              <Button
                variant={viewMode === 'client' ? 'secondary' : 'ghost'}
                onClick={() => {
                  setViewMode('client');
                  setMobileMenuOpen(false);
                }}
                className={`w-full ${viewMode === 'client' ? '' : 'text-white hover:text-white hover:bg-white/10'}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Buscar Artistas
              </Button>
              {currentUser?.isProvider && (
                <Button
                  variant={viewMode === 'business' ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setViewMode('business');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full ${viewMode === 'business' ? '' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Mi Negocio
                </Button>
              )}
              {currentUser && !currentUser.isProvider && (
                <Button
                  variant={viewMode === 'business' ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setViewMode('business');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full ${viewMode === 'business' ? '' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mis Reservas
                </Button>
              )}
              
              {currentUser ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowUserProfile(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-white hover:text-white hover:bg-white/10"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-white hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
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
      <main className={showAbout ? "" : "container mx-auto px-4 py-8 mx-[85px] my-[0px]"}>
        {showAbout ? (
          <AboutPage 
            onGetStarted={() => {
              setShowAbout(false);
              setViewMode('client');
            }}
            onClose={() => setShowAbout(false)}
          />
        ) : viewMode === 'business' ? (
          currentUser && currentUser.isProvider ? (
            <BusinessDashboard
              user={currentUser}
              provider={currentProvider}
              services={providerServices}
              contracts={contracts}
              bookings={bookings}
              onServiceCreate={handleServiceCreate}
              onServiceUpdate={handleServiceUpdate}
              onServiceDelete={handleServiceDelete}
              onContractUpdate={async (updated) => {
                try {
                  const updatedContract = await supabase.updateContract(updated.id, updated);
                  setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
                  
                  // If contract was marked as completed, reload services to update bookingsCompleted
                  if (updated.status === 'completed') {
                    console.log('Contract marked as completed, reloading services...');
                    const servicesData = await supabase.getServices();
                    if (servicesData && servicesData.length > 0) {
                      setArtists(servicesData);
                    }
                  }
                } catch (error) {
                  console.error('Error updating contract:', error);
                  toast.error('Error al actualizar contrato');
                }
              }}
              onBookingCreate={handleBookingCreate}
              onBookingUpdate={handleBookingUpdate}
              onProviderCreate={handleProviderCreate}
            />
          ) : (
            currentUser && (
              <ClientDashboard
                contracts={contracts}
                user={currentUser}
                onReviewCreate={(contractId) => {
                  const contract = contracts.find(c => c.id === contractId);
                  if (contract) {
                    const booking: Booking = {
                      id: contract.bookingId,
                      artistId: contract.artistId,
                      artistName: contract.artistName,
                      userId: currentUser.id,
                      clientName: contract.clientName,
                      clientEmail: currentUser.email,
                      clientPhone: currentUser.phone || '',
                      date: contract.terms.date,
                      duration: contract.terms.duration,
                      eventType: 'Servicio completado',
                      location: contract.terms.location,
                      specialRequests: '',
                      totalPrice: contract.terms.price,
                      status: 'completed',
                      contractId: contract.id
                    };
                    setReviewBooking(booking);
                    setShowReviewDialog(true);
                  }
                }}
                reviews={reviews}
                events={events}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onAssignContractToEvent={handleAssignContractToEvent}
              />
            )
          )
        ) : viewMode === 'client' ? (
          <>
            {/* Search & Filters */}
            <div className="mb-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2">Encuentra el Servicio Perfecto para tu Evento</h2>
                <p className="text-gray-600">
                  El inicio de lo inolvidable. Desde espacios únicos hasta el mejor talento, todo lo que necesitas para crear momentos memorables
                </p>
              </div>

              <AirbnbSearchBar
                onSearch={setSearchCriteria}
              />
            </div>

            {/* Compare Bar */}
            {compareArtists.length > 0 && (
              <div className="rounded-lg p-4 mb-6" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(10, 31, 68, 0.05) 100%)', border: '1px solid var(--gold)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>
                      {compareArtists.length} proveedor{compareArtists.length !== 1 ? 'es' : ''} seleccionado{compareArtists.length !== 1 ? 's' : ''}
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

            {/* Results & Sort */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredArtists.length} proveedor{filteredArtists.length !== 1 ? 'es' : ''} encontrado{filteredArtists.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  <option value="rating">Mejor Calificación</option>
                  <option value="price-low">Precio: Menor a Mayor</option>
                  <option value="price-high">Precio: Mayor a Menor</option>
                  <option value="reviews">Más Reseñas</option>
                </select>
              </div>
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
                <p className="text-gray-500">No se encontraron proveedores que coincidan con tus criterios</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchCriteria({
                      city: '',
                      category: '',
                      subcategory: '',
                      priceRange: [0, 50000]
                    });
                  }}
                >
                  Restablecer Filtros
                </Button>
              </div>
            )}
          </>
        ) : (
          currentUser?.isProvider ? (
            <ArtistDashboard 
              contracts={contracts} 
              onContractUpdate={async (updated) => {
                try {
                  const updatedContract = await supabase.updateContract(updated.id, updated);
                  setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
                  
                  // If contract was marked as completed, reload services to update bookingsCompleted
                  if (updated.status === 'completed') {
                    console.log('Contract marked as completed, reloading services...');
                    const servicesData = await supabase.getServices();
                    if (servicesData && servicesData.length > 0) {
                      setArtists(servicesData);
                    }
                  }
                } catch (error) {
                  console.error('Error updating contract:', error);
                  toast.error('Error al actualizar contrato');
                }
              }} 
            />
          ) : (
            currentUser && (
              <ClientDashboard
                contracts={contracts}
                user={currentUser}
                onReviewCreate={(contractId) => {
                  // Find the contract to get booking info
                  const contract = contracts.find(c => c.id === contractId);
                  if (contract) {
                    const booking: Booking = {
                      id: contract.bookingId,
                      artistId: contract.artistId,
                      artistName: contract.artistName,
                      userId: currentUser.id,
                      clientName: contract.clientName,
                      clientEmail: currentUser.email,
                      clientPhone: currentUser.phone || '',
                      date: contract.terms.date,
                      duration: contract.terms.duration,
                      eventType: 'Servicio completado',
                      location: contract.terms.location,
                      specialRequests: '',
                      totalPrice: contract.terms.price,
                      status: 'completed',
                      contractId: contract.id
                    };
                    setReviewBooking(booking);
                    setShowReviewDialog(true);
                  }
                }}
                reviews={reviews}
              />
            )
          )
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
        onBookingCreated={handleBookingCreate}
        onBookingUpdate={handleBookingUpdate}
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
        onLogin={(user, accessToken) => {
          // User is already set by the hook
          if (user.isProvider) {
            setViewMode('provider');
          }
        }}
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
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

      {/* Footer */}
      <Footer onAboutClick={() => setShowAbout(true)} />
    </div>
  );
}
