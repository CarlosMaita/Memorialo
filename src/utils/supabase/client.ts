import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

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

// API helper for making requests to the server
const serverUrl = `${supabaseUrl}/functions/v1/make-server-5d78aefb`;

export async function apiRequest(
  path: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  accessToken?: string
) {
  const tokenToUse = accessToken || publicAnonKey;
  const isUsingAccessToken = !!accessToken;
  
  // Log for review creation specifically
  if (path === '/reviews' && method === 'POST') {
    console.log('API Request to /reviews - Using access token:', isUsingAccessToken);
    console.log('API Request to /reviews - Token preview:', tokenToUse.substring(0, 20) + '...');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenToUse}`
  };

  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const url = `${serverUrl}${path}`;
    
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