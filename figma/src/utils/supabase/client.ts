import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const defaultSupabaseServerUrl = `${supabaseUrl}/functions/v1/make-server-5d78aefb`;
const viteEnv = (import.meta as any).env || {};

export const backendMode = (viteEnv.VITE_BACKEND_MODE || 'supabase').toLowerCase();
export const apiBaseUrl = viteEnv.VITE_API_BASE_URL || defaultSupabaseServerUrl;
export const laravelApiBaseUrl = viteEnv.VITE_LARAVEL_API_BASE_URL || 'http://127.0.0.1:8000/api';

const laravelPrefixes = ['/health', '/auth', '/users', '/providers', '/services', '/contracts', '/bookings', '/events', '/billing', '/admin', '/reviews'];

function isLaravelPath(path: string): boolean {
  return laravelPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function resolveServerUrl(path: string): string {
  if (backendMode === 'laravel' && isLaravelPath(path)) {
    return laravelApiBaseUrl;
  }

  return apiBaseUrl;
}

// Singleton instance
let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      }
    });
  }
  return supabase;
}

export async function apiRequest(
  path: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  accessToken?: string
) {
  const isLaravelMode = backendMode === 'laravel' && isLaravelPath(path);
  const tokenToUse = accessToken || (isLaravelMode ? undefined : publicAnonKey);
  const isUsingAccessToken = !!tokenToUse;
  
  // Log for review creation specifically
  if (path === '/reviews' && method === 'POST') {
    console.log('API Request to /reviews - Using access token:', isUsingAccessToken);
    console.log('API Request to /reviews - Token preview:', tokenToUse ? tokenToUse.substring(0, 20) + '...' : 'none');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }

  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const url = `${resolveServerUrl(path)}${path}`;
    
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (fetchError) {
      // Only actual network failures (no connection) should be BACKEND_UNAVAILABLE
      console.log(`Network error (fetch failed) for ${method} ${path}:`, fetchError);
      throw new Error('BACKEND_UNAVAILABLE');
    }
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      // Use console.log for transient/expected errors, console.error for unexpected ones
      if (errorMessage.includes('compute resources')) {
        console.log(`API transient error [${method} ${path}]:`, errorMessage);
      } else {
        console.error(`API Error [${method} ${path}]:`, errorMessage);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw BACKEND_UNAVAILABLE and transient errors as-is
      if (error.message === 'BACKEND_UNAVAILABLE' || error.message.includes('compute resources')) {
        throw error;
      }
      console.error(`Error calling ${method} ${path}:`, error.message);
      throw error;
    }
    console.error(`Unknown error while calling ${method} ${path}:`, error);
    throw new Error('Network error');
  }
}