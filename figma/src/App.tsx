import { useState, useMemo, useEffect, useRef, type MouseEvent } from 'react';
import { Users, LayoutDashboard, Menu, X, LogIn, UserCircle, LogOut, Briefcase, Shield, Search, Bell, CheckCheck, Heart, Calendar, MessageCircle, Receipt, Settings } from 'lucide-react';
import { Artist, ServicePlan, Contract, User, Review, Booking, Provider, Event } from './types';
import { mockArtists, mockEvents, mockUsers, mockProviders } from './data/mockData';
import { mockReviews } from './data/mockReviews';
import { mockContracts } from './data/mockContracts';
import { VENEZUELAN_CITIES } from './data/cities';
import { SERVICE_CATEGORIES } from './data/serviceCategories';
import { useSupabase } from './utils/useSupabase';
import { ArtistCard } from './components/ArtistCard';
import { AirbnbSearchBar, SearchCriteria } from './components/AirbnbSearchBar';
// ArtistProfile modal replaced by ServiceDetailPage
import { BookingDialog } from './components/BookingDialog';
import { BusinessDashboard } from './components/BusinessDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthDialog } from './components/AuthDialog';
import { UserProfile } from './components/UserProfile';
import { ReviewDialog } from './components/ReviewDialog';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { ForProvidersPage } from './components/ForProvidersPage';
import { ForClientsPage } from './components/ForClientsPage';
import { TermsConditions } from './components/legal/TermsConditions';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { CancellationPolicy } from './components/legal/CancellationPolicy';
import { RefundPolicy } from './components/legal/RefundPolicy';
import { CodeOfConduct } from './components/legal/CodeOfConduct';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import { BookingConfirmation } from './components/BookingConfirmation';
import { ChatWidget } from './components/ChatWidget';
import { NegotiationPage } from './components/NegotiationPage';
import { ProviderNegotiationPage } from './components/ProviderNegotiationPage';
import { SEOHead, buildMarketplaceStructuredData } from './components/SEOHead';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { downloadContractPdf } from './utils/contractPdf';
import { toast } from 'sonner@2.0.3';

type ViewMode = 'client' | 'business' | 'admin';
type DashboardView = 'provider' | 'client';
type ProviderDashboardSection = 'dashboard' | 'settings' | 'services' | 'contracts' | 'bookings' | 'billing';
type ClientDashboardSection = 'bookings' | 'events';

type NotificationEntity = {
  type?: string;
  id?: string;
};

type HeaderNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
  ctaUrl?: string | null;
  entity?: NotificationEntity | null;
  createdAt?: string;
  readAt?: string | null;
  isRead: boolean;
};

const getDismissedNotificationsStorageKey = (userId: string) => `memorialo:dismissed-notifications:${userId}`;

const loadDismissedNotificationIds = (userId: string) => {
  try {
    const rawValue = window.localStorage.getItem(getDismissedNotificationsStorageKey(userId));
    if (!rawValue) {
      return new Set<string>();
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return new Set<string>();
    }

    return new Set(parsedValue.map((value) => String(value)));
  } catch {
    return new Set<string>();
  }
};

const persistDismissedNotificationIds = (userId: string, ids: Set<string>) => {
  try {
    window.localStorage.setItem(getDismissedNotificationsStorageKey(userId), JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage failures and keep runtime state.
  }
};

type TaxonomyTarget = {
  label: string;
  filterBy: 'category' | 'subcategory';
};

type MarketplaceRouteContext = {
  city?: string;
  taxonomy?: TaxonomyTarget;
  query?: string;
  canonicalPath: string;
};

type HomeListingSnapshot = {
  path: string;
  searchCriteria: SearchCriteria;
  sortBy: string;
  homeVisibleCount: number;
  scrollY: number;
  anchorArtistId?: string;
  anchorViewportOffset?: number;
  updatedAt: number;
};

type MarketplaceCacheEntry = {
  artists: Artist[];
  total: number;
  hasMore: boolean;
  page: number;
  homeVisibleCount: number;
  updatedAt: number;
};

type BookingConfirmationState = {
  bookingId?: string;
  contractId?: string;
  artistName: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  totalPrice: number;
  planName?: string;
  providerPhone?: string;
  providerEmail?: string;
  contract?: Contract | null;
};

type AppNavigationState = {
  fromMarketplace?: boolean;
  homeListingSnapshot?: HomeListingSnapshot;
  bookingConfirmation?: BookingConfirmationState;
};

type OpenBookingEventDetail = {
  bookingId?: string | null;
  contractId?: string | null;
};

const searchCriteriaEquals = (left: SearchCriteria, right: SearchCriteria) => {
  return (
    left.query === right.query &&
    left.city === right.city &&
    left.category === right.category &&
    left.subcategory === right.subcategory &&
    left.priceRange[0] === right.priceRange[0] &&
    left.priceRange[1] === right.priceRange[1]
  );
};

export default function App() {
  const HOME_INITIAL_ITEMS = 24;
  const HOME_LOAD_STEP = 24;
  const HOME_LISTING_SNAPSHOT_STORAGE_KEY = 'memorialo:home-listing-snapshot';

  // Supabase hook
  const supabase = useSupabase();

  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [dashboardView, setDashboardView] = useState<DashboardView>('provider');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [marketplaceArtists, setMarketplaceArtists] = useState<Artist[]>([]);
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [marketplaceHasMore, setMarketplaceHasMore] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplacePage, setMarketplacePage] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    query: '',
    city: '',
    category: '',
    subcategory: '',
    priceRange: [0, 5000]
  });
  const [headerSearchInput, setHeaderSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingArtist, setBookingArtist] = useState<Artist | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showForProviders, setShowForProviders] = useState(false);
  const [showForClients, setShowForClients] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [bookingConfirmationData, setBookingConfirmationData] = useState<BookingConfirmationState | null>(
    ((window.history.state as AppNavigationState | null | undefined)?.bookingConfirmation as BookingConfirmationState | undefined) || null
  );

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

  // Admin
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allMarketplaceCities, setAllMarketplaceCities] = useState<string[]>(VENEZUELAN_CITIES);
  const [enabledMarketplaceCities, setEnabledMarketplaceCities] = useState<string[]>(VENEZUELAN_CITIES);

  // Notifications (N2)
  const notificationsEnabled = ((import.meta as any).env?.VITE_NOTIFICATIONS_HEADER_ENABLED ?? 'true') !== 'false';
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dismissedNotificationIdsRef = useRef<Set<string>>(new Set());
  const [providerDashboardSection, setProviderDashboardSection] = useState<ProviderDashboardSection | undefined>(undefined);
  const [providerFocusedBookingId, setProviderFocusedBookingId] = useState<string | null>(null);
  const [clientDashboardSection, setClientDashboardSection] = useState<ClientDashboardSection | undefined>(undefined);
  const [clientFocusedBookingId, setClientFocusedBookingId] = useState<string | null>(null);
  const [clientFocusedContractId, setClientFocusedContractId] = useState<string | null>(null);
  const [negotiationContractId, setNegotiationContractId] = useState<string | null>(null);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>([]);
  const [isCheckingProviderProfile, setIsCheckingProviderProfile] = useState(false);
  const [providerAccountCreated, setProviderAccountCreated] = useState(false);
  const [homeVisibleCount, setHomeVisibleCount] = useState(HOME_INITIAL_ITEMS);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const previousRouteRef = useRef(window.location.pathname);
  const lastMarketplaceCriteriaKeyRef = useRef('');
  const marketplaceCacheRef = useRef<Record<string, MarketplaceCacheEntry>>({});
  const pendingHomeScrollRestoreRef = useRef<number | null>(null);
  const pendingHomeScrollRestoreAttemptsRef = useRef(0);
  const pendingHomeListingRestoreRef = useRef<HomeListingSnapshot | null>(null);
  const hasProviderPanelAccess = Boolean(currentUser?.providerId);

  function persistHomeListingSnapshot(snapshot: HomeListingSnapshot) {
    try {
      window.sessionStorage.setItem(HOME_LISTING_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage failures and keep navigation functional.
    }
  }

  function loadHomeListingSnapshot(): HomeListingSnapshot | null {
    try {
      const rawValue = window.sessionStorage.getItem(HOME_LISTING_SNAPSHOT_STORAGE_KEY);
      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue) as Partial<HomeListingSnapshot>;
      if (!parsedValue || typeof parsedValue !== 'object') {
        return null;
      }

      return {
        path: typeof parsedValue.path === 'string' ? parsedValue.path : '/',
        searchCriteria: {
          query: parsedValue.searchCriteria?.query || '',
          city: parsedValue.searchCriteria?.city || '',
          category: parsedValue.searchCriteria?.category || '',
          subcategory: parsedValue.searchCriteria?.subcategory || '',
          priceRange: parsedValue.searchCriteria?.priceRange || [0, 5000],
        },
        sortBy: typeof parsedValue.sortBy === 'string' ? parsedValue.sortBy : 'rating',
        homeVisibleCount: Math.max(HOME_INITIAL_ITEMS, Number(parsedValue.homeVisibleCount) || HOME_INITIAL_ITEMS),
        scrollY: Math.max(0, Number(parsedValue.scrollY) || 0),
        anchorArtistId: typeof parsedValue.anchorArtistId === 'string' ? parsedValue.anchorArtistId : undefined,
        anchorViewportOffset: parsedValue.anchorViewportOffset === undefined
          ? undefined
          : Math.max(0, Number(parsedValue.anchorViewportOffset) || 0),
        updatedAt: Number(parsedValue.updatedAt) || 0,
      };
    } catch {
      return null;
    }
  }

  function buildHomeListingSnapshot(anchorArtistId?: string, anchorElement?: HTMLElement | null): HomeListingSnapshot {
    return {
      path: currentRoute,
      searchCriteria: {
        query: searchCriteria.query || '',
        city: searchCriteria.city || '',
        category: searchCriteria.category || '',
        subcategory: searchCriteria.subcategory || '',
        priceRange: searchCriteria.priceRange || [0, 5000],
      },
      sortBy,
      homeVisibleCount,
      scrollY: window.scrollY || 0,
      anchorArtistId,
      anchorViewportOffset: anchorElement ? Math.max(0, Math.round(anchorElement.getBoundingClientRect().top)) : undefined,
      updatedAt: Date.now(),
    };
  }

  function restoreHomeListingSnapshot(snapshot: HomeListingSnapshot) {
    setSelectedArtist(null);
    setViewMode('client');

    setSearchCriteria((previous) => (
      searchCriteriaEquals(previous, snapshot.searchCriteria)
        ? previous
        : snapshot.searchCriteria
    ));

    setSortBy((previous) => (previous === snapshot.sortBy ? previous : snapshot.sortBy));
    setHomeVisibleCount((previous) => Math.max(previous, HOME_INITIAL_ITEMS, snapshot.homeVisibleCount));

    pendingHomeListingRestoreRef.current = snapshot;
    pendingHomeScrollRestoreRef.current = snapshot.scrollY;
    pendingHomeScrollRestoreAttemptsRef.current = 0;

    if (currentRoute !== snapshot.path) {
      navigateTo(snapshot.path, { replace: true, scrollToTop: false });
    }
  }

  function getHomeListingSnapshotFromHistoryState(state: unknown): HomeListingSnapshot | null {
    const candidate = (state as AppNavigationState | null | undefined)?.homeListingSnapshot;

    if (!candidate) {
      return null;
    }

    return {
      path: typeof candidate.path === 'string' ? candidate.path : '/',
      searchCriteria: {
        query: candidate.searchCriteria?.query || '',
        city: candidate.searchCriteria?.city || '',
        category: candidate.searchCriteria?.category || '',
        subcategory: candidate.searchCriteria?.subcategory || '',
        priceRange: candidate.searchCriteria?.priceRange || [0, 5000],
      },
      sortBy: typeof candidate.sortBy === 'string' ? candidate.sortBy : 'rating',
      homeVisibleCount: Math.max(HOME_INITIAL_ITEMS, Number(candidate.homeVisibleCount) || HOME_INITIAL_ITEMS),
      scrollY: Math.max(0, Number(candidate.scrollY) || 0),
      anchorArtistId: typeof candidate.anchorArtistId === 'string' ? candidate.anchorArtistId : undefined,
      anchorViewportOffset: candidate.anchorViewportOffset === undefined
        ? undefined
        : Math.max(0, Number(candidate.anchorViewportOffset) || 0),
      updatedAt: Number(candidate.updatedAt) || 0,
    };
  }

  function getLatestHomeListingSnapshot(...snapshots: Array<HomeListingSnapshot | null>): HomeListingSnapshot | null {
    return snapshots.reduce<HomeListingSnapshot | null>((latest, snapshot) => {
      if (!snapshot) {
        return latest;
      }

      if (!latest || snapshot.updatedAt >= latest.updatedAt) {
        return snapshot;
      }

      return latest;
    }, null);
  }

  // Load initial data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const authError = window.sessionStorage.getItem('laravel_auth_error');

    if (!authError) {
      return;
    }

    toast.error(authError);
    window.sessionStorage.removeItem('laravel_auth_error');
  }, []);

  // Load provider when user changes
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setViewMode('admin');
    }

    console.log('currentUser changed:', {
      userId: currentUser?.id,
      email: currentUser?.email,
      isProvider: currentUser?.isProvider,
      providerId: currentUser?.providerId
    });

    if (currentUser?.isProvider) {
      setCurrentProvider(null);
      setProviderAccountCreated(Boolean(currentUser.providerAccountCreated || currentUser.providerId));
      console.log('User is provider, loading provider data...');
      loadCurrentProvider(currentUser.id);
    } else {
      console.log('User is not provider, clearing provider data');
      setCurrentProvider(null);
      setProviderAccountCreated(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;

    const loadScopedRecords = async () => {
      if (!currentUser) {
        if (!cancelled) {
          setContracts([]);
          setBookings([]);
        }
        return;
      }

      const normalizedPath = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';
      const isClientReservationsRoute = normalizedPath.startsWith('/me/');
      const isProviderWorkspaceRoute = normalizedPath.startsWith('/mi-negocio');

      const scope = currentUser.role === 'admin'
        ? 'all'
        : isClientReservationsRoute
          ? 'client'
          : isProviderWorkspaceRoute
            ? 'provider'
            : currentUser.isProvider && dashboardView !== 'client'
              ? 'provider'
              : 'client';

      try {
        const [contractsData, bookingsData] = await Promise.all([
          supabase.getContracts({ scope }),
          supabase.getBookings({ scope }),
        ]);

        if (cancelled) {
          return;
        }

        setContracts(contractsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error loading scoped contracts/bookings:', error);

        if (!cancelled) {
          setContracts(currentUser.role === 'admin' ? mockContracts : []);
          setBookings([]);
        }
      }
    };

    void loadScopedRecords();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.isProvider, currentRoute, dashboardView]);

  useEffect(() => {
    let cancelled = false;

    const loadProviderServices = async () => {
      if (!currentUser?.isProvider || !currentUser.id) {
        return;
      }

      try {
        const providerServices = await supabase.getServices({
          view: 'summary',
          userId: currentUser.id,
        });

        if (cancelled || !providerServices.length) {
          return;
        }

        setArtists((prev) => mergeArtistsById(prev, providerServices));
      } catch (error) {
        console.error('Error loading provider services:', error);
      }
    };

    void loadProviderServices();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.isProvider]);

  // Update selected artist when artists state changes
  useEffect(() => {
    if (selectedArtist) {
      const updatedArtist = artists.find(a => a.id === selectedArtist.id);
      if (updatedArtist) {
        setSelectedArtist(updatedArtist);
      }
    }
  }, [artists]);

  // Keep review aggregates in sync without triggering extra service requests.
  useEffect(() => {
    if (artists.length === 0 && marketplaceArtists.length === 0) {
      return;
    }

    setArtists((previous) => applyReviewAggregates(previous, reviews));
    setMarketplaceArtists((previous) => applyReviewAggregates(previous, reviews));
  }, [reviews]);

  // Load all users when currentUser becomes admin
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      console.log('Admin user detected, loading all users...');
      loadAllUsers();
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (!currentUser || !notificationsEnabled) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      dismissedNotificationIdsRef.current = new Set();
      return;
    }

    dismissedNotificationIdsRef.current = loadDismissedNotificationIds(currentUser.id);

    let cancelled = false;

    const loadInitialNotifications = async () => {
      try {
        const data = await supabase.getNotifications({ limit: 8 });
        if (!cancelled) {
          const nextItems = Array.isArray(data?.items) ? data.items : [];
          setNotifications(nextItems.filter((item: HeaderNotification) => !dismissedNotificationIdsRef.current.has(item.id)));
          setUnreadNotificationsCount(Number(data?.unreadCount || 0));
        }
      } catch (error: any) {
        if (!cancelled) {
          // Backend may have feature disabled - keep UI graceful.
          if (!String(error?.message || '').includes('disabled')) {
            console.error('Error loading notifications:', error);
          }
          setNotifications([]);
          setUnreadNotificationsCount(0);
        }
      }
    };

    const refreshUnreadCount = async () => {
      try {
        const count = await supabase.getUnreadNotificationsCount();
        if (!cancelled) {
          setUnreadNotificationsCount(count);
        }
      } catch {
        // Silent polling failure.
      }
    };

    loadInitialNotifications();
    const intervalId = setInterval(refreshUnreadCount, 30000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentUser?.id, notificationsEnabled]);

  useEffect(() => {
    if (!currentUser) {
      setFavoriteServiceIds([]);
      return;
    }

    let cancelled = false;

    const loadFavorites = async () => {
      try {
        const ids = await supabase.getFavorites();
        if (!cancelled) {
          setFavoriteServiceIds(Array.isArray(ids) ? ids : []);
        }
      } catch {
        if (!cancelled) {
          setFavoriteServiceIds([]);
        }
      }
    };

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Handle URL routing
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);

      const snapshot = getLatestHomeListingSnapshot(
        getHomeListingSnapshotFromHistoryState(window.history.state),
        loadHomeListingSnapshot()
      );
      if (snapshot && snapshot.path === window.location.pathname) {
        restoreHomeListingSnapshot(snapshot);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadData = async () => {
    try {
      // Initialize admin user first (if needed)
      try {
        await supabase.initializeAdmin();
        console.log('Admin user initialized successfully');
      } catch (error) {
        console.log('Admin user already exists or initialization not needed');
      }
      let hasEmptyTables = false;

      // Reviews are loaded here; service listing is fetched by marketplace effects.
      const reviewsData = await supabase.getReviews();
      const loadedReviews: Review[] = reviewsData && reviewsData.length > 0 ? reviewsData : [];

      if (loadedReviews.length === 0) {
        hasEmptyTables = true;
      }

      setReviews(loadedReviews);

      // Load providers
      const providersData = await supabase.getProviders();
      if (providersData && providersData.length > 0) {
        setProviders(providersData);
      } else {
        setProviders(mockProviders);
        hasEmptyTables = true;
      }

      // Load events
      const eventsData = await supabase.getEvents();
      if (eventsData && eventsData.length > 0) {
        setEvents(eventsData);
      } else {
        setEvents(mockEvents);
        hasEmptyTables = true;
      }

      // Users will be loaded separately when admin logs in (see useEffect)

      // If database is empty, enable demo mode silently
      if (hasEmptyTables) {
        setIsDemoMode(true);
        console.log('📊 Base de datos vacía - Mostrando datos de ejemplo');
        // No mostramos toast para no molestar al usuario
      } else {
        console.log('✅ Datos cargados desde la base de datos');
      }
    } catch (error: any) {
      // Downgrade logging for transient/expected errors
      if (error?.message?.includes('compute resources')) {
        console.log('Backend overloaded, using demo data');
      } else {
        console.log('Error de conexión al backend:', error?.message || error);
      }

      setIsDemoMode(true);
      toast.error('Backend no disponible - Usando datos de ejemplo', {
        duration: 5000,
      });

      // Fallback to mock data
      setArtists(mockArtists);
      setMarketplaceArtists(mockArtists);
      setMarketplaceTotal(mockArtists.length);
      setMarketplaceHasMore(false);
      setReviews(mockReviews);
      setEvents(mockEvents);
      setContracts(mockContracts);
      setProviders(mockProviders);
      setAllUsers(mockUsers);
    }
  };

  const loadAllUsers = async () => {
    try {
      console.log('Loading all users from database...');
      const usersData = await supabase.getAllUsers();
      if (usersData && usersData.length > 0) {
        console.log(`✅ Loaded ${usersData.length} users from database`);
        setAllUsers(usersData);
      } else {
        console.log('No users found in database, using mock data');
        setAllUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers(mockUsers);
    }
  };

  const loadCurrentProvider = async (userId?: string) => {
    const userIdToUse = userId || currentUser?.id;
    if (!userIdToUse) return null;

    try {
      console.log('Loading provider for user:', userIdToUse);
      const provider = await supabase.getProviderByUserId(userIdToUse);
      console.log('Provider loaded:', provider);
      setCurrentProvider(provider);
      setProviderAccountCreated(Boolean(provider));
      return provider;
    } catch (error) {
      console.error('Error loading provider:', error);
      setProviderAccountCreated(false);
      return null;
    }
  };

  const getProviderBusinessPath = () => {
    return hasProviderPanelAccess ? '/mi-negocio' : '/mi-negocio/create';
  };

  const handleViewProfile = (artist: Artist, anchorElement?: HTMLElement | null) => {
    const snapshot = buildHomeListingSnapshot(artist.id, anchorElement);
    persistHomeListingSnapshot(snapshot);
    setSelectedArtist(artist);
    navigateTo(getServiceSeoPath(artist), {
      state: {
        fromMarketplace: true,
        homeListingSnapshot: snapshot,
      },
    });
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
    setShowBooking(true);
  };

  const handleToggleFavorite = async (artist: Artist) => {
    if (!currentUser) {
      return;
    }

    const isFavorite = favoriteServiceIds.includes(artist.id);

    try {
      if (isFavorite) {
        await supabase.removeFavorite(artist.id);
        setFavoriteServiceIds((prev) => prev.filter((id) => id !== artist.id));
        toast.success('Servicio eliminado de favoritos');
      } else {
        await supabase.addFavorite(artist.id);
        setFavoriteServiceIds((prev) => (prev.includes(artist.id) ? prev : [...prev, artist.id]));
        toast.success('Servicio agregado a favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('No se pudo actualizar favoritos');
    }
  };

  const handleContractCreated = async (contract: Contract) => {
    try {
      const createdContract = await supabase.createContract(contract);
      setContracts(prev => [...prev, createdContract]);

      // If contract has an eventId, add it to the event's contract list
      if (createdContract.eventId) {
        const event = events.find(e => e.id === createdContract.eventId);
        if (event) {
          const contractIds = new Set(event.contractIds);
          contractIds.add(createdContract.id);
          await handleUpdateEvent(createdContract.eventId, {
            contractIds: Array.from(contractIds)
          }, true); // silent = true para no mostrar toast
        }
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Error al crear el contrato');
    }
  };

  const handleSignUp = async (email: string, password: string, name: string, phone: string, isProvider: boolean) => {
    try {
      const result = await supabase.signUp(email, password, name, phone, isProvider);

      if (isProvider && result.user?.providerRequestStatus === 'pending') {
        toast.success('Tu solicitud de proveedor fue enviada y está pendiente de aprobación.');
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
        const provider = await loadCurrentProvider();
        setViewMode('business');
        setDashboardView('provider');
        navigateTo(provider ? '/mi-negocio' : '/mi-negocio/create');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await supabase.signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Error al iniciar sesión con Google');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.signOut();
      setViewMode('client');
      setDashboardView('provider');
      setCurrentProvider(null);
      setProviderAccountCreated(false);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleProviderCreate = async (provider: Provider) => {
    try {
      if (!currentUser) {
        toast.error('Debes iniciar sesion para crear tu perfil de proveedor');
        return;
      }

      const representative = (provider as any).representative || {
        type: (provider as any).legalEntityType || 'person',
        name: (provider as any).representativeName || currentUser.name || '',
        documentType: ((provider as any).legalEntityType || 'person') === 'company' ? 'RIF' : 'CI',
        documentNumber: (provider as any).identificationNumber || '',
      };

      const createdProvider = await supabase.createProvider({
        businessName: provider.businessName,
        category: provider.category,
        description: provider.description,
        representative,
        legalEntityType: representative.type || 'person',
        representativeName: representative.name || currentUser.name || '',
        identificationNumber: representative.documentNumber || '',
      });

      setCurrentProvider(createdProvider);
      setProviderAccountCreated(true);
      setProviders((prev) => {
        const withoutCurrent = prev.filter((p) => p.userId !== createdProvider.userId);
        return [createdProvider, ...withoutCurrent];
      });

      await supabase.updateUser(currentUser.id, {
        providerId: createdProvider.id,
      });

      await loadCurrentProvider(currentUser.id);
      toast.success('¡Perfil de proveedor creado exitosamente!');
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Error al crear perfil de proveedor');
      throw error;
    }
  };

  const handleProviderUpdate = async (provider: Provider) => {
    try {
      const representative = (provider as any).representative || {
        type: (provider as any).legalEntityType || 'person',
        name: (provider as any).representativeName || currentUser?.name || '',
        documentType: ((provider as any).legalEntityType || 'person') === 'company' ? 'RIF' : 'CI',
        documentNumber: (provider as any).identificationNumber || '',
      };

      const updatedProvider = await supabase.updateProvider(provider.id, {
        businessName: provider.businessName,
        category: provider.category,
        description: provider.description,
        representative,
        legalEntityType: representative.type || 'person',
        representativeName: representative.name || currentUser?.name || '',
        identificationNumber: representative.documentNumber || '',
      });

      setCurrentProvider(updatedProvider);
      setProviders((prev) => prev.map((item) => (item.id === updatedProvider.id ? updatedProvider : item)));
    } catch (error) {
      console.error('Error updating provider:', error);
      toast.error('Error al actualizar información del negocio');
      throw error;
    }
  };

  const handleBecomeProvider = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para convertirte en proveedor');
      return;
    }

    try {
      const result = await supabase.requestProviderAccess(currentUser.id);
      setShowUserProfile(false);

      if (result?.status === 'pending') {
        toast.success('Solicitud enviada. Un administrador debe aprobar tu acceso como proveedor.');
      } else {
        toast.success('Tu solicitud de proveedor ya fue procesada.');
      }
    } catch (error: any) {
      console.error('Error becoming provider:', error);

      // Show more friendly error message
      if (error?.message?.includes('BACKEND_UNAVAILABLE')) {
        toast.error('El servidor no está disponible. Por favor, intenta de nuevo más tarde.');
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Error al enviar solicitud de proveedor');
      }
    }
  };

  const handleServiceCreate = async (service: Artist) => {
    try {
      const createdService = await supabase.createService(service);
      setArtists((prev) => mergeArtistsById(prev, [createdService]));
      setMarketplaceArtists((prev) => mergeArtistsById(prev, [createdService]));

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
      setArtists((prev) => prev.map((service) => service.id === updated.id ? updated : service));
      setMarketplaceArtists((prev) => prev.map((service) => service.id === updated.id ? { ...service, ...updated } : service));
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Error al actualizar servicio');
    }
  };

  const handleServiceDelete = async (serviceId: string) => {
    try {
      await supabase.deleteService(serviceId);
      setArtists((prev) => prev.filter((service) => service.id !== serviceId));
      setMarketplaceArtists((prev) => prev.filter((service) => service.id !== serviceId));
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
  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para crear un evento');
      return;
    }

    try {
      const createdEvent = await supabase.createEvent(eventData);
      setEvents(prev => [...prev, createdEvent]);
      toast.success('Evento creado exitosamente');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error al crear evento');
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<Event>, silent = false) => {
    try {
      const updatedEvent = await supabase.updateEvent(eventId, updates);
      setEvents(prev => prev.map(event =>
        event.id === eventId ? updatedEvent : event
      ));
      if (!silent) {
        toast.success('Evento actualizado');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Error al actualizar evento');
    }
  };

  // Navigation function
  const navigateTo = (path: string, options?: { replace?: boolean; scrollToTop?: boolean; state?: Record<string, unknown> }) => {
    const method = options?.replace ? 'replaceState' : 'pushState';
    window.history[method](options?.state || {}, '', path);
    setCurrentRoute(path);
    setShowAbout(false);
    setShowHowItWorks(false);
    setShowForProviders(false);
    setShowForClients(false);
    if (options?.scrollToTop !== false) {
      window.scrollTo(0, 0);
    }
  };

  const handleBookingConfirmed = (payload: { booking: Booking; contract: Contract; artist: Artist; planName?: string }) => {
    const isUnitBooking = payload.booking.metadata?.saleType === 'unit';
    const unitLabel = String((payload.booking.metadata as any)?.unitLabel || 'unidad(es)');
    const durationLabel = isUnitBooking
      ? `${payload.booking.duration} ${unitLabel}`
      : `${payload.booking.duration} ${payload.booking.duration === 1 ? 'hora' : 'horas'}`;

    const details: BookingConfirmationState = {
      bookingId: payload.booking.id,
      contractId: payload.contract.id,
      artistName: payload.artist.name,
      serviceName: payload.planName || payload.booking.planName || payload.artist.name,
      date: payload.booking.date,
      time: payload.booking.startTime,
      location: payload.booking.location,
      duration: durationLabel,
      totalPrice: Number(payload.booking.totalPrice || payload.contract.terms.price || 0),
      planName: payload.planName || payload.booking.planName,
      providerPhone: payload.contract.artistWhatsapp || payload.artist.whatsappNumber,
      providerEmail: payload.contract.artistEmail || payload.artist.email,
      contract: payload.contract,
    };

    setBookingConfirmationData(details);
    setShowBooking(false);
    setSelectedPlan(null);
    navigateTo('/reserva-confirmada', { state: { bookingConfirmation: details } });
  };

  const handleDownloadConfirmedContract = () => {
    if (!bookingConfirmationData?.contract) {
      toast.error('No hay un contrato disponible para descargar');
      return;
    }

    try {
      downloadContractPdf(bookingConfirmationData.contract, 'client');
    } catch (error) {
      console.error('Error downloading confirmed contract:', error);
      toast.error('No se pudo descargar el contrato');
    }
  };

  const handleContactConfirmedProvider = () => {
    if (!bookingConfirmationData?.bookingId) {
      toast.error('No encontramos la reserva para abrir el chat');
      return;
    }

    window.dispatchEvent(new CustomEvent('memorialo:open-chat', {
      detail: { bookingId: bookingConfirmationData.bookingId },
    }));
  };

  useEffect(() => {
    const handleOpenBookingEvent = (event: Event) => {
      if (!currentUser) {
        return;
      }

      const customEvent = event as CustomEvent<OpenBookingEventDetail>;
      const bookingId = customEvent.detail?.bookingId ? String(customEvent.detail.bookingId) : null;
      const contractId = customEvent.detail?.contractId ? String(customEvent.detail.contractId) : null;

      setViewMode('business');

      if (currentUser.isProvider) {
        setDashboardView('provider');
        setProviderDashboardSection('bookings');
        setProviderFocusedBookingId(bookingId);
        setClientFocusedBookingId(null);
        navigateTo('/mi-negocio/reservas');
        return;
      }

      setDashboardView('client');
      setClientDashboardSection('bookings');
      setClientFocusedBookingId(bookingId);
      setClientFocusedContractId(contractId);
      navigateTo('/me/reservas');
    };

    window.addEventListener('memorialo:open-booking', handleOpenBookingEvent);

    return () => {
      window.removeEventListener('memorialo:open-booking', handleOpenBookingEvent);
    };
  }, [currentUser]);

  const slugify = (value?: string) => {
    if (!value) return '';

    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const normalizeForSearch = (value?: string) => {
    if (!value) return '';

    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const serviceCategorySlug = (artist: Artist) => {
    const rawCategory = artist.subcategory || artist.category || 'servicios';
    return slugify(rawCategory) || 'servicios';
  };

  const serviceTitleSlug = (artist: Artist) => {
    return slugify(artist.name || artist.description || 'publicacion') || 'publicacion';
  };

  const serviceUserCode = (artist: Artist) => {
    const persistedCode = (artist as any).publicCode || (artist as any)?.metadata?.publicCode;
    if (typeof persistedCode === 'string' && /^MEM-\d{7}$/i.test(persistedCode)) {
      return persistedCode.toUpperCase();
    }

    const rawUserId = String(artist.userId || artist.providerId || artist.id || '0');
    const numericFromId = rawUserId.replace(/\D/g, '');

    if (numericFromId) {
      const code = numericFromId.slice(-7).padStart(7, '0');
      return `MEM-${code}`;
    }

    const hash = rawUserId
      .split('')
      .reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) % 10000000, 0)
      .toString()
      .padStart(7, '0');

    return `MEM-${hash}`;
  };

  const getServiceSeoPath = (artist: Artist) => {
    return `/${serviceCategorySlug(artist)}/${serviceUserCode(artist)}-${serviceTitleSlug(artist)}`;
  };

  const mergeArtistsById = (existing: Artist[], incoming: Artist[]) => {
    const artistMap = new Map(existing.map((artist) => [artist.id, artist]));

    incoming.forEach((artist) => {
      const current = artistMap.get(artist.id);
      artistMap.set(artist.id, current ? { ...current, ...artist } : artist);
    });

    return Array.from(artistMap.values());
  };

  const applyReviewAggregates = (sourceArtists: Artist[], sourceReviews: Review[]) => {
    return sourceArtists.map((artist) => {
      const artistReviews = sourceReviews.filter((review) => review.artistId === artist.id);

      if (artistReviews.length === 0) {
        return artist;
      }

      const totalRating = artistReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / artistReviews.length;

      return {
        ...artist,
        rating: Math.round(averageRating * 10) / 10,
        reviews: artistReviews.length,
      };
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadMarketplaceConfig = async () => {
      try {
        const config = await supabase.getMarketplaceConfig();
        const nextAllCities = Array.isArray(config?.allCities) && config.allCities.length > 0
          ? config.allCities
          : VENEZUELAN_CITIES;
        const nextEnabledCities = Array.isArray(config?.enabledCities)
          ? config.enabledCities
          : nextAllCities;

        if (!cancelled) {
          setAllMarketplaceCities(nextAllCities);
          setEnabledMarketplaceCities(nextEnabledCities);
        }
      } catch {
        if (!cancelled) {
          setAllMarketplaceCities(VENEZUELAN_CITIES);
          setEnabledMarketplaceCities(VENEZUELAN_CITIES);
        }
      }
    };

    void loadMarketplaceConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchCriteria.city && !enabledMarketplaceCities.includes(searchCriteria.city)) {
      setSearchCriteria((previous) => ({
        ...previous,
        city: '',
      }));
    }
  }, [enabledMarketplaceCities, searchCriteria.city]);

  const citySlugLookup = useMemo(() => {
    const lookup = new Map<string, string>();

    VENEZUELAN_CITIES.forEach((city) => {
      lookup.set(slugify(city), city);
    });

    return lookup;
  }, []);

  const taxonomySlugLookup = useMemo(() => {
    const lookup = new Map<string, TaxonomyTarget>();

    const register = (rawValue: string | undefined, target: TaxonomyTarget) => {
      const key = slugify(rawValue);
      if (!key) return;
      lookup.set(key, target);
    };

    Object.entries(SERVICE_CATEGORIES).forEach(([category, entry]) => {
      register(category, { label: category, filterBy: 'category' });
      entry.subcategories.forEach((subcategory) => {
        register(subcategory, { label: subcategory, filterBy: 'subcategory' });
      });
    });

    artists.forEach((artist) => {
      if (artist.category) {
        register(artist.category, { label: artist.category, filterBy: 'category' });
      }
      if (artist.subcategory) {
        register(artist.subcategory, { label: artist.subcategory, filterBy: 'subcategory' });
      }
      artist.specialties?.forEach((specialty) => {
        register(specialty, { label: specialty, filterBy: 'subcategory' });
      });
    });

    const aliases: Record<string, string> = {
      dj: 'Música y DJs',
      djs: 'Música y DJs',
      mariachis: 'Cultura y Ceremonia',
      'salones-y-baquetes': 'Salones y Banquetes'
    };

    Object.entries(aliases).forEach(([alias, canonicalLabel]) => {
      const canonical = lookup.get(slugify(canonicalLabel));
      if (canonical) {
        lookup.set(alias, canonical);
      }
    });

    return lookup;
  }, [artists]);

  const typeQuerySlugLookup = useMemo(() => {
    const lookup = new Map<string, string>();

    const register = (alias: string, slug: string) => {
      lookup.set(normalizeForSearch(alias), slug);
      lookup.set(slugify(alias), slug);
    };

    register('dj', 'djs');
    register('djs', 'djs');
    register('musica y djs', 'djs');
    register('salones', 'salones-y-banquetes');
    register('salon', 'salones-y-banquetes');
    register('salones y banquetes', 'salones-y-banquetes');
    register('salones y baquetes', 'salones-y-banquetes');
    register('mariachi', 'mariachis');
    register('mariachis', 'mariachis');

    return lookup;
  }, []);

  const citySlugEntries = useMemo(
    () => Array.from(citySlugLookup.entries()),
    [citySlugLookup]
  );

  const levenshteinDistance = (a: string, b: string) => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);

    for (let j = 1; j <= b.length; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const resolveCityFromText = (rawText?: string) => {
    const normalized = normalizeForSearch(rawText);
    if (!normalized) {
      return null;
    }

    const tokens = normalized.split(' ').filter(Boolean);

    for (let size = Math.min(3, tokens.length); size >= 1; size -= 1) {
      for (let i = 0; i <= tokens.length - size; i += 1) {
        const candidate = tokens.slice(i, i + size).join(' ');
        const slug = slugify(candidate);

        if (citySlugLookup.has(slug)) {
          const city = citySlugLookup.get(slug) as string;
          return { city, citySlug: slug };
        }
      }
    }

    let bestMatch: { city: string; citySlug: string; distance: number } | null = null;
    tokens.forEach((token) => {
      citySlugEntries.forEach(([citySlug, city]) => {
        const distance = levenshteinDistance(token, citySlug);
        if (distance <= 2 && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { city, citySlug, distance };
        }
      });
    });

    return bestMatch ? { city: bestMatch.city, citySlug: bestMatch.citySlug } : null;
  };

  const resolveTypeSlugFromText = (rawText?: string) => {
    const normalized = normalizeForSearch(rawText);
    if (!normalized) {
      return '';
    }

    if (typeQuerySlugLookup.has(normalized)) {
      return typeQuerySlugLookup.get(normalized) as string;
    }

    const slug = slugify(normalized);
    if (typeQuerySlugLookup.has(slug)) {
      return typeQuerySlugLookup.get(slug) as string;
    }

    const directTaxonomy = taxonomySlugLookup.get(slug);
    if (directTaxonomy) {
      return slug;
    }

    if (normalized.includes('dj')) {
      return 'djs';
    }
    if (normalized.includes('salon')) {
      return 'salones-y-banquetes';
    }

    return '';
  };

  const extractSemanticQueryAndCity = (rawQuery: string) => {
    const normalized = normalizeForSearch(rawQuery);
    if (!normalized) {
      return { semanticQuery: '', citySlug: '', city: '' };
    }

    const enSeparator = normalized.match(/(.+)\sen\s(.+)/);
    if (enSeparator) {
      const semanticQuery = enSeparator[1].trim();
      const cityMatch = resolveCityFromText(enSeparator[2].trim());
      if (cityMatch) {
        return {
          semanticQuery,
          citySlug: cityMatch.citySlug,
          city: cityMatch.city
        };
      }
    }

    const cityMatch = resolveCityFromText(normalized);
    if (cityMatch) {
      const cityText = normalizeForSearch(cityMatch.city);
      const semanticQuery = normalized.replace(new RegExp(`\\b${cityText}\\b`, 'i'), '').replace(/\ben\b/i, '').trim();
      return {
        semanticQuery,
        citySlug: cityMatch.citySlug,
        city: cityMatch.city
      };
    }

    return {
      semanticQuery: normalized,
      citySlug: '',
      city: ''
    };
  };

  const buildMarketplacePathFromCriteria = (criteria: SearchCriteria) => {
    const explicitCitySlug = slugify(criteria.city);
    const taxonomySlug = slugify(criteria.subcategory || criteria.category);

    if (explicitCitySlug && taxonomySlug) {
      return `/servicios/${explicitCitySlug}/${taxonomySlug}`;
    }

    if (taxonomySlug) {
      return `/servicios/venezuela/${taxonomySlug}`;
    }

    const normalizedQuery = normalizeForSearch(criteria.query);

    if (normalizedQuery) {
      const semantic = extractSemanticQueryAndCity(normalizedQuery);
      const inferredCitySlug = explicitCitySlug || semantic.citySlug;
      const typeSlug = resolveTypeSlugFromText(semantic.semanticQuery || normalizedQuery);

      if (typeSlug && inferredCitySlug) {
        return `/servicios/${inferredCitySlug}/${typeSlug}`;
      }

      if (typeSlug) {
        return `/servicios/venezuela/${typeSlug}`;
      }

      if (inferredCitySlug) {
        return `/s/${slugify(semantic.semanticQuery || normalizedQuery)}-en-${inferredCitySlug}`;
      }

      return `/s/${slugify(normalizedQuery)}`;
    }

    if (explicitCitySlug) {
      return `/servicio/${explicitCitySlug}`;
    }

    return '/';
  };

  const parseMarketplaceRoute = (path: string): MarketplaceRouteContext | null => {
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length === 0) {
      return null;
    }

    const [prefix, second, third] = parts;

    if (prefix === 's' && parts.length === 2) {
      const semanticSlug = second;
      const citySuffix = citySlugEntries
        .map(([citySlug]) => citySlug)
        .sort((a, b) => b.length - a.length)
        .find((citySlug) => semanticSlug.endsWith(`-en-${citySlug}`));

      const querySlug = citySuffix
        ? semanticSlug.replace(new RegExp(`-en-${citySuffix}$`), '')
        : semanticSlug;

      const semanticQuery = querySlug.replace(/-/g, ' ').trim();
      const taxonomyFromQuerySlug = resolveTypeSlugFromText(semanticQuery);
      const taxonomy = taxonomyFromQuerySlug ? taxonomySlugLookup.get(taxonomyFromQuerySlug) : undefined;

      return {
        city: citySuffix ? citySlugLookup.get(citySuffix) : undefined,
        taxonomy,
        query: semanticQuery,
        canonicalPath: `/s/${semanticSlug}`
      };
    }

    if (prefix === 'servicio' && parts.length === 2) {
      const city = citySlugLookup.get(second);
      if (!city) {
        return null;
      }

      return {
        city,
        canonicalPath: `/servicio/${slugify(city)}`
      };
    }

    if (prefix === 'servicios' && parts.length === 2) {
      const city = citySlugLookup.get(second);
      if (!city) {
        return null;
      }

      return {
        city,
        canonicalPath: `/servicios/${slugify(city)}`
      };
    }

    const supportsMarketplace = prefix === 'proveedores' || prefix === 'servicios';
    if (!supportsMarketplace) {
      return null;
    }

    if (parts.length === 2) {
      const city = citySlugLookup.get(second);
      if (city) {
        return {
          city,
          canonicalPath: `/servicio/${slugify(city)}`
        };
      }

      const taxonomy = taxonomySlugLookup.get(second);
      if (taxonomy) {
        return {
          taxonomy,
          canonicalPath: `/servicios/venezuela/${slugify(taxonomy.label)}`
        };
      }

      return null;
    }

    if (parts.length === 3) {
      const taxonomy = taxonomySlugLookup.get(third);

      if (!taxonomy) {
        return null;
      }

      if (second === 'venezuela') {
        return {
          taxonomy,
          canonicalPath: `/servicios/venezuela/${third}`
        };
      }

      const city = citySlugLookup.get(second);

      if (!city) {
        return null;
      }

      return {
        city,
        taxonomy,
        canonicalPath: `/servicios/${slugify(city)}/${third}`
      };
    }

    return null;
  };

  const handleSearchCriteriaChange = (nextCriteria: SearchCriteria) => {
    const normalized: SearchCriteria = {
      query: nextCriteria.query || '',
      city: nextCriteria.city || '',
      category: nextCriteria.category || '',
      subcategory: nextCriteria.subcategory || '',
      priceRange: nextCriteria.priceRange || [0, 5000]
    };

    setSearchCriteria(normalized);

    if (viewMode !== 'client') {
      setViewMode('client');
    }

    const targetPath = buildMarketplacePathFromCriteria(normalized);
    if (currentRoute !== targetPath) {
      navigateTo(targetPath);
    }
  };

  const handleHeaderSearchSubmit = () => {
    const nextQuery = (headerSearchInput || '').trim();

    handleSearchCriteriaChange({
      ...searchCriteria,
      query: nextQuery
    });

    // Keep the header input ready for a new search after submit.
    setHeaderSearchInput('');
  };

  const handleHeaderHomeRefresh = () => {
    window.location.assign('/');
  };

  const marketplaceRouteContext = useMemo(
    () => parseMarketplaceRoute(currentRoute),
    [currentRoute, citySlugLookup, taxonomySlugLookup]
  );

  const marketplaceCacheKey = useMemo(() => {
    const isFavorites = currentRoute === '/favoritos';
    const cacheScope = isFavorites ? `favorites:${currentUser?.id || 'anon'}` : 'public';

    const normalized = {
      path: marketplaceRouteContext?.canonicalPath || (isFavorites ? '/favoritos' : '/'),
      query: (searchCriteria.query || '').trim().toLowerCase(),
      city: (searchCriteria.city || '').trim().toLowerCase(),
      category: (searchCriteria.category || '').trim().toLowerCase(),
      subcategory: (searchCriteria.subcategory || '').trim().toLowerCase(),
      minPrice: Number(searchCriteria.priceRange[0] || 0),
      maxPrice: Number(searchCriteria.priceRange[1] || 0),
      sortBy,
      favoritesHash: isFavorites ? favoriteServiceIds.slice().sort().join(',') : '',
      enabledCitiesHash: enabledMarketplaceCities.slice().sort().join(','),
      scope: cacheScope,
    };

    return JSON.stringify(normalized);
  }, [
    currentRoute,
    marketplaceRouteContext,
    currentUser?.id,
    searchCriteria.query,
    searchCriteria.city,
    searchCriteria.category,
    searchCriteria.subcategory,
    searchCriteria.priceRange,
    sortBy,
    favoriteServiceIds,
    enabledMarketplaceCities,
  ]);

  const isServiceDetailPath = (path: string) => {
    const cleanPath = (path.split('?')[0] || '').replace(/\/+$/, '');

    if (cleanPath.startsWith('/servicio/')) {
      return true;
    }

    const parts = cleanPath.split('/').filter(Boolean);
    return parts.length === 2 && /^MEM-\d{7}-.+/i.test(parts[1] || '');
  };

  useEffect(() => {
    const isListingRoute = currentRoute === '/' || currentRoute === '/favoritos' || Boolean(marketplaceRouteContext);
    const cameFromServiceDetail = isServiceDetailPath(previousRouteRef.current);

    if (!isListingRoute || viewMode !== 'client' || selectedArtist) {
      return;
    }

    const criteriaChanged = lastMarketplaceCriteriaKeyRef.current !== marketplaceCacheKey;
    if (!criteriaChanged) {
      return;
    }

    lastMarketplaceCriteriaKeyRef.current = marketplaceCacheKey;

    const cachedEntry = marketplaceCacheRef.current[marketplaceCacheKey];

    if (cachedEntry) {
      setMarketplaceArtists(cachedEntry.artists);
      setMarketplaceTotal(cachedEntry.total);
      setMarketplaceHasMore(cachedEntry.hasMore);
      setMarketplacePage(Math.max(1, cachedEntry.page));
      setHomeVisibleCount((previous) => Math.max(previous, HOME_INITIAL_ITEMS, cachedEntry.homeVisibleCount));
      return;
    }

    if (cameFromServiceDetail && marketplaceArtists.length > 0) {
      return;
    }

    setMarketplaceArtists([]);
    setMarketplaceTotal(0);
    setMarketplaceHasMore(currentRoute !== '/favoritos');
    setMarketplacePage(1);
  }, [
    currentRoute,
    marketplaceRouteContext,
    viewMode,
    selectedArtist,
    searchCriteria.query,
    searchCriteria.city,
    searchCriteria.category,
    searchCriteria.subcategory,
    searchCriteria.priceRange[0],
    searchCriteria.priceRange[1],
    sortBy,
    currentRoute === '/favoritos' ? favoriteServiceIds.join(',') : '',
    marketplaceCacheKey,
  ]);

  useEffect(() => {
    previousRouteRef.current = currentRoute;
  }, [currentRoute]);

  useEffect(() => {
    const isListingRoute = currentRoute === '/' || currentRoute === '/favoritos' || Boolean(marketplaceRouteContext);

    if (!isListingRoute || viewMode !== 'client' || selectedArtist || marketplacePage <= 0) {
      return;
    }

    marketplaceCacheRef.current[marketplaceCacheKey] = {
      artists: marketplaceArtists,
      total: marketplaceTotal,
      hasMore: marketplaceHasMore,
      page: marketplacePage,
      homeVisibleCount,
      updatedAt: Date.now(),
    };

    const entries = Object.entries(marketplaceCacheRef.current)
      .sort(([, left], [, right]) => right.updatedAt - left.updatedAt)
      .slice(0, 12);

    marketplaceCacheRef.current = Object.fromEntries(entries);
  }, [
    currentRoute,
    marketplaceRouteContext,
    viewMode,
    selectedArtist,
    marketplaceCacheKey,
    marketplaceArtists,
    marketplaceTotal,
    marketplaceHasMore,
    marketplacePage,
    homeVisibleCount,
  ]);

  useEffect(() => {
    const isListingRoute = currentRoute === '/' || currentRoute === '/favoritos' || Boolean(marketplaceRouteContext);

    if (!isListingRoute || viewMode !== 'client' || selectedArtist || marketplacePage <= 0) {
      return;
    }

    let cancelled = false;

    const loadMarketplaceArtists = async () => {
      setMarketplaceLoading(true);

      try {
        if (currentRoute === '/favoritos') {
          if (!currentUser || favoriteServiceIds.length === 0) {
            if (!cancelled) {
              setMarketplaceArtists([]);
              setMarketplaceTotal(0);
              setMarketplaceHasMore(false);
            }
            return;
          }

          const favoriteArtists = await supabase.getServices({
            view: 'summary',
            ids: favoriteServiceIds,
            isActive: true,
            publicOnly: true,
          });
          const normalizedFavorites = applyReviewAggregates(favoriteArtists, reviews);

          if (!cancelled) {
            setMarketplaceArtists(normalizedFavorites);
            setMarketplaceTotal(normalizedFavorites.length);
            setMarketplaceHasMore(false);
            setArtists((prev) => mergeArtistsById(prev, normalizedFavorites));
          }

          return;
        }

        const response = await supabase.getServicesPage({
          view: 'summary',
          page: marketplacePage,
          perPage: HOME_LOAD_STEP,
          isActive: true,
          publicOnly: true,
          query: searchCriteria.query || undefined,
          city: searchCriteria.city || undefined,
          category: searchCriteria.category || undefined,
          subcategory: searchCriteria.subcategory || undefined,
          minPrice: searchCriteria.priceRange[0],
          maxPrice: searchCriteria.priceRange[1],
          sort: sortBy,
        });

        const normalizedItems = applyReviewAggregates(response.items, reviews);

        if (cancelled) {
          return;
        }

        setMarketplaceArtists((prev) => marketplacePage === 1 ? normalizedItems : mergeArtistsById(prev, normalizedItems));
        setMarketplaceTotal(Number(response.meta?.total || (marketplacePage === 1 ? normalizedItems.length : marketplaceTotal)));
        setMarketplaceHasMore(Boolean(response.meta?.hasMorePages));
        setArtists((prev) => mergeArtistsById(prev, normalizedItems));
      } catch (error) {
        console.error('Error loading marketplace artists:', error);
      } finally {
        if (!cancelled) {
          setMarketplaceLoading(false);
        }
      }
    };

    void loadMarketplaceArtists();

    return () => {
      cancelled = true;
    };
  }, [
    currentRoute,
    marketplaceRouteContext,
    viewMode,
    selectedArtist,
    marketplacePage,
    searchCriteria.query,
    searchCriteria.city,
    searchCriteria.category,
    searchCriteria.subcategory,
    searchCriteria.priceRange[0],
    searchCriteria.priceRange[1],
    sortBy,
    currentRoute === '/favoritos' ? favoriteServiceIds.join(',') : '',
    currentUser?.id,
  ]);

  useEffect(() => {
    if (!marketplaceRouteContext) {
      return;
    }

    if (viewMode !== 'client') {
      setViewMode('client');
    }

    setSearchCriteria((previous) => {
      const next: SearchCriteria = {
        ...previous,
        query: marketplaceRouteContext.query || '',
        city: marketplaceRouteContext.city || '',
        category: '',
        subcategory: ''
      };

      if (marketplaceRouteContext.taxonomy) {
        if (marketplaceRouteContext.taxonomy.filterBy === 'category') {
          next.category = marketplaceRouteContext.taxonomy.label;
        } else {
          next.subcategory = marketplaceRouteContext.taxonomy.label;
        }
      }

      if (
        previous.query === next.query &&
        previous.city === next.city &&
        previous.category === next.category &&
        previous.subcategory === next.subcategory
      ) {
        return previous;
      }

      return next;
    });
  }, [marketplaceRouteContext, viewMode]);

  useEffect(() => {
    const isListingRoute = currentRoute === '/' || currentRoute === '/favoritos' || Boolean(marketplaceRouteContext);

    if (!isListingRoute || viewMode !== 'client' || selectedArtist) {
      return;
    }

    const nextSnapshot = buildHomeListingSnapshot();
    const currentState = (window.history.state || {}) as AppNavigationState;

    window.history.replaceState(
      {
        ...currentState,
        homeListingSnapshot: nextSnapshot,
      },
      '',
      currentRoute
    );

    persistHomeListingSnapshot(nextSnapshot);
  }, [
    currentRoute,
    marketplaceRouteContext,
    viewMode,
    selectedArtist,
    searchCriteria.query,
    searchCriteria.city,
    searchCriteria.category,
    searchCriteria.subcategory,
    searchCriteria.priceRange,
    sortBy,
    homeVisibleCount,
  ]);

  useEffect(() => {
    const isListingRoute = currentRoute === '/' || currentRoute === '/favoritos' || Boolean(marketplaceRouteContext);

    if (!isListingRoute || viewMode !== 'client' || selectedArtist) {
      return;
    }

    let ticking = false;

    const persistScrollSnapshot = () => {
      ticking = false;
      const nextSnapshot = buildHomeListingSnapshot();
      const currentState = (window.history.state || {}) as AppNavigationState;

      window.history.replaceState(
        {
          ...currentState,
          homeListingSnapshot: nextSnapshot,
        },
        '',
        currentRoute
      );

      persistHomeListingSnapshot(nextSnapshot);
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(persistScrollSnapshot);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentRoute, marketplaceRouteContext, viewMode, selectedArtist, searchCriteria, sortBy, homeVisibleCount]);

  useEffect(() => {
    const normalizedPath = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';

    if (normalizedPath.startsWith('/mi-negocio')) {
      setViewMode('business');
      setDashboardView('provider');

      if (normalizedPath === '/mi-negocio/create') {
        setProviderDashboardSection('dashboard');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/configuracion') {
        setProviderDashboardSection('settings');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/informacion') {
        // Legacy alias support
        setProviderDashboardSection('settings');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/mis-servicios') {
        setProviderDashboardSection('services');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/reservas') {
        setProviderDashboardSection('bookings');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/facturacion') {
        setProviderDashboardSection('billing');
        setNegotiationContractId(null);
      } else if (normalizedPath === '/mi-negocio/negociaciones') {
        setNegotiationContractId(null);
      } else if (normalizedPath.startsWith('/mi-negocio/negociacion/')) {
        const contractId = normalizedPath.slice('/mi-negocio/negociacion/'.length) || null;
        setNegotiationContractId(contractId);
      } else {
        setProviderDashboardSection('dashboard');
        setNegotiationContractId(null);
      }

      return;
    }

    if (normalizedPath === '/me/reservas') {
      setViewMode('business');
      setDashboardView('client');
      setClientDashboardSection('bookings');
      setNegotiationContractId(null);
    } else if (normalizedPath.startsWith('/me/negociacion/')) {
      const contractId = normalizedPath.slice('/me/negociacion/'.length) || null;
      setViewMode('business');
      setDashboardView('client');
      setNegotiationContractId(contractId);
    }
  }, [currentRoute]);

  useEffect(() => {
    const normalizedPath = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';

    if (!normalizedPath.startsWith('/mi-negocio')) {
      return;
    }

    if (!currentUser?.isProvider) {
      return;
    }

    if (!hasProviderPanelAccess && normalizedPath !== '/mi-negocio/create') {
      navigateTo('/mi-negocio/create');
    }
  }, [currentRoute, currentUser?.isProvider, hasProviderPanelAccess]);

  useEffect(() => {
    const normalizedPath = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';

    if (!normalizedPath.startsWith('/mi-negocio')) {
      setIsCheckingProviderProfile(false);
      return;
    }

    if (!currentUser?.isProvider) {
      setIsCheckingProviderProfile(false);
      return;
    }

    if (normalizedPath === '/mi-negocio/create') {
      setIsCheckingProviderProfile(false);
      return;
    }

    // When the provider profile is already loaded, avoid revalidating it on each
    // internal section change to prevent UI flicker between /mi-negocio routes.
    if (currentProvider?.userId === currentUser.id) {
      setIsCheckingProviderProfile(false);
      return;
    }

    let cancelled = false;

    const verifyProviderProfile = async () => {
      try {
        setIsCheckingProviderProfile(true);
        const provider = await supabase.getProviderByUserId(currentUser.id);

        if (cancelled) {
          return;
        }

        setCurrentProvider(provider || null);
        setProviderAccountCreated(Boolean(provider));

        if (!provider && normalizedPath !== '/mi-negocio/create') {
          navigateTo('/mi-negocio/create');
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentProvider(null);
          setProviderAccountCreated(false);

          if (normalizedPath !== '/mi-negocio/create') {
            navigateTo('/mi-negocio/create');
          }
        }
      } finally {
        if (!cancelled) {
          setIsCheckingProviderProfile(false);
        }
      }
    };

    void verifyProviderProfile();

    return () => {
      cancelled = true;
    };
  }, [currentRoute, currentUser?.id, currentUser?.isProvider, currentProvider?.id, currentProvider?.userId]);

  const resolveServiceByRoute = (path: string) => {
    const routeVisibleArtists = artists.filter((artist) => {
      if (currentUser?.role === 'admin' || artist.userId === currentUser?.id) {
        return true;
      }

      return isMarketplaceCityVisible(artist);
    });

    // Legacy route compatibility
    if (path.startsWith('/servicio/')) {
      const serviceId = path.replace('/servicio/', '');
      return routeVisibleArtists.find((a) => a.id === serviceId) || null;
    }

    const cleanPath = path.split('?')[0].replace(/\/+$/, '');
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length !== 2) {
      return null;
    }

    const [categorySlug, serviceSlug] = parts;
    const match = serviceSlug.match(/^(MEM-\d{7})-(.+)$/i);

    if (!match) {
      return null;
    }

    const [, memCode, titleSlug] = match;

    const exactMatch = routeVisibleArtists.find((artist) => {
      return (
        serviceCategorySlug(artist) === categorySlug &&
        serviceUserCode(artist).toLowerCase() === memCode.toLowerCase() &&
        serviceTitleSlug(artist) === titleSlug
      );
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Backward compatibility: older links may have stale/alternate category slugs.
    const codeAndTitleMatch = routeVisibleArtists.find((artist) => {
      return (
        serviceUserCode(artist).toLowerCase() === memCode.toLowerCase() &&
        serviceTitleSlug(artist) === titleSlug
      );
    });

    if (codeAndTitleMatch) {
      return codeAndTitleMatch;
    }

    // Last fallback for migrated links: keep title stable even if the code changed.
    return routeVisibleArtists.find((artist) => serviceTitleSlug(artist) === titleSlug) || null;
  };

  useEffect(() => {
    if (!resolveServiceByRoute(currentRoute) && selectedArtist) {
      setSelectedArtist(null);
    }
  }, [currentRoute, artists, selectedArtist]);

  useEffect(() => {
    const routeService = resolveServiceByRoute(currentRoute);

    if (routeService) {
      return;
    }

    const cleanPath = currentRoute.split('?')[0].replace(/\/+$/, '');

    if (cleanPath.startsWith('/servicio/')) {
      const serviceId = cleanPath.replace('/servicio/', '');

      if (!serviceId) {
        return;
      }

      let cancelled = false;

      const loadById = async () => {
        try {
          const detailedService = await supabase.getService(serviceId);

          if (cancelled || !detailedService) {
            return;
          }

          setArtists((prev) => mergeArtistsById(prev, [detailedService]));
          setMarketplaceArtists((prev) => mergeArtistsById(prev, [detailedService]));
        } catch (error) {
          console.error('Error hydrating legacy service route:', error);
        }
      };

      void loadById();

      return () => {
        cancelled = true;
      };
    }

    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length !== 2) {
      return;
    }

    const match = parts[1]?.match(/^(MEM-\d{7})-(.+)$/i);
    if (!match) {
      return;
    }

    const [, publicCode] = match;
    let cancelled = false;

    const loadByPublicCode = async () => {
      try {
        const services = await supabase.getServices({
          view: 'summary',
          publicCode,
          perPage: 1,
          publicOnly: true,
        });

        if (cancelled || services.length === 0) {
          return;
        }

        setArtists((prev) => mergeArtistsById(prev, services));
        setMarketplaceArtists((prev) => mergeArtistsById(prev, services));
      } catch (error) {
        console.error('Error hydrating SEO service route:', error);
      }
    };

    void loadByPublicCode();

    return () => {
      cancelled = true;
    };
  }, [currentRoute, artists]);

  useEffect(() => {
    const routeService = resolveServiceByRoute(currentRoute);

    if (!routeService || (routeService as any).detailLoaded) {
      return;
    }

    let cancelled = false;

    const loadServiceDetail = async () => {
      try {
        const detailedService = await supabase.getService(routeService.id);

        if (cancelled || !detailedService) {
          return;
        }

        setArtists((prev) => prev.map((artist) => (
          artist.id === detailedService.id ? { ...artist, ...detailedService } : artist
        )));
        setSelectedArtist((prev) => (
          prev?.id === detailedService.id ? { ...prev, ...detailedService } : prev
        ));
      } catch (error) {
        console.error('Error loading service detail:', error);
      }
    };

    void loadServiceDetail();

    return () => {
      cancelled = true;
    };
  }, [currentRoute, artists]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await supabase.deleteEvent(eventId);

      // Remove event from all contracts
      setContracts(prev => prev.map(contract =>
        contract.eventId === eventId
          ? { ...contract, eventId: undefined }
          : contract
      ));

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Evento eliminado');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error al eliminar evento');
    }
  };

  const handleRefreshNotifications = async () => {
    if (!currentUser || !notificationsEnabled) return;
    setNotificationsLoading(true);
    try {
      const data = await supabase.getNotifications({ limit: 8 });
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setNotifications(nextItems.filter((item: HeaderNotification) => !dismissedNotificationIdsRef.current.has(item.id)));
      setUnreadNotificationsCount(Number(data?.unreadCount || 0));
    } catch (error: any) {
      if (!String(error?.message || '').includes('disabled')) {
        toast.error('No se pudieron cargar las notificaciones');
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  const normalizeNotificationText = (...values: Array<string | undefined | null>) => {
    return values
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const resolveProviderSectionPath = (section: ProviderDashboardSection): string => {
    if (!providerAccountCreated) return '/mi-negocio/create';
    if (section === 'settings') return '/mi-negocio/configuracion';
    if (section === 'services') return '/mi-negocio/mis-servicios';
    if (section === 'bookings' || section === 'contracts') return '/mi-negocio/reservas';
    if (section === 'billing') return '/mi-negocio/facturacion';
    return '/mi-negocio';
  };

  const handleProviderSectionChange = (section: ProviderDashboardSection) => {
    setProviderDashboardSection(section);
    navigateTo(resolveProviderSectionPath(section));
  };

  type NotificationDestination = {
    path: string;
    viewMode?: ViewMode;
    dashboardView?: DashboardView;
    providerSection?: ProviderDashboardSection;
    providerFocusedBookingId?: string | null;
    clientSection?: ClientDashboardSection;
    clientFocusedContractId?: string | null;
  };

  const resolveNotificationDestination = (notification: HeaderNotification): NotificationDestination => {
    const notificationType = String(notification.type || '').toLowerCase();
    const entityType = String(notification.entity?.type || '').toLowerCase();
    const entityId = notification.entity?.id ? String(notification.entity.id) : null;
    const ctaUrl = typeof notification.ctaUrl === 'string' ? notification.ctaUrl.trim() : '';
    const normalizedText = normalizeNotificationText(notification.title, notification.body);
    const hasExplicitCta = !!ctaUrl && ctaUrl !== '/';

    if (hasExplicitCta) {
      return { path: ctaUrl };
    }

    const openProviderDashboard = (section: ProviderDashboardSection, bookingId: string | null = null): NotificationDestination => ({
      path: resolveProviderSectionPath(section),
      viewMode: 'business',
      dashboardView: 'provider',
      providerSection: section,
      providerFocusedBookingId: bookingId,
    });

    const openClientBookings = (contractId: string | null = null): NotificationDestination => ({
      path: '/me/reservas',
      viewMode: 'business',
      dashboardView: 'client',
      clientSection: 'bookings',
      clientFocusedContractId: contractId,
    });

    if (
      notificationType === 'provider_role_activated' ||
      entityType === 'provider' ||
      normalizedText.includes('mi negocio') ||
      normalizedText.includes('perfil de proveedor') ||
      normalizedText.includes('ahora eres proveedor')
    ) {
      return openProviderDashboard('dashboard');
    }

    if (notificationType === 'service_request_created') {
      return openProviderDashboard('bookings', entityId);
    }

    if (
      notificationType === 'billing_invoice_generated' ||
      notificationType === 'billing_payment_submitted' ||
      notificationType === 'billing_payment_rejected' ||
      normalizedText.includes('nueva factura mensual') ||
      normalizedText.includes('pago enviado para revision') ||
      normalizedText.includes('pago rechazado')
    ) {
      return openProviderDashboard('billing');
    }

    if (
      notificationType === 'contract_approved' ||
      notificationType === 'review_requested' ||
      entityType === 'contract' ||
      normalizedText.includes('reserva aprobada') ||
      normalizedText.includes('contrato fue aprobado')
    ) {
      return openClientBookings(entityId);
    }

    if (entityType === 'booking') {
      if (currentUser?.isProvider) {
        return openProviderDashboard('bookings', entityId);
      }

      return openClientBookings(null);
    }

    return { path: ctaUrl || '/' };
  };

  const applyNotificationNavigation = (notification: HeaderNotification) => {
    const destination = resolveNotificationDestination(notification);

    if (destination.viewMode) {
      setViewMode(destination.viewMode);
    }

    if (destination.dashboardView) {
      setDashboardView(destination.dashboardView);
    }

    if (destination.providerSection !== undefined) {
      setProviderDashboardSection(destination.providerSection);
    }

    if (destination.providerFocusedBookingId !== undefined) {
      setProviderFocusedBookingId(destination.providerFocusedBookingId);
    }

    if (destination.clientSection !== undefined) {
      setClientDashboardSection(destination.clientSection);
    }

    if (destination.clientFocusedContractId !== undefined) {
      setClientFocusedContractId(destination.clientFocusedContractId);
    }

    navigateTo(destination.path);
  };

  const handleMarkNotificationRead = async (notification: HeaderNotification) => {
    if (!notification || notification.isRead) {
      if (notification) {
        applyNotificationNavigation(notification);
      }
      return;
    }

    try {
      const data = await supabase.markNotificationRead(notification.id);
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? {
        ...item,
        isRead: true,
        readAt: data?.readAt || new Date().toISOString(),
      } : item));
      setUnreadNotificationsCount(Number(data?.unreadCount ?? Math.max(0, unreadNotificationsCount - 1)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      applyNotificationNavigation(notification);
    }
  };

  const handleDismissNotification = async (event: MouseEvent<HTMLButtonElement>, notification: HeaderNotification) => {
    event.preventDefault();
    event.stopPropagation();

    if (!notification) {
      return;
    }

    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotificationsCount;
    const optimisticUnreadCount = notification.isRead
      ? unreadNotificationsCount
      : Math.max(0, unreadNotificationsCount - 1);

    dismissedNotificationIdsRef.current.add(notification.id);
    if (currentUser?.id) {
      persistDismissedNotificationIds(currentUser.id, dismissedNotificationIdsRef.current);
    }
    setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    setUnreadNotificationsCount(optimisticUnreadCount);

    if (notification.isRead) {
      return;
    }

    try {
      const data = await supabase.markNotificationRead(notification.id);
      setUnreadNotificationsCount(Number(data?.unreadCount ?? optimisticUnreadCount));
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setUnreadNotificationsCount(previousUnreadCount);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const data = await supabase.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: data?.readAt || new Date().toISOString() })));
      setUnreadNotificationsCount(0);
      toast.success('Notificaciones marcadas como leidas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('No se pudieron marcar todas como leidas');
    }
  };

  const handleAssignContractToEvent = async (contractId: string, eventId: string | null) => {
    try {
      // Update contract with new eventId
      const contract = contracts.find(c => c.id === contractId);
      if (contract) {
        await handleContractUpdate({
          ...contract,
          eventId: eventId || undefined
        });
      }

      // Update event's contract list
      if (eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          const contractIds = new Set(event.contractIds);
          contractIds.add(contractId);
          await handleUpdateEvent(eventId, { contractIds: Array.from(contractIds) }, true);
        }

        // Remove from other events
        const otherEvents = events.filter(e => e.id !== eventId && e.contractIds.includes(contractId));
        for (const otherEvent of otherEvents) {
          await handleUpdateEvent(otherEvent.id, {
            contractIds: otherEvent.contractIds.filter(id => id !== contractId)
          }, true);
        }

        toast.success('Reserva asignada al evento');
      } else {
        // Remove from all events
        const eventsWithContract = events.filter(e => e.contractIds.includes(contractId));
        for (const event of eventsWithContract) {
          await handleUpdateEvent(event.id, {
            contractIds: event.contractIds.filter(id => id !== contractId)
          }, true);
        }
        toast.success('Reserva removida del evento');
      }
    } catch (error) {
      console.error('Error assigning contract to event:', error);
      toast.error('Error al asignar reserva al evento');
    }
  };

  const handleContractUpdate = async (updatedContract: Contract) => {
    try {
      // Update contract in Supabase
      const updated = await supabase.updateContract(updatedContract.id, updatedContract);

      // Update local state
      setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));

      // Update associated booking - search by bookingId OR contractId
      const associatedBooking = bookings.find(b =>
        b.id === updated.bookingId || b.contractId === updated.id
      );

      if (associatedBooking) {
        let newBookingStatus = associatedBooking.status;

        // Map contract status to booking status
        if (updated.status === 'cancelled') {
          newBookingStatus = 'cancelled';
        } else if (updated.status === 'active') {
          newBookingStatus = 'confirmed';
        }

        // Update booking if status changed
        if (newBookingStatus !== associatedBooking.status) {
          const updatedBooking = {
            ...associatedBooking,
            status: newBookingStatus
          };
          await handleBookingUpdate(updatedBooking);
        }
      }

      // Show appropriate message based on status
      if (updatedContract.status === 'cancelled') {
        toast.error('Contrato rechazado - La reserva ha sido cancelada');
      } else if (updatedContract.status === 'active') {
        toast.success('Contrato firmado y activado - Reserva confirmada');
      } else {
        toast.success('Contrato actualizado');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Error al actualizar contrato');
    }
  };

  // Admin functions
  const handleVerifyProvider = async (providerId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        const now = new Date().toISOString();
        setProviders(providers.map(p =>
          p.id === providerId
            ? {
                ...p,
                verified: true,
                verifiedAt: now,
                verifiedBy: currentUser?.id
              }
            : p
        ));

        // Update artist verified status for all services of this provider
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
          setArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, verified: true } : artist
          ));
          setMarketplaceArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, verified: true } : artist
          ));
        }

        toast.success('Proveedor verificado exitosamente');
        return;
      }

      const updatedProvider = await supabase.verifyProvider(providerId);
      setProviders(providers.map(p => p.id === providerId ? updatedProvider : p));

      // Update artist verified status for all services of this provider
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        setArtists((prev) => prev.map((artist) =>
          artist.userId === provider.userId ? { ...artist, verified: true } : artist
        ));
        setMarketplaceArtists((prev) => prev.map((artist) =>
          artist.userId === provider.userId ? { ...artist, verified: true } : artist
        ));
      }

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Proveedor verificado exitosamente');
    } catch (error) {
      console.error('Error verifying provider:', error);
      toast.error('Error al verificar proveedor');
      throw error;
    }
  };

  const handleBanProvider = async (providerId: string, reason: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        const now = new Date().toISOString();
        setProviders(providers.map(p =>
          p.id === providerId
            ? {
                ...p,
                banned: true,
                bannedAt: now,
                bannedReason: reason
              }
            : p
        ));

        // Hide all services of banned provider
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
          setArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, isArchived: true } : artist
          ));
          setMarketplaceArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, isArchived: true } : artist
          ));
        }

        toast.success('Proveedor baneado exitosamente');
        return;
      }

      const updatedProvider = await supabase.banProvider(providerId, reason);
      setProviders(providers.map(p => p.id === providerId ? updatedProvider : p));

      // Hide all services of banned provider
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        setArtists((prev) => prev.map((artist) =>
          artist.userId === provider.userId ? { ...artist, isArchived: true } : artist
        ));
        setMarketplaceArtists((prev) => prev.map((artist) =>
          artist.userId === provider.userId ? { ...artist, isArchived: true } : artist
        ));
      }

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Proveedor baneado exitosamente');
    } catch (error) {
      console.error('Error banning provider:', error);
      toast.error('Error al banear proveedor');
      throw error;
    }
  };

  const handleUnbanProvider = async (providerId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        setProviders(providers.map(p =>
          p.id === providerId
            ? {
                ...p,
                banned: false,
                bannedAt: undefined,
                bannedReason: undefined
              }
            : p
        ));

        // Show services of unbanned provider
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
          setArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, isArchived: false } : artist
          ));
          setMarketplaceArtists((prev) => prev.map((artist) =>
            artist.userId === provider.userId ? { ...artist, isArchived: false } : artist
          ));
        }

        toast.success('Proveedor desbaneado exitosamente');
        return;
      }

      const updatedProvider = await supabase.unbanProvider(providerId);
      setProviders(providers.map(p => p.id === providerId ? updatedProvider : p));

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Proveedor desbaneado exitosamente');
    } catch (error) {
      console.error('Error unbanning provider:', error);
      toast.error('Error al desbanear proveedor');
      throw error;
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        const now = new Date().toISOString();
        setAllUsers(allUsers.map(u =>
          u.id === userId
            ? {
                ...u,
                banned: true,
                bannedAt: now,
                bannedReason: reason
              }
            : u
        ));

        toast.success('Usuario baneado exitosamente');
        return;
      }

      await supabase.banUser(userId, reason);

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Usuario baneado exitosamente');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Error al banear usuario');
      throw error;
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        setAllUsers(allUsers.map(u =>
          u.id === userId
            ? {
                ...u,
                banned: false,
                bannedAt: undefined,
                bannedReason: undefined
              }
            : u
        ));

        toast.success('Usuario desbaneado exitosamente');
        return;
      }

      await supabase.unbanUser(userId);

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Usuario desbaneado exitosamente');
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Error al desbanear usuario');
      throw error;
    }
  };

  const handleArchiveUser = async (userId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        setAllUsers(allUsers.map(u =>
          u.id === userId
            ? {
                ...u,
                archived: true,
                archivedAt: new Date().toISOString()
              }
            : u
        ));

        toast.success('Usuario archivado exitosamente');
        return;
      }

      await supabase.archiveUser(userId);

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Usuario archivado exitosamente');
    } catch (error) {
      console.error('Error archiving user:', error);
      toast.error('Error al archivar usuario');
      throw error;
    }
  };

  const handleUnarchiveUser = async (userId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - update state directly
        setAllUsers(allUsers.map(u =>
          u.id === userId
            ? {
                ...u,
                archived: false,
                archivedAt: undefined
              }
            : u
        ));

        toast.success('Usuario restaurado exitosamente');
        return;
      }

      await supabase.unarchiveUser(userId);

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Usuario restaurado exitosamente');
    } catch (error) {
      console.error('Error unarchiving user:', error);
      toast.error('Error al restaurar usuario');
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (isDemoMode) {
        // Demo mode - remove user from state
        setAllUsers(allUsers.filter(u => u.id !== userId));
        toast.success('Usuario eliminado exitosamente');
        return;
      }

      await supabase.deleteUser(userId);

      // Reload users if admin
      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
      throw error;
    }
  };

  const handleApproveProviderAccess = async (userId: string) => {
    try {
      await supabase.approveProviderAccess(userId);

      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      toast.success('Acceso de proveedor aprobado');
    } catch (error) {
      console.error('Error approving provider access:', error);
      toast.error('Error al aprobar acceso de proveedor');
      throw error;
    }
  };

  const handleRevokeProviderAccess = async (userId: string) => {
    try {
      await supabase.revokeProviderAccess(userId);

      if (currentUser?.role === 'admin') {
        const usersData = await supabase.getAllUsers();
        if (usersData) setAllUsers(usersData);
      }

      const servicesData = await supabase.getServices({ view: 'summary' });
      if (servicesData) {
        setArtists((prev) => mergeArtistsById(prev, servicesData));
        setMarketplaceArtists((prev) => mergeArtistsById(prev, servicesData));
      }

      toast.success('Acceso de proveedor cancelado');
    } catch (error) {
      console.error('Error revoking provider access:', error);
      toast.error('Error al cancelar acceso de proveedor');
      throw error;
    }
  };

  const handleUpdateMarketplaceCities = async (enabledCities: string[]) => {
    try {
      const config = await supabase.updateMarketplaceConfig(enabledCities);
      const nextAllCities = Array.isArray(config?.allCities) && config.allCities.length > 0
        ? config.allCities
        : allMarketplaceCities;
      const nextEnabledCities = Array.isArray(config?.enabledCities)
        ? config.enabledCities
        : enabledCities;

      setAllMarketplaceCities(nextAllCities);
      setEnabledMarketplaceCities(nextEnabledCities);
      marketplaceCacheRef.current = {};
      setMarketplacePage(1);

      if (searchCriteria.city && !nextEnabledCities.includes(searchCriteria.city)) {
        setSearchCriteria((previous) => ({
          ...previous,
          city: '',
        }));
      }

      toast.success('Ciudades disponibles actualizadas');
    } catch (error) {
      console.error('Error updating marketplace cities:', error);
      toast.error('No se pudo actualizar la disponibilidad por ciudad');
      throw error;
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
  // Note: Don't require currentProvider to be loaded - the BusinessDashboard handles null provider
  // by showing the setup form. Services should still be available for contract matching.
  const providerServices = currentUser?.isProvider
    ? artists.filter(a => a.userId === currentUser.id)
    : [];

  // Debug logging
  if (currentUser && currentUser.isProvider) {
    console.log('Provider View - Current User ID:', currentUser.id);
    console.log('Provider View - All Artists count:', artists.length);
    console.log('Provider View - Filtered Provider Services:', providerServices.length, providerServices.map(s => ({ id: s.id, name: s.name, userId: s.userId })));
    console.log('Provider View - All Contracts count:', contracts.length);
    console.log('Provider View - All Bookings count:', bookings.length);
  }

  const isMarketplaceCityVisible = (artist: Artist) => {
    const serviceCity = (artist.location || '').trim();

    if (!serviceCity) {
      return true;
    }

    return enabledMarketplaceCities.includes(serviceCity);
  };

  // Public marketplace listing is now fetched remotely; keep only moderation guards locally.
  const filteredArtists = useMemo(() => {
    return marketplaceArtists.filter((artist) => {
      if (artist.isArchived || artist.isPublished === false) {
        return false;
      }

      if (!isMarketplaceCityVisible(artist)) {
        return false;
      }

      if (!artist.userId) {
        return true;
      }

      const user = allUsers.find((candidate) => candidate.id === artist.userId);
      if (user?.banned || user?.archived) {
        return false;
      }

      const provider = providers.find((candidate) => candidate.userId === artist.userId);
      if (provider?.banned) {
        return false;
      }

      return true;
    });
  }, [marketplaceArtists, allUsers, providers, enabledMarketplaceCities]);

  const isFavoritesRoute = currentRoute === '/favoritos';
  const isPrivateSystemRoute = currentRoute.startsWith('/mi-negocio') || currentRoute.startsWith('/me/');

  const marketplaceCanonical = marketplaceRouteContext
    ? marketplaceRouteContext.canonicalPath
    : (isFavoritesRoute ? '/favoritos' : '/');

  const marketplaceKeywords = marketplaceRouteContext
    ? [
        marketplaceRouteContext.taxonomy?.label,
        marketplaceRouteContext.city,
        'proveedores de eventos',
        'eventos en Venezuela'
      ].filter(Boolean).join(', ')
    : 'servicios eventos Venezuela, bodas, fiestas, DJ, catering, fotografia, decoracion';

  const marketplaceHeading = marketplaceRouteContext
    ? marketplaceRouteContext.taxonomy && marketplaceRouteContext.city
      ? `${marketplaceRouteContext.taxonomy.label} en ${marketplaceRouteContext.city}`
      : marketplaceRouteContext.city
        ? `Proveedores en ${marketplaceRouteContext.city}`
        : `Proveedores de ${marketplaceRouteContext.taxonomy?.label}`
    : (isFavoritesRoute ? 'Tus Favoritos' : 'Tu Evento Inolvidable Empieza Aquí');

  const visibleArtists = useMemo(() => {
    if (!isFavoritesRoute) {
      return filteredArtists;
    }

    return filteredArtists.filter((artist) => favoriteServiceIds.includes(artist.id));
  }, [filteredArtists, isFavoritesRoute, favoriteServiceIds]);

  const displayedArtists = useMemo(() => {
    return visibleArtists.slice(0, homeVisibleCount);
  }, [visibleArtists, homeVisibleCount]);

  useEffect(() => {
    setHomeVisibleCount(HOME_INITIAL_ITEMS);
  }, [
    searchCriteria.query,
    searchCriteria.city,
    searchCriteria.category,
    searchCriteria.subcategory,
    searchCriteria.priceRange[0],
    searchCriteria.priceRange[1],
    sortBy,
    isFavoritesRoute,
  ]);

  useEffect(() => {
    if (pendingHomeScrollRestoreRef.current === null) {
      return;
    }

    if (viewMode !== 'client' || selectedArtist) {
      return;
    }

    const nextScrollY = pendingHomeScrollRestoreRef.current;

    let timeoutId: number | null = null;
    let cancelled = false;

    const restoreScroll = () => {
      if (cancelled) {
        return;
      }

      const restoreSnapshot = pendingHomeListingRestoreRef.current;
      let targetScrollY = nextScrollY;

      if (restoreSnapshot?.anchorArtistId) {
        const anchorElement = document.querySelector<HTMLElement>(`[data-service-card-id="${restoreSnapshot.anchorArtistId}"]`);
        if (anchorElement) {
          const desiredViewportOffset = restoreSnapshot.anchorViewportOffset ?? 0;
          targetScrollY = Math.max(0, window.scrollY + anchorElement.getBoundingClientRect().top - desiredViewportOffset);
        }
      }

      window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      pendingHomeScrollRestoreAttemptsRef.current += 1;

      const isCloseEnough = Math.abs(window.scrollY - targetScrollY) <= 4;
      const reachedAttemptLimit = pendingHomeScrollRestoreAttemptsRef.current >= 8;

      if (isCloseEnough || reachedAttemptLimit) {
        pendingHomeScrollRestoreRef.current = null;
        pendingHomeScrollRestoreAttemptsRef.current = 0;
        pendingHomeListingRestoreRef.current = null;
        return;
      }

      timeoutId = window.setTimeout(() => {
        window.requestAnimationFrame(restoreScroll);
      }, 120);
    };

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restoreScroll);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [viewMode, selectedArtist, currentRoute, homeVisibleCount, displayedArtists.length]);

  useEffect(() => {
    const isRemoteMarketplaceRoute = viewMode === 'client'
      && !selectedArtist
      && currentRoute !== '/favoritos'
      && (currentRoute === '/' || Boolean(marketplaceRouteContext));

    if (!isRemoteMarketplaceRoute || marketplaceLoading || !marketplaceHasMore) {
      return;
    }

    if (homeVisibleCount <= filteredArtists.length) {
      return;
    }

    setMarketplacePage((previous) => previous + 1);
  }, [
    viewMode,
    selectedArtist,
    currentRoute,
    marketplaceRouteContext,
    marketplaceLoading,
    marketplaceHasMore,
    homeVisibleCount,
    filteredArtists.length,
  ]);

  useEffect(() => {
    if (viewMode !== 'client' || selectedArtist || !loadMoreSentinelRef.current) {
      return;
    }

    if (homeVisibleCount >= visibleArtists.length && !(currentRoute !== '/favoritos' && marketplaceHasMore)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting) {
          return;
        }

        setHomeVisibleCount((prev) => {
          const nextTarget = prev + HOME_LOAD_STEP;

          if (currentRoute !== '/favoritos' && marketplaceHasMore) {
            return nextTarget;
          }

          return Math.min(nextTarget, visibleArtists.length);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px 320px 0px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [viewMode, selectedArtist, visibleArtists.length, homeVisibleCount, currentRoute, marketplaceHasMore]);

  // Show loading screen while checking authentication
  if (supabase.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4 animate-pulse">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '80px', height: '80px' }}>
              {/* Gradiente de fondo */}
              <defs>
                <linearGradient id="loadingLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--copper)', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Fondo con bordes redondeados */}
              <rect x="0" y="0" width="100" height="100" rx="16" fill="url(#loadingLogoGradient)" />

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
          <h2>Memorialo</h2>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Check if we're on a legal page
  if (currentRoute === '/terminos-condiciones') {
    return <TermsConditions onBack={() => navigateTo('/')} />;
  }
  if (currentRoute === '/politicas-privacidad') {
    return <PrivacyPolicy onBack={() => navigateTo('/')} />;
  }
  if (currentRoute === '/politica-cancelacion') {
    return <CancellationPolicy onBack={() => navigateTo('/')} />;
  }
  if (currentRoute === '/politica-reembolso') {
    return <RefundPolicy onBack={() => navigateTo('/')} />;
  }
  if (currentRoute === '/codigo-conducta') {
    return <CodeOfConduct onBack={() => navigateTo('/')} />;
  }
  if (currentRoute === '/nosotros') {
    return (
      <AboutPage
        onClose={() => navigateTo('/')}
        onGetStarted={() => {
          navigateTo('/');
          if (!currentUser) {
            setShowAuthDialog(true);
          }
        }}
      />
    );
  }
  if (currentRoute === '/como-funciona') {
    return (
      <HowItWorksPage
        onClose={() => navigateTo('/')}
        onGetStarted={() => {
          navigateTo('/');
          if (!currentUser) {
            setShowAuthDialog(true);
          }
        }}
      />
    );
  }
  if (currentRoute === '/proveedores') {
    return (
      <ForProvidersPage
        onClose={() => navigateTo('/')}
        onGetStarted={() => {
          navigateTo('/');
          if (!currentUser) {
            setShowAuthDialog(true);
          } else if (!currentUser.isProvider) {
            toast.info('Completa tu perfil de proveedor para comenzar');
          }
        }}
      />
    );
  }
  if (currentRoute === '/clientes') {
    return (
      <ForClientsPage
        onClose={() => navigateTo('/')}
        onGetStarted={() => {
          navigateTo('/');
          setViewMode('client');
        }}
      />
    );
  }
  if (currentRoute === '/reserva-confirmada') {
    const confirmationDetails = bookingConfirmationData || {
      artistName: 'Tu proveedor',
      serviceName: 'Reserva confirmada',
      date: '',
      time: '',
      location: 'Por confirmar',
      duration: 'Por confirmar',
      totalPrice: 0,
    };

    return (
      <>
        <Toaster />
        <BookingConfirmation
          bookingDetails={confirmationDetails}
          onViewBookings={() => {
            window.location.assign('/me/reservas');
          }}
          onReturnHome={() => {
            window.location.assign('/');
          }}
          onDownloadContract={handleDownloadConfirmedContract}
          onContactProvider={handleContactConfirmedProvider}
          canDownloadContract={Boolean(bookingConfirmationData?.contract)}
          canContactProvider={Boolean(bookingConfirmationData?.bookingId)}
        />

        <ChatWidget
          user={currentUser}
          bookings={bookings}
          api={{
            getChatConversations: supabase.getChatConversations,
            ensureChatConversation: supabase.ensureChatConversation,
            getChatMessages: supabase.getChatMessages,
            sendChatMessage: supabase.sendChatMessage,
            markChatConversationRead: supabase.markChatConversationRead,
            requestChatIntervention: supabase.requestChatIntervention,
            subscribeChatStream: supabase.subscribeChatStream,
            subscribeChatConversationSignals: supabase.subscribeChatConversationSignals,
          }}
        />
      </>
    );
  }

  // Service detail page route (SEO + legacy)
  const serviceArtist = resolveServiceByRoute(currentRoute);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {!showAbout && !showHowItWorks && !showForProviders && !showForClients && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: 'var(--navy-blue)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleHeaderHomeRefresh}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 hover:opacity-90 transition-opacity shrink-0"
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
              <div className="hidden md:block text-left">
                <h1 className="text-sm font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>Memorialo</h1>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>El inicio de lo inolvidable</p>
              </div>
            </button>

            {/* Header Search Bar */}
            <div className="flex-1 max-w-2xl mx-2">
              {/* Desktop Search */}
              <div className="hidden md:block relative">
                <input
                  type="text"
                  placeholder="Buscar proveedores de servicio..."
                  className="w-full h-10 px-4 pr-12 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 bg-white"
                  style={{ borderRadius: '2px' }}
                  value={headerSearchInput}
                  onChange={(e) => setHeaderSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHeaderSearchSubmit();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleHeaderSearchSubmit}
                  className="absolute right-0 top-0 h-10 w-12 flex items-center justify-center border-l border-gray-300 bg-white hover:bg-gray-50"
                  aria-label="Buscar"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="md:hidden relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Estoy buscando..."
                  className="w-full h-9 pl-10 pr-4 rounded-sm text-sm focus:outline-none text-gray-900 placeholder:text-gray-400 bg-white"
                  style={{ borderRadius: '4px' }}
                  value={headerSearchInput}
                  onChange={(e) => setHeaderSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHeaderSearchSubmit();
                    }
                  }}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                onClick={() => setShowAbout(true)}
                className="hidden text-white hover:text-white hover:bg-white/10"
              >
                Sobre Nosotros
              </Button>
              <Button
                variant={viewMode === 'client' ? 'secondary' : 'ghost'}
                onClick={handleHeaderHomeRefresh}
                className={viewMode === 'client' ? '' : 'text-white hover:text-white hover:bg-white/10'}
              >
                <Users className="w-4 h-4 mr-2" />
                Buscar Servicios
              </Button>
              {currentUser?.isProvider && (
                <>
                  <Button
                    variant={viewMode === 'business' && dashboardView === 'provider' ? 'secondary' : 'ghost'}
                    onClick={() => {
                      setViewMode('business');
                      setDashboardView('provider');
                      navigateTo(getProviderBusinessPath());
                    }}
                    className={viewMode === 'business' && dashboardView === 'provider' ? '' : 'text-white hover:text-white hover:bg-white/10'}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Mi Negocio
                  </Button>
                </>
              )}

              {/* Admin Panel Button */}
              {currentUser?.role === 'admin' && (
                <Button
                  variant={viewMode === 'admin' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('admin')}
                  className={viewMode === 'admin' ? '' : 'text-white hover:text-white hover:bg-white/10'}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}

              {/* User Menu */}
              {currentUser ? (
                <>
                  {notificationsEnabled && (
                    <DropdownMenu onOpenChange={(open) => {
                      if (open) {
                        handleRefreshNotifications();
                      }
                    }}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative h-10 w-10 rounded-full p-0 hover:bg-white/10 text-white"
                          aria-label="Abrir notificaciones"
                        >
                          <Bell className="h-5 w-5" />
                          {unreadNotificationsCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] leading-[18px] font-semibold text-white text-center">
                              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <div className="px-2 py-1.5 flex items-center justify-between">
                          <p className="text-sm font-semibold">Notificaciones</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllNotificationsRead}
                            disabled={unreadNotificationsCount === 0}
                            className="h-7 px-2"
                          >
                            <CheckCheck className="w-3.5 h-3.5 mr-1" />
                            Leer todo
                          </Button>
                        </div>
                        <DropdownMenuSeparator />
                        {notificationsLoading ? (
                          <div className="px-3 py-4 text-sm text-muted-foreground">Cargando notificaciones...</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-muted-foreground">No tienes notificaciones por ahora.</div>
                        ) : (
                          notifications.map((notification) => (
                            <DropdownMenuItem
                              key={notification.id}
                              onClick={() => handleMarkNotificationRead(notification)}
                              className="items-start rounded-md bg-white py-2.5 cursor-pointer text-foreground focus:bg-zinc-100 data-[highlighted]:bg-zinc-100 hover:bg-zinc-100"
                            >
                              <div className="w-full">
                                <div className="flex items-start gap-2">
                                  {!notification.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm ${notification.isRead ? 'font-normal' : 'font-semibold'}`}>
                                      {notification.title || 'Notificacion'}
                                    </p>
                                    {notification.body && (
                                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => void handleDismissNotification(event, notification)}
                                    className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Marcar como leida"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full p-0 hover:bg-white/10"
                        aria-label="Abrir menú de usuario"
                      >
                        <Avatar className="h-9 w-9 border border-white/25">
                          <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} className="object-cover" />
                          <AvatarFallback className="text-xs font-semibold bg-white/20 text-white">
                            {currentUser.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {/* User info */}
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                      </div>

                      {/* ── Cliente ────────────────────────────────── */}
                      <div className="px-3 pt-2 pb-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cliente</p>
                      </div>
                      <DropdownMenuItem onClick={() => setShowUserProfile(true)}>
                        <UserCircle className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setViewMode('business');
                        setDashboardView('client');
                        navigateTo('/me/reservas');
                      }}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Mis Reservas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setViewMode('client');
                        navigateTo('/favoritos');
                      }}>
                        <Heart className="w-4 h-4 mr-2" />
                        Favoritos
                      </DropdownMenuItem>

                      {/* ── Mi Negocio (providers only) ─────────────── */}
                      {currentUser.isProvider && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-3 pt-2 pb-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mi Negocio</p>
                          </div>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio');
                          }}>
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Resumen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio/reservas');
                          }}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Reservas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio/negociaciones');
                          }}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Negociaciones
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio/mis-servicios');
                          }}>
                            <Briefcase className="w-4 h-4 mr-2" />
                            Servicios
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio/facturacion');
                          }}>
                            <Receipt className="w-4 h-4 mr-2" />
                            Facturación
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setViewMode('business');
                            setDashboardView('provider');
                            navigateTo('/mi-negocio/configuracion');
                          }}>
                            <Settings className="w-4 h-4 mr-2" />
                            Configuración
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* ── Admin ──────────────────────────────────── */}
                      {currentUser.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewMode('admin')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Panel de Admin
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
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
              className="md:hidden text-white hover:text-white hover:bg-white/10 shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-white/20 space-y-1">
              {/* Search Servicios */}
              <Button
                variant={viewMode === 'client' ? 'secondary' : 'ghost'}
                onClick={() => { handleHeaderHomeRefresh(); setMobileMenuOpen(false); }}
                className={`w-full justify-start ${viewMode === 'client' ? '' : 'text-white hover:text-white hover:bg-white/10'}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Buscar Servicios
              </Button>

              {currentUser ? (
                <>
                  {/* ── Cliente section ────────────────────── */}
                  <p className="px-3 pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">Cliente</p>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowUserProfile(true); setMobileMenuOpen(false); }}
                    className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setViewMode('business'); setDashboardView('client'); navigateTo('/me/reservas'); setMobileMenuOpen(false); }}
                    className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Mis Reservas
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setViewMode('client'); navigateTo('/favoritos'); setMobileMenuOpen(false); }}
                    className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Favoritos
                  </Button>

                  {/* ── Mi Negocio section (providers only) ─── */}
                  {currentUser.isProvider && (
                    <>
                      <p className="px-3 pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">Mi Negocio</p>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Resumen
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio/reservas'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Reservas
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio/negociaciones'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Negociaciones
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio/mis-servicios'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Servicios
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio/facturacion'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Facturación
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setViewMode('business'); setDashboardView('provider'); navigateTo('/mi-negocio/configuracion'); setMobileMenuOpen(false); }}
                        className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Button>
                    </>
                  )}

                  {/* ── Admin ──────────────────────────────── */}
                  {currentUser.role === 'admin' && (
                    <Button
                      variant={viewMode === 'admin' ? 'secondary' : 'ghost'}
                      onClick={() => { setViewMode('admin'); setMobileMenuOpen(false); }}
                      className={`w-full justify-start ${viewMode === 'admin' ? '' : 'text-white hover:text-white hover:bg-white/10'}`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Panel de Admin
                    </Button>
                  )}

                  <div className="border-t border-white/20 pt-2 mt-2">
                    <Button
                      variant="ghost"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full justify-start text-white hover:text-white hover:bg-white/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
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
      <main className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-4">
        {viewMode === 'admin' ? (
          currentUser && currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              accessToken={supabase.accessToken}
              providers={providers}
              users={allUsers}
              artists={artists}
              contracts={contracts}
              bookings={bookings}
              reviews={reviews}
              onVerifyProvider={handleVerifyProvider}
              onBanProvider={handleBanProvider}
              onUnbanProvider={handleUnbanProvider}
              onBanUser={handleBanUser}
              onUnbanUser={handleUnbanUser}
              onArchiveUser={handleArchiveUser}
              onUnarchiveUser={handleUnarchiveUser}
              onDeleteUser={handleDeleteUser}
              onApproveProviderAccess={handleApproveProviderAccess}
              onRevokeProviderAccess={handleRevokeProviderAccess}
              allCities={allMarketplaceCities}
              enabledCities={enabledMarketplaceCities}
              onUpdateEnabledCities={handleUpdateMarketplaceCities}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
            </div>
          )
        ) : viewMode === 'business' ? (
          <>
            <SEOHead noindex={isPrivateSystemRoute} />
            {currentUser && currentUser.isProvider && (
              currentRoute.startsWith('/mi-negocio/negociacion') || currentRoute === '/mi-negocio/negociaciones'
            ) ? (
              <ProviderNegotiationPage
                contracts={contracts}
                bookings={bookings}
                activeContractId={(() => {
                  const normalized = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';
                  return normalized.startsWith('/mi-negocio/negociacion/')
                    ? normalized.slice('/mi-negocio/negociacion/'.length) || null
                    : null;
                })()}
                user={currentUser}
                onNavigateToContract={(contractId: string) => {
                  if (!contractId) {
                    navigateTo('/mi-negocio/negociaciones');
                  } else {
                    navigateTo(`/mi-negocio/negociacion/${contractId}`);
                  }
                }}
                onBack={() => navigateTo('/mi-negocio/reservas')}
                chatApi={supabase as any}
              />
            ) : currentUser && currentRoute.startsWith('/me/negociacion/') ? (
              (() => {
                const normalized = (currentRoute.split('?')[0] || '/').replace(/\/+$/, '') || '/';
                const cId = normalized.startsWith('/me/negociacion/')
                  ? normalized.slice('/me/negociacion/'.length) || null
                  : null;
                const contract = cId ? contracts.find((c: any) => c.id === cId) || null : null;
                const booking = contract?.bookingId
                  ? bookings.find((b: any) => String(b.id) === String(contract.bookingId)) || null
                  : null;
                return (
                  <NegotiationPage
                    contract={contract}
                    booking={booking}
                    user={currentUser}
                    onBack={() => navigateTo('/me/reservas')}
                    chatApi={supabase as any}
                  />
                );
              })()
            ) : currentUser && currentUser.isProvider && dashboardView === 'provider' ? (
              isCheckingProviderProfile && !currentProvider ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Validando perfil de proveedor...</p>
                </div>
              ) : (
              <BusinessDashboard
                user={currentUser}
                provider={hasProviderPanelAccess ? currentProvider : null}
                services={providerServices}
                allArtists={artists}
                contracts={contracts}
                bookings={bookings}
                initialSection={providerDashboardSection}
                focusBookingId={providerFocusedBookingId}
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
                      const servicesData = await supabase.getServices({ view: 'summary' });
                      if (servicesData && servicesData.length > 0) {
                        setArtists((prev) => mergeArtistsById(prev, servicesData));
                        setMarketplaceArtists((prev) => mergeArtistsById(prev, servicesData));
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
                onProviderUpdate={handleProviderUpdate}
                onSectionChange={handleProviderSectionChange}
                onOpenNegotiation={(contractId: string) => {
                  navigateTo(`/mi-negocio/negociacion/${contractId}`);
                }}
                reviews={reviews}
                accessToken={supabase.accessToken}
              />
              )
            ) : (
              currentUser && (
                <ClientDashboard
                  contracts={contracts}
                  user={currentUser}
                  initialSection={clientDashboardSection}
                  focusBookingId={clientFocusedBookingId}
                  onFocusBookingHandled={() => setClientFocusedBookingId(null)}
                  focusContractId={clientFocusedContractId}
                  onFocusContractHandled={() => setClientFocusedContractId(null)}
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
                  onContractUpdate={handleContractUpdate}
                  bookings={bookings}
                  onBookingUpdate={handleBookingUpdate}
                  onOpenNegotiation={(contractId: string) => {
                    navigateTo(`/me/negociacion/${contractId}`);
                  }}
                />
              )
            )}
          </>
        ) : viewMode === 'client' ? (
          <>
            {/* SEO for marketplace home */}
            {!serviceArtist && (
              <SEOHead
                canonical={marketplaceCanonical}
                keywords={marketplaceKeywords}
                noindex={visibleArtists.length === 0}
                structuredData={buildMarketplaceStructuredData(visibleArtists)}
              />
            )}
            {/* Search & Filters */}
            <div className="mb-5 md:mb-8">
              <div className="mb-4 text-center hidden md:block">
                <h2 className="mb-2 font-[Carattere] text-[24px]">
                  {marketplaceHeading}
                </h2>
              </div>

              <AirbnbSearchBar
                onSearch={handleSearchCriteriaChange}
                searchCriteria={searchCriteria}
                availableCities={enabledMarketplaceCities}
              />
            </div>

            {/* Results & Sort */}
            <div className="mb-3 md:mb-4 flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-2 md:gap-3">
              <p className="text-gray-600 text-xs md:text-base leading-tight">
                Mostrando {displayedArtists.length} de {(isFavoritesRoute ? visibleArtists.length : Math.max(marketplaceTotal, visibleArtists.length))} servicio{(isFavoritesRoute ? visibleArtists.length : Math.max(marketplaceTotal, visibleArtists.length)) !== 1 ? 's' : ''} encontrado{(isFavoritesRoute ? visibleArtists.length : Math.max(marketplaceTotal, visibleArtists.length)) !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  <option value="rating">Mejor Calificación</option>
                  <option value="price-low">Menor Precio</option>
                  <option value="price-high">Mayor Precio</option>
                  <option value="reviews">Más Reseñas</option>
                </select>
              </div>
            </div>

            {isFavoritesRoute && !currentUser && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
                Debes iniciar sesión para ver tus favoritos.
              </div>
            )}

            {/* Artist Grid */}
            {visibleArtists.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-2 md:gap-y-3">
                  {displayedArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
                {(displayedArtists.length < visibleArtists.length || (!isFavoritesRoute && marketplaceHasMore)) && (
                  <div ref={loadMoreSentinelRef} className="h-14 flex items-center justify-center text-sm text-gray-500">
                    {marketplaceLoading ? 'Cargando mas servicios...' : 'Desplazate para cargar mas servicios'}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {isFavoritesRoute
                    ? 'No tienes servicios favoritos que coincidan con tus criterios'
                    : 'No se encontraron proveedores que coincidan con tus criterios'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    handleSearchCriteriaChange({
                      query: '',
                      city: '',
                      category: '',
                      subcategory: '',
                      priceRange: [0, 5000]
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
                    const servicesData = await supabase.getServices({ view: 'summary' });
                    if (servicesData && servicesData.length > 0) {
                      setArtists((prev) => mergeArtistsById(prev, servicesData));
                      setMarketplaceArtists((prev) => mergeArtistsById(prev, servicesData));
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
                initialSection={clientDashboardSection}
                focusBookingId={clientFocusedBookingId}
                onFocusBookingHandled={() => setClientFocusedBookingId(null)}
                focusContractId={clientFocusedContractId}
                onFocusContractHandled={() => setClientFocusedContractId(null)}
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
                events={events}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onAssignContractToEvent={handleAssignContractToEvent}
                onContractUpdate={handleContractUpdate}
                bookings={bookings}
                onBookingUpdate={handleBookingUpdate}
              />
            )
          )
        )}
      </main>

          {/* Footer */}
          <Footer
            onAboutClick={() => navigateTo('/nosotros')}
            onHowItWorksClick={() => navigateTo('/como-funciona')}
            onForProvidersClick={() => navigateTo('/proveedores')}
            onForClientsClick={() => navigateTo('/clientes')}
            onTermsClick={() => navigateTo('/terminos-condiciones')}
            onPrivacyClick={() => navigateTo('/politicas-privacidad')}
            onCancellationClick={() => navigateTo('/politica-cancelacion')}
            onRefundClick={() => navigateTo('/politica-reembolso')}
            onConductClick={() => navigateTo('/codigo-conducta')}
            onNavigate={navigateTo}
          />
        </>
      )}

      {/* Dialogs */}
      <ChatWidget
        user={currentUser}
        bookings={bookings}
        hideLauncher={currentRoute.startsWith('/mi-negocio/negociacion') || currentRoute === '/mi-negocio/negociaciones'}
        api={{
          getChatConversations: supabase.getChatConversations,
          ensureChatConversation: supabase.ensureChatConversation,
          getChatMessages: supabase.getChatMessages,
          sendChatMessage: supabase.sendChatMessage,
          markChatConversationRead: supabase.markChatConversationRead,
          requestChatIntervention: supabase.requestChatIntervention,
          subscribeChatStream: supabase.subscribeChatStream,
          subscribeChatConversationSignals: supabase.subscribeChatConversationSignals,
        }}
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
        onBookingConfirmed={handleBookingConfirmed}
        user={currentUser}
        onLoginRequired={() => setShowAuthDialog(true)}
        onSaveContactDetails={async (updates) => {
          if (!currentUser) {
            return;
          }

          await supabase.updateUser(currentUser.id, updates);
        }}
        events={events}
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
        onSignInWithGoogle={handleSignInWithGoogle}
      />

      {currentUser && (
        <UserProfile
          user={currentUser}
          open={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          bookings={userBookings}
          contracts={userContracts}
          reviews={userReviews}
          onBecomeProvider={handleBecomeProvider}
          onUserUpdate={async (updates) => {
            try {
              const payload = { ...updates };

              if (typeof payload.avatar === 'string' && payload.avatar.startsWith('data:image/')) {
                const blob = await fetch(payload.avatar).then((response) => response.blob());
                const extension = blob.type.split('/')[1] || 'png';
                const avatarFile = new File([blob], `avatar-${currentUser.id}.${extension}`, { type: blob.type || 'image/png' });
                payload.avatar = await supabase.uploadImage(avatarFile, 'avatar-images');
              }

              await supabase.updateUser(currentUser.id, payload);
            } catch (error) {
              console.error('Error updating user profile:', error);
              throw error;
            }
          }}
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

      {/* About Page */}
      {showAbout && (
        <AboutPage
          onClose={() => setShowAbout(false)}
          onGetStarted={() => {
            setShowAbout(false);
            if (!currentUser) {
              setShowAuthDialog(true);
            }
          }}
        />
      )}

      {/* For Providers Page */}
      {showForProviders && (
        <ForProvidersPage
          onClose={() => setShowForProviders(false)}
          onGetStarted={() => {
            setShowForProviders(false);
            if (!currentUser) {
              setShowAuthDialog(true);
            } else if (!currentUser.isProvider) {
              toast.info('Completa tu perfil de proveedor para comenzar');
            }
          }}
        />
      )}

      {/* For Clients Page */}
      {showForClients && (
        <ForClientsPage
          onClose={() => setShowForClients(false)}
          onGetStarted={() => {
            setShowForClients(false);
            setViewMode('client');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* How It Works Page */}
      {showHowItWorks && (
        <HowItWorksPage
          onClose={() => setShowHowItWorks(false)}
          onGetStarted={() => {
            setShowHowItWorks(false);
            if (!currentUser) {
              setShowAuthDialog(true);
            } else {
              setViewMode('client');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {serviceArtist && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-background">
          <ServiceDetailPage
            artist={serviceArtist}
            reviews={reviews}
            isAuthenticated={!!currentUser}
            isFavorite={favoriteServiceIds.includes(serviceArtist.id)}
            onToggleFavorite={() => handleToggleFavorite(serviceArtist)}
            onBack={() => {
              const historyState = (window.history.state || {}) as AppNavigationState;
              if (historyState.fromMarketplace) {
                window.history.back();
                return;
              }

              const snapshot = getLatestHomeListingSnapshot(
                getHomeListingSnapshotFromHistoryState(historyState),
                loadHomeListingSnapshot()
              );
              if (snapshot) {
                restoreHomeListingSnapshot(snapshot);
                return;
              }

              setSelectedArtist(null);
              navigateTo('/');
              setViewMode('client');
            }}
            onBookNow={handleBookNow}
          />
        </div>
      )}
    </div>
  );
}
