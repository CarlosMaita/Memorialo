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
          } catch (err) {
            console.error('Error loading user data after auth change:', err);
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
      } catch (err) {
        console.error('Error loading user data:', err);
        // Session exists but user data not found, sign out
        await supabase.auth.signOut();
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
        console.error('Sign in error:', error);
        throw new Error(error.message);
      }

      // Get user data from backend
      const userData = await apiRequest(`/users/${data.user.id}`, 'GET');
      setCurrentUser(userData);
      setAccessToken(data.session.access_token);

      return { user: userData, accessToken: data.session.access_token };
    } catch (error) {
      console.error('Sign in error:', error);
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
      setCurrentUser(data);
      return data;
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error;
    }
  };

  // Booking functions
  const createBooking = async (bookingData: any) => {
    try {
      const data = await apiRequest('/bookings', 'POST', bookingData, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  };

  const getBookings = async () => {
    try {
      const data = await apiRequest('/bookings', 'GET');
      return data;
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  };

  const updateBooking = async (bookingId: string, updates: any) => {
    try {
      const data = await apiRequest(`/bookings/${bookingId}`, 'PUT', updates, accessToken || undefined);
      return data;
    } catch (error) {
      console.error('Update booking error:', error);
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
    updateBooking
  };
}
