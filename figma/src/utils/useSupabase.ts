import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient, apiRequest, backendMode, laravelApiBaseUrl } from './supabase/client';
import { ChatConversation, ChatMessage, ChatStreamPayload, User } from '../types';

const LARAVEL_ACCESS_TOKEN_KEY = 'laravel_access_token';
const LARAVEL_AUTH_ERROR_KEY = 'laravel_auth_error';

type ListQueryOptions = Record<string, string | number | boolean | null | undefined>;

type ServiceQueryOptions = {
  view?: 'summary' | 'detail';
  page?: number;
  perPage?: number;
  userId?: string;
  providerId?: string;
  isActive?: boolean;
  query?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  ids?: string[];
  publicCode?: string;
};

function buildQueryString(options?: ListQueryOptions): string {
  const params = new URLSearchParams();

  Object.entries(options || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();

  return query ? `?${query}` : '';
}

function extractCollection<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function buildServiceQuery(options?: ServiceQueryOptions): string {
  return buildQueryString({
    view: options?.view,
    page: options?.page,
    per_page: options?.perPage,
    user_id: options?.userId,
    provider_id: options?.providerId,
    is_active: options?.isActive,
    q: options?.query,
    city: options?.city,
    category: options?.category,
    subcategory: options?.subcategory,
    min_price: options?.minPrice,
    max_price: options?.maxPrice,
    sort: options?.sort,
    ids: options?.ids?.join(','),
    public_code: options?.publicCode,
  });
}

function consumeLaravelAuthRedirectParams() {
  if (backendMode !== 'laravel') {
    return { token: null as string | null, error: null as string | null };
  }

  const url = new URL(window.location.href);
  const token = url.searchParams.get('auth_token');
  const error = url.searchParams.get('auth_error');

  if (!token && !error) {
    return { token: null as string | null, error: null as string | null };
  }

  if (token) {
    window.localStorage.setItem(LARAVEL_ACCESS_TOKEN_KEY, token);
  }

  if (error) {
    window.sessionStorage.setItem(LARAVEL_AUTH_ERROR_KEY, error);
  }

  url.searchParams.delete('auth_token');
  url.searchParams.delete('auth_error');
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', cleanUrl || '/');

  return { token, error };
}

export function useSupabase() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Flag to suppress onAuthStateChange while checkSession is running
  const isCheckingSession = { current: false };
  // Retry timer ref for BACKEND_UNAVAILABLE recovery
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: build a minimal fallback user from Supabase session metadata
  function buildFallbackUser(sessionUser: any): User {
    const meta = sessionUser.user_metadata || {};
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      name: meta.name || meta.full_name || sessionUser.email?.split('@')[0] || 'Usuario',
      phone: meta.phone || '',
      createdAt: sessionUser.created_at || new Date().toISOString(),
      isProvider: meta.isProvider || false,
      role: 'user',
    } as User;
  }

  // Helper: try loading user data from backend with retries
  async function loadUserWithRetry(
    userId: string,
    token: string,
    sessionUser: any,
    { maxRetries = 3, baseDelay = 2000 } = {}
  ): Promise<User | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const userData = await apiRequest(`/users/${userId}`, 'GET');
        return userData;
      } catch (err: any) {
        // If user not found, try auto-provision (OAuth first login)
        if (err?.message?.includes('User not found') || err?.message?.includes('404')) {
          try {
            console.log(`User not found in KV (attempt ${attempt}), auto-provisioning...`);
            const newUser = await apiRequest('/auth/ensure-user', 'POST', {}, token);
            console.log('OAuth user auto-provisioned:', newUser.email);
            return newUser;
          } catch (provisionErr: any) {
            if (provisionErr?.message === 'BACKEND_UNAVAILABLE' && attempt < maxRetries) {
              console.log(`Provision failed (BACKEND_UNAVAILABLE), retry ${attempt + 1}/${maxRetries}...`);
              await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
              continue;
            }
            console.error('Failed to auto-provision user:', provisionErr);
            return null;
          }
        }
        // If banned/archived, throw immediately
        if (err?.message?.includes('banned') || err?.message?.includes('archived')) {
          throw err;
        }
        // If backend unavailable, retry
        if (err?.message === 'BACKEND_UNAVAILABLE' && attempt < maxRetries) {
          console.log(`Backend unavailable, retry ${attempt + 1}/${maxRetries} in ${baseDelay * Math.pow(2, attempt)}ms...`);
          await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
          continue;
        }
        // Last attempt or non-retryable error
        throw err;
      }
    }
    return null;
  }

  // Schedule a background retry to replace fallback user with real data
  function scheduleBackgroundRetry(userId: string, token: string, sessionUser: any) {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    
    let retryCount = 0;
    const maxBackgroundRetries = 5;
    
    const tryLoad = async () => {
      retryCount++;
      console.log(`Background retry ${retryCount}/${maxBackgroundRetries} to load user data...`);
      try {
        const userData = await loadUserWithRetry(userId, token, sessionUser, { maxRetries: 0 });
        if (userData) {
          console.log('Background retry succeeded, user loaded:', userData.email);
          setCurrentUser(userData);
          return; // Done
        }
      } catch (err: any) {
        console.log(`Background retry ${retryCount} failed:`, err?.message);
      }
      
      // Schedule next retry with exponential backoff
      if (retryCount < maxBackgroundRetries) {
        const delay = 5000 * Math.pow(1.5, retryCount);
        console.log(`Next background retry in ${Math.round(delay / 1000)}s`);
        retryTimerRef.current = setTimeout(tryLoad, delay);
      } else {
        console.log('Background retries exhausted, user will need to reload page');
      }
    };
    
    retryTimerRef.current = setTimeout(tryLoad, 3000);
  }

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    checkSession();

    if (backendMode === 'laravel') {
      return () => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      };
    }
    
    // Listen for auth state changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      // Skip if checkSession is still running – it will handle the session itself
      if (isCheckingSession.current) {
        console.log('Skipping onAuthStateChange – checkSession in progress');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          console.log('Session updated, refreshing user data');
          setAccessToken(session.access_token);
          try {
            const userData = await loadUserWithRetry(
              session.user.id,
              session.access_token,
              session.user,
              { maxRetries: 2, baseDelay: 1500 }
            );
            if (userData) {
              setCurrentUser(userData);
            } else {
              // Fallback: build user from session metadata so UI isn't empty
              console.log('Using fallback user from session metadata');
              const fallback = buildFallbackUser(session.user);
              setCurrentUser(fallback);
              // Schedule background retries to replace with real data
              scheduleBackgroundRetry(session.user.id, session.access_token, session.user);
            }
          } catch (err: any) {
            console.error('Error loading user data after auth change:', err);
            if (err?.message === 'BACKEND_UNAVAILABLE') {
              // Set fallback user so the UI works
              const fallback = buildFallbackUser(session.user);
              setCurrentUser(fallback);
              console.log('Backend unavailable, using fallback user and scheduling retries');
              scheduleBackgroundRetry(session.user.id, session.access_token, session.user);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAccessToken(null);
        // Clear any pending retries
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      }
    });
    
    return () => {
      subscription.unsubscribe();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const checkSession = async () => {
    isCheckingSession.current = true;
    try {
      if (backendMode === 'laravel') {
        const redirectParams = consumeLaravelAuthRedirectParams();
        const token = redirectParams.token || window.localStorage.getItem(LARAVEL_ACCESS_TOKEN_KEY);

        if (!token) {
          setCurrentUser(null);
          setAccessToken(null);
          return;
        }

        try {
          const response = await apiRequest('/auth/me', 'GET', undefined, token);
          const userData = response?.user || null;

          if (userData) {
            setAccessToken(token);
            setCurrentUser(userData);
          } else {
            window.localStorage.removeItem(LARAVEL_ACCESS_TOKEN_KEY);
            setCurrentUser(null);
            setAccessToken(null);
          }
        } catch (error: any) {
          const errorMessage = String(error?.message || '');
          if (typeof errorMessage === 'string' && errorMessage) {
            window.sessionStorage.setItem(LARAVEL_AUTH_ERROR_KEY, errorMessage);
          }
          window.localStorage.removeItem(LARAVEL_ACCESS_TOKEN_KEY);
          setCurrentUser(null);
          setAccessToken(null);
        }

        return;
      }

      // Check if there's an active session with Supabase client
      const supabase = getSupabaseClient();
      
      // Use getSession first (no network call) to avoid triggering auth events
      const { data: { session: existingSession }, error: getError } = await supabase.auth.getSession();
      
      if (getError || !existingSession) {
        setLoading(false);
        return;
      }

      let session = existingSession;

      // Only try to refresh if the token looks expired (within 60s of expiry)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const isNearExpiry = expiresAt > 0 && expiresAt - Date.now() < 60_000;

      if (isNearExpiry) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession) {
          session = refreshedSession;
        }
      }

      console.log('Session found, access token present:', !!session.access_token);

      // Get user data from backend with retry logic
      try {
        const userData = await loadUserWithRetry(
          session.user.id,
          session.access_token,
          session.user,
          { maxRetries: 2, baseDelay: 1500 }
        );
        if (userData) {
          setCurrentUser(userData);
          setAccessToken(session.access_token);
          console.log('User session restored:', userData.email);
        } else {
          // All retries exhausted but no hard error - use fallback
          console.log('Could not load user data during checkSession, using fallback');
          setAccessToken(session.access_token);
          const fallback = buildFallbackUser(session.user);
          setCurrentUser(fallback);
          scheduleBackgroundRetry(session.user.id, session.access_token, session.user);
        }
      } catch (err: any) {
        console.error('Error loading user data during checkSession:', err);
        // Check if user is banned or archived
        if (err?.message?.includes('banned') || err?.message?.includes('archived')) {
          console.log('User account is banned or archived, signing out');
          await supabase.auth.signOut();
          return;
        }
        if (err?.message === 'BACKEND_UNAVAILABLE') {
          // Backend unavailable after retries - use fallback user
          setAccessToken(session.access_token);
          const fallback = buildFallbackUser(session.user);
          setCurrentUser(fallback);
          console.log('Backend unavailable during checkSession, using fallback user and scheduling retries');
          scheduleBackgroundRetry(session.user.id, session.access_token, session.user);
        } else {
          // Unknown error - sign out
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      isCheckingSession.current = false;
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string, isProvider?: boolean) => {
    try {
      if (backendMode === 'laravel') {
        const registerResult = await apiRequest('/auth/register', 'POST', {
          email,
          password,
          name,
          phone,
          isProvider,
        });

        const token = registerResult?.token as string;
        const userData = registerResult?.user as User;

        if (!token || !userData) {
          throw new Error('Respuesta invalida del servidor durante registro');
        }

        window.localStorage.setItem(LARAVEL_ACCESS_TOKEN_KEY, token);
        setCurrentUser(userData);
        setAccessToken(token);

        return { user: userData, accessToken: token };
      }

      // Create user in backend
      const signupResult = await apiRequest('/auth/signup', 'POST', { email, password, name, phone, isProvider });
      
      // Sign in with Supabase client
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in after signup error:', error);
        throw new Error(error.message);
      }

      // Get user data from backend
      const userData = await apiRequest(`/users/${data.user.id}`, 'GET');
      setCurrentUser(userData);
      setAccessToken(data.session.access_token);

      return { user: userData, accessToken: data.session.access_token };
    } catch (error: any) {
      console.error('Signup error:', error);
      // Ensure the error message is properly propagated
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error?.message || 'Error al crear la cuenta');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (backendMode === 'laravel') {
        const loginResult = await apiRequest('/auth/login', 'POST', { email, password });
        const token = loginResult?.token as string;
        const userData = loginResult?.user as User;

        if (!token || !userData) {
          throw new Error('Respuesta invalida del servidor durante inicio de sesion');
        }

        window.localStorage.setItem(LARAVEL_ACCESS_TOKEN_KEY, token);
        setCurrentUser(userData);
        setAccessToken(token);

        return { user: userData, accessToken: token };
      }

      // Sign in with Supabase client
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Get user data from backend
      try {
        const userData = await apiRequest(`/users/${data.user.id}`, 'GET');
        setCurrentUser(userData);
        setAccessToken(data.session.access_token);
        return { user: userData, accessToken: data.session.access_token };
      } catch (err: any) {
        // Check if user is banned or archived
        if (err?.message?.includes('banned')) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador para más información.');
        }
        if (err?.message?.includes('archived')) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta está archivada. Contacta al administrador para reactivarla.');
        }
        throw err;
      }
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (backendMode === 'laravel') {
        window.location.assign(`${laravelApiBaseUrl}/auth/google/redirect`);
        return;
      }

      // Do not forget to complete setup at https://supabase.com/docs/guides/auth/social-login/auth-google
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (backendMode === 'laravel') {
        if (accessToken) {
          try {
            await apiRequest('/auth/logout', 'POST', {}, accessToken);
          } catch (error) {
            console.log('Laravel logout warning:', error);
          }
        }

        window.localStorage.removeItem(LARAVEL_ACCESS_TOKEN_KEY);
        setCurrentUser(null);
        setAccessToken(null);
        return;
      }

      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const data = await apiRequest(`/users/${userId}`, 'PUT', updates, accessToken || undefined);
      console.log('updateUser: Received updated user from server:', { 
        id: data.id, 
        isProvider: data.isProvider,
        providerId: data.providerId 
      });
      // Force a new object to ensure React detects the change
      const newUserObject = { ...data };
      setCurrentUser(newUserObject);
      return newUserObject;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Provider functions
  const createProvider = async (providerData: any) => {
    try {
      const data = await apiRequest('/providers', 'POST', providerData, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Create provider error:', error);
      throw error;
    }
  };

  const getProviders = async () => {
    try {
      const data = await apiRequest('/providers', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        console.log('getProviders: backend not available, returning empty array');
        return [];
      }
      console.error('Get providers error:', error);
      throw error;
    }
  };

  const getProviderByUserId = async (userId: string) => {
    try {
      const data = await apiRequest(`/providers/user/${userId}`, 'GET');
      return data;
    } catch (error) {
      console.error('Get provider error:', error);
      return null;
    }
  };

  const updateProvider = async (providerId: string, updates: any) => {
    try {
      const data = await apiRequest(`/providers/${providerId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Update provider error:', error);
      throw error;
    }
  };

  // Service/Artist functions
  const createService = async (serviceData: any) => {
    try {
      const data = await apiRequest('/services', 'POST', serviceData, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Create service error:', error);
      throw error;
    }
  };

  const getServicesPage = async (options?: ServiceQueryOptions) => {
    try {
      const query = buildServiceQuery(options);
      const data = await apiRequest(`/services${query}`, 'GET');
      return {
        items: extractCollection(data),
        meta: data?.meta || null,
      };
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return { items: [], meta: null };
      }
      console.error('Get services page error:', error);
      throw error;
    }
  };

  const getServices = async (options?: ServiceQueryOptions) => {
    const data = await getServicesPage(options);
    return data.items;
  };

  const getService = async (serviceId: string) => {
    try {
      return await apiRequest(`/services/${serviceId}`, 'GET');
    } catch (error) {
      console.error('Get service detail error:', error);
      throw error;
    }
  };

  const updateService = async (serviceId: string, updates: any) => {
    try {
      const data = await apiRequest(`/services/${serviceId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const data = await apiRequest(`/services/${serviceId}`, 'DELETE', undefined, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Delete service error:', error);
      throw error;
    }
  };

  // Contract functions
  const createContract = async (contractData: any) => {
    try {
      const data = await apiRequest('/contracts', 'POST', contractData, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Create contract error:', error);
      throw error;
    }
  };

  const getContracts = async (options?: {
    scope?: 'client' | 'provider' | 'mine' | 'all';
    page?: number;
    perPage?: number;
    clientId?: string;
    artistUserId?: string;
  }) => {
    try {
      const query = buildQueryString({
        scope: options?.scope === 'all' ? undefined : options?.scope,
        page: options?.page,
        per_page: options?.perPage,
        client_id: options?.clientId,
        artist_user_id: options?.artistUserId,
      });
      const data = await apiRequest(`/contracts${query}`, 'GET', undefined, accessToken || undefined);
      return extractCollection(data);
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return [];
      }
      console.error('Get contracts error:', error);
      throw error;
    }
  };

  const updateContract = async (contractId: string, updates: any) => {
    try {
      const data = await apiRequest(`/contracts/${contractId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Update contract error:', error);
      throw error;
    }
  };

  // Review functions
  const createReview = async (reviewData: any) => {
    try {
      console.log('Creating review - accessToken present:', !!accessToken);
      console.log('Creating review - accessToken value:', accessToken?.substring(0, 20) + '...');
      console.log('Creating review - currentUser:', currentUser?.email);
      
      if (!accessToken) {
        throw new Error('You must be logged in to create a review');
      }
      
      const data = await apiRequest('/reviews', 'POST', reviewData, accessToken);
      return data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  };

  const getReviews = async () => {
    try {
      const data = await apiRequest('/reviews', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return [];
      }
      console.error('Get reviews error:', error);
      throw error;
    }
  };

  // Booking functions
  const createBooking = async (bookingData: any) => {
    try {
      const data = await apiRequest('/bookings', 'POST', bookingData, accessToken || undefined);
      return data;
    } catch (error: any) {
      console.error('Create booking error:', error);
      // Provide a more helpful error message when backend is unavailable
      if (error?.message === 'BACKEND_UNAVAILABLE') {
        throw new Error('El servidor no está disponible en este momento. Por favor, intenta de nuevo más tarde.');
      }
      throw error;
    }
  };

  const getBookings = async (options?: {
    scope?: 'client' | 'provider' | 'mine' | 'all';
    page?: number;
    perPage?: number;
    userId?: string;
    artistUserId?: string;
  }) => {
    try {
      const query = buildQueryString({
        scope: options?.scope === 'all' ? undefined : options?.scope,
        page: options?.page,
        per_page: options?.perPage,
        user_id: options?.userId,
        artist_user_id: options?.artistUserId,
      });
      const data = await apiRequest(`/bookings${query}`, 'GET', undefined, accessToken || undefined);
      return extractCollection(data);
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return [];
      }
      console.error('Get bookings error:', error);
      throw error;
    }
  };

  const updateBooking = async (bookingId: string, updates: any) => {
    try {
      const data = await apiRequest(`/bookings/${bookingId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error: any) {
      console.error('Update booking error:', error);
      // Provide a more helpful error message when backend is unavailable
      if (error?.message === 'BACKEND_UNAVAILABLE') {
        throw new Error('El servidor no está disponible en este momento. Por favor, intenta de nuevo más tarde.');
      }
      throw error;
    }
  };

  // Event functions
  const createEvent = async (eventData: any) => {
    try {
      const data = await apiRequest('/events', 'POST', eventData, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  };

  const getEvents = async () => {
    try {
      const data = await apiRequest('/events', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return [];
      }
      console.error('Get events error:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: string, updates: any) => {
    try {
      const data = await apiRequest(`/events/${eventId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const data = await apiRequest(`/events/${eventId}`, 'DELETE', undefined, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  };

  // Admin functions
  const verifyProvider = async (providerId: string) => {
    try {
      const data = await apiRequest(`/admin/providers/${providerId}/verify`, 'POST', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Verify provider error:', error);
      throw error;
    }
  };

  const banProvider = async (providerId: string, reason: string) => {
    try {
      const data = await apiRequest(`/admin/providers/${providerId}/ban`, 'POST', { reason }, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Ban provider error:', error);
      throw error;
    }
  };

  const unbanProvider = async (providerId: string) => {
    try {
      const data = await apiRequest(`/admin/providers/${providerId}/unban`, 'POST', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Unban provider error:', error);
      throw error;
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/ban`, 'POST', { reason }, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Ban user error:', error);
      throw error;
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/unban`, 'POST', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Unban user error:', error);
      throw error;
    }
  };

  const archiveUser = async (userId: string) => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/archive`, 'POST', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Archive user error:', error);
      throw error;
    }
  };

  const unarchiveUser = async (userId: string) => {
    try {
      const data = await apiRequest(`/admin/users/${userId}/unarchive`, 'POST', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Unarchive user error:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const data = await apiRequest(`/admin/users/${userId}`, 'DELETE', {}, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  const requestProviderAccess = async (userId: string) => {
    try {
      const data = await apiRequest(`/users/${userId}/provider-request`, 'POST', {}, accessToken || undefined);
      if (data?.user) {
        setCurrentUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Request provider access error:', error);
      throw error;
    }
  };

  const approveProviderAccess = async (userId: string) => {
    try {
      return await apiRequest(`/admin/users/${userId}/provider-access/approve`, 'POST', {}, accessToken || undefined);
    } catch (error) {
      console.error('Approve provider access error:', error);
      throw error;
    }
  };

  const revokeProviderAccess = async (userId: string) => {
    try {
      return await apiRequest(`/admin/users/${userId}/provider-access/revoke`, 'POST', {}, accessToken || undefined);
    } catch (error) {
      console.error('Revoke provider access error:', error);
      throw error;
    }
  };

  const getAllUsers = async () => {
    try {
      const data = await apiRequest('/admin/users', 'GET', undefined, accessToken || undefined);
      return data;
    } catch (error: any) {
      // If backend is unavailable or overloaded, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        return [];
      }
      console.error('Get all users error:', error);
      throw error;
    }
  };

  const getNotifications = async (options?: {
    cursor?: string;
    limit?: number;
    unread?: boolean;
    type?: string;
  }) => {
    try {
      const params = new URLSearchParams();

      if (options?.cursor) params.set('cursor', options.cursor);
      if (typeof options?.limit === 'number') params.set('limit', String(options.limit));
      if (typeof options?.unread === 'boolean') params.set('unread', String(options.unread));
      if (options?.type) params.set('type', options.type);

      const query = params.toString();
      const path = query ? `/notifications?${query}` : '/notifications';

      return await apiRequest(path, 'GET', undefined, accessToken || undefined);
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  };

  const getUnreadNotificationsCount = async (): Promise<number> => {
    try {
      const data = await apiRequest('/notifications/unread-count', 'GET', undefined, accessToken || undefined);
      return Number(data?.count || 0);
    } catch (error) {
      console.error('Get unread notifications count error:', error);
      throw error;
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      return await apiRequest(`/notifications/${notificationId}/read`, 'PATCH', {}, accessToken || undefined);
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      return await apiRequest('/notifications/read-all', 'PATCH', {}, accessToken || undefined);
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      throw error;
    }
  };

  const getFavorites = async (): Promise<string[]> => {
    try {
      const data = await apiRequest('/favorites', 'GET', undefined, accessToken || undefined);

      if (Array.isArray(data?.serviceIds)) {
        return data.serviceIds.map((id: string | number) => String(id));
      }

      return [];
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  };

  const addFavorite = async (serviceId: string) => {
    try {
      return await apiRequest('/favorites', 'POST', { serviceId }, accessToken || undefined);
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error;
    }
  };

  const removeFavorite = async (serviceId: string) => {
    try {
      return await apiRequest(`/favorites/${serviceId}`, 'DELETE', undefined, accessToken || undefined);
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error;
    }
  };

  const getChatConversations = async (): Promise<ChatConversation[]> => {
    const data = await apiRequest('/chat/conversations', 'GET', undefined, accessToken || undefined);
    return Array.isArray(data?.items) ? data.items : [];
  };

  const ensureChatConversation = async (payload: {
    bookingId?: string;
    serviceId?: string;
    clientUserId?: string;
    providerUserId?: string;
  }): Promise<ChatConversation> => {
    return await apiRequest('/chat/conversations', 'POST', payload, accessToken || undefined);
  };

  const getChatMessages = async (conversationId: string, options?: { before?: string; limit?: number }): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();

    if (options?.before) params.set('before', options.before);
    if (typeof options?.limit === 'number') params.set('limit', String(options.limit));

    const query = params.toString();
    const path = query
      ? `/chat/conversations/${conversationId}/messages?${query}`
      : `/chat/conversations/${conversationId}/messages`;

    const data = await apiRequest(path, 'GET', undefined, accessToken || undefined);
    return Array.isArray(data?.items) ? data.items : [];
  };

  const sendChatMessage = async (
    conversationId: string,
    body: string,
    attachments?: Array<{ imageData: string; fileName: string; contentType: string }>
  ): Promise<ChatMessage> => {
    return await apiRequest(`/chat/conversations/${conversationId}/messages`, 'POST', {
      body,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    }, accessToken || undefined);
  };

  const markChatConversationRead = async (conversationId: string): Promise<{ unreadCount: number; readCount: number }> => {
    return await apiRequest(`/chat/conversations/${conversationId}/read`, 'PATCH', {}, accessToken || undefined);
  };

  const requestChatIntervention = async (conversationId: string): Promise<{ requiresAdminIntervention: boolean }> => {
    return await apiRequest(`/chat/conversations/${conversationId}/intervention`, 'PATCH', {}, accessToken || undefined);
  };

  const subscribeChatStream = (
    onEvent: (payload: ChatStreamPayload) => void,
    onError?: (error: Error) => void,
  ) => {
    if (!accessToken) {
      return () => undefined;
    }

    let active = true;
    let abortController: AbortController | null = null;
    let since = new Date(Date.now() - 30 * 1000).toISOString();

    const processSseChunk = (chunk: string) => {
      const events = chunk.split('\n\n');

      for (const rawEvent of events) {
        const lines = rawEvent.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        let eventName = 'message';
        let dataLine = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          }
          if (line.startsWith('data:')) {
            dataLine += line.slice(5).trim();
          }
        }

        if (!dataLine || eventName === 'heartbeat') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataLine) as ChatStreamPayload;
          if (parsed?.message?.createdAt) {
            since = parsed.message.createdAt;
          }
          onEvent(parsed);
        } catch {
          // Ignore malformed SSE payloads.
        }
      }
    };

    const connect = async () => {
      while (active) {
        abortController = new AbortController();

        try {
          const url = `${laravelApiBaseUrl}/chat/stream?since=${encodeURIComponent(since)}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              Authorization: `Bearer ${accessToken}`,
            },
            signal: abortController.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`Chat stream failed (${response.status})`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (active) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const boundary = buffer.lastIndexOf('\n\n');
            if (boundary >= 0) {
              const complete = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              processSseChunk(complete);
            }
          }
        } catch (error: any) {
          if (!active || error?.name === 'AbortError') {
            break;
          }

          if (onError) {
            onError(error instanceof Error ? error : new Error('Chat stream error'));
          }
        }

        if (active) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    void connect();

    return () => {
      active = false;
      abortController?.abort();
    };
  };

  // Image upload function
  const uploadImage = async (file: File, folder: 'service-images' | 'avatar-images' = 'service-images'): Promise<string> => {
    try {
      if (!accessToken) {
        throw new Error('You must be logged in to upload images');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to backend
      const data = await apiRequest('/upload-image', 'POST', {
        imageData: base64,
        fileName: file.name,
        contentType: file.type,
        folder
      }, accessToken);

      return data.url;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  };

  // Initialize admin user (for first-time setup)
  const initializeAdmin = async () => {
    try {
      if (backendMode === 'laravel') {
        return null;
      }

      const data = await apiRequest('/auth/init-admin', 'POST', {});
      return data;
    } catch (error: any) {
      // Silently ignore backend unavailability – admin init is non-critical at startup
      if (error?.message === 'BACKEND_UNAVAILABLE' || error?.message?.includes('compute resources')) {
        console.log('initializeAdmin: backend not reachable, skipping admin init for now');
        return null;
      }
      // For all other errors, log quietly (not as console.error) and rethrow
      console.log('Initialize admin error:', error?.message || error);
      throw error;
    }
  };

  return {
    currentUser,
    accessToken,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
    createProvider,
    getProviders,
    getProviderByUserId,
    updateProvider,
    createService,
    getServicesPage,
    getServices,
    getService,
    updateService,
    deleteService,
    createContract,
    getContracts,
    updateContract,
    createReview,
    getReviews,
    createBooking,
    getBookings,
    updateBooking,
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent,
    verifyProvider,
    banProvider,
    unbanProvider,
    banUser,
    unbanUser,
    archiveUser,
    unarchiveUser,
    deleteUser,
    requestProviderAccess,
    approveProviderAccess,
    revokeProviderAccess,
    getAllUsers,
    getNotifications,
    getUnreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    getFavorites,
    addFavorite,
    removeFavorite,
    getChatConversations,
    ensureChatConversation,
    getChatMessages,
    sendChatMessage,
    markChatConversationRead,
    requestChatIntervention,
    subscribeChatStream,
    uploadImage,
    initializeAdmin,
    signInWithGoogle
  };
}