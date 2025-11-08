import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Singleton instance
let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, publicAnonKey);
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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || publicAnonKey}`
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${serverUrl}${path}`, options);
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      console.error(`API Error [${method} ${path}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error calling ${method} ${path}:`, error.message);
      throw error;
    }
    console.error(`Network error while calling ${method} ${path}:`, error);
    throw new Error('Network error');
  }
}
