import { useState, useEffect } from 'react';
import { getSupabaseClient, apiRequest } from './supabase/client';
import { User, Artist, Contract, Review, Booking, Provider } from '../types';

export function useSupabase() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    checkSession();
    
    // Listen for auth state changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          console.log('Session updated, refreshing user data');
          try {
            const userData = await apiRequest(`/users/${session.user.id}`, 'GET');
            setCurrentUser(userData);
            setAccessToken(session.access_token);
          } catch (err: any) {
            console.error('Error loading user data after auth change:', err);
            // Keep the session even if backend is unavailable
            if (err?.message === 'BACKEND_UNAVAILABLE') {
              setAccessToken(session.access_token);
              console.log('Backend unavailable during auth change, keeping session');
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAccessToken(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Check if there's an active session with Supabase client
      const supabase = getSupabaseClient();
      
      // First try to refresh the session to get a fresh token
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      let session = refreshedSession;
      
      // If refresh fails, try to get the existing session
      if (refreshError || !refreshedSession) {
        console.log('Session refresh failed, trying to get existing session');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error || !existingSession) {
          setLoading(false);
          return;
        }
        session = existingSession;
      }

      console.log('Session found, access token present:', !!session.access_token);

      // Get user data from backend
      try {
        const userData = await apiRequest(`/users/${session.user.id}`, 'GET');
        setCurrentUser(userData);
        setAccessToken(session.access_token);
        console.log('User session restored:', userData.email);
      } catch (err: any) {
        console.error('Error loading user data:', err);
        // Check if user is banned or archived
        if (err?.message?.includes('banned') || err?.message?.includes('archived')) {
          console.log('User account is banned or archived, signing out');
          await supabase.auth.signOut();
          return;
        }
        // Only sign out if it's not a backend availability issue
        if (err?.message !== 'BACKEND_UNAVAILABLE') {
          // Session exists but user data not found (user deleted), sign out
          await supabase.auth.signOut();
        } else {
          // Backend unavailable, keep session but set token for when it comes back
          setAccessToken(session.access_token);
          console.log('Backend unavailable, keeping session active');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string, isProvider?: boolean) => {
    try {
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
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
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

  const getServices = async () => {
    try {
      const data = await apiRequest('/services', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
        return [];
      }
      console.error('Get services error:', error);
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

  const getContracts = async () => {
    try {
      const data = await apiRequest('/contracts', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
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
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
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

  const getBookings = async () => {
    try {
      const data = await apiRequest('/bookings', 'GET');
      return data;
    } catch (error: any) {
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
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
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
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

  const getAllUsers = async () => {
    try {
      const data = await apiRequest('/admin/users', 'GET', undefined, accessToken || undefined);
      return data;
    } catch (error: any) {
      // If backend is unavailable, silently return empty array
      if (error?.message === 'BACKEND_UNAVAILABLE') {
        return [];
      }
      console.error('Get all users error:', error);
      throw error;
    }
  };

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
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
        contentType: file.type
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
      const data = await apiRequest('/auth/init-admin', 'POST', {});
      return data;
    } catch (error) {
      console.error('Initialize admin error:', error);
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
    getServices,
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
    getAllUsers,
    uploadImage,
    initializeAdmin,
    signInWithGoogle
  };
}