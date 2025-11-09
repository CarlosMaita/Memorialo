import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('verifyAuth: No auth header or invalid format. Header:', authHeader);
    return null;
  }
  
  const accessToken = authHeader.split(' ')[1];
  console.log('verifyAuth: Token preview:', accessToken?.substring(0, 20) + '...');
  
  // If it's the anon key, return null (not authenticated)
  if (accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
    console.log('verifyAuth: Anon key detected, not authenticated');
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.log('verifyAuth: Failed to get user. Error:', error?.message || 'No user found');
      console.log('verifyAuth: Error details:', JSON.stringify(error));
      return null;
    }
    console.log('verifyAuth: Successfully authenticated user:', user.id, user.email);
    return { user, accessToken };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-5d78aefb/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up
app.post("/make-server-5d78aefb/auth/signup", async (c) => {
  try {
    const { email, password, name, phone, isProvider } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, isProvider },
      email_confirm: true // Auto-confirm since no email server configured
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already been registered') || error.code === 'email_exists') {
        return c.json({ 
          error: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.' 
        }, 409);
      }
      
      if (error.message.includes('Password should be at least')) {
        return c.json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        }, 400);
      }
      
      return c.json({ error: error.message }, 400);
    }

    // Store user data in KV store
    const user = {
      id: data.user.id,
      email: data.user.email,
      name,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      isProvider: isProvider || false
    };

    await kv.set(`user:${data.user.id}`, user);

    return c.json({ user, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Error al crear la cuenta. Por favor, intenta de nuevo.' }, 500);
  }
});

// Get current session (verify token and return user data)
app.get("/make-server-5d78aefb/auth/session", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ user: null });
  }

  const userData = await kv.get(`user:${authResult.user.id}`);
  return c.json({ user: userData, accessToken: authResult.accessToken });
});

// ==================== USER ROUTES ====================

// Get user by ID
app.get("/make-server-5d78aefb/users/:id", async (c) => {
  try {
    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Update user
app.put("/make-server-5d78aefb/users/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userId = c.req.param('id');
    
    if (authResult.user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    const currentUser = await kv.get(`user:${userId}`);

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedUser = { ...currentUser, ...updates };
    await kv.set(`user:${userId}`, updatedUser);

    return c.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ==================== PROVIDER ROUTES ====================

// Create provider profile
app.post("/make-server-5d78aefb/providers", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const providerData = await c.req.json();
    
    const provider = {
      id: `provider-${Date.now()}`,
      userId: authResult.user.id,
      businessName: providerData.businessName,
      category: providerData.category,
      description: providerData.description || '',
      verified: false,
      createdAt: new Date().toISOString(),
      services: [],
      totalBookings: 0,
      rating: 5
    };

    await kv.set(`provider:${provider.id}`, provider);
    
    // Update user to mark as provider
    const user = await kv.get(`user:${authResult.user.id}`);
    if (user) {
      user.isProvider = true;
      user.providerId = provider.id;
      await kv.set(`user:${authResult.user.id}`, user);
    }

    return c.json(provider);
  } catch (error) {
    console.error('Create provider error:', error);
    return c.json({ error: 'Failed to create provider' }, 500);
  }
});

// Get all providers
app.get("/make-server-5d78aefb/providers", async (c) => {
  try {
    const providers = await kv.getByPrefix('provider:');
    return c.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    return c.json({ error: 'Failed to get providers' }, 500);
  }
});

// Get provider by user ID
app.get("/make-server-5d78aefb/providers/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const providers = await kv.getByPrefix('provider:');
    const provider = providers.find((p: any) => p.userId === userId);
    
    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json(provider);
  } catch (error) {
    console.error('Get provider error:', error);
    return c.json({ error: 'Failed to get provider' }, 500);
  }
});

// ==================== SERVICE/ARTIST ROUTES ====================

// Create service (artist listing)
app.post("/make-server-5d78aefb/services", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const serviceData = await c.req.json();
    
    const service = {
      ...serviceData,
      id: serviceData.id || `service-${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: authResult.user.id
    };

    await kv.set(`service:${service.id}`, service);

    return c.json(service);
  } catch (error) {
    console.error('Create service error:', error);
    return c.json({ error: 'Failed to create service' }, 500);
  }
});

// Get all services (artists)
app.get("/make-server-5d78aefb/services", async (c) => {
  try {
    const services = await kv.getByPrefix('service:');
    return c.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    return c.json({ error: 'Failed to get services' }, 500);
  }
});

// Update service
app.put("/make-server-5d78aefb/services/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const serviceId = c.req.param('id');
    const updates = await c.req.json();
    
    const currentService = await kv.get(`service:${serviceId}`);
    
    if (!currentService) {
      return c.json({ error: 'Service not found' }, 404);
    }

    if (currentService.userId !== authResult.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updatedService = { ...currentService, ...updates };
    await kv.set(`service:${serviceId}`, updatedService);

    return c.json(updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    return c.json({ error: 'Failed to update service' }, 500);
  }
});

// Delete service
app.delete("/make-server-5d78aefb/services/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const serviceId = c.req.param('id');
    const service = await kv.get(`service:${serviceId}`);
    
    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    if (service.userId !== authResult.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await kv.del(`service:${serviceId}`);

    return c.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    return c.json({ error: 'Failed to delete service' }, 500);
  }
});

// ==================== CONTRACT ROUTES ====================

// Create contract
app.post("/make-server-5d78aefb/contracts", async (c) => {
  // Allow both authenticated and guest users to create contracts
  const authResult = await verifyAuth(c.req.header('Authorization'));

  try {
    const contractData = await c.req.json();
    
    const contract = {
      ...contractData,
      id: contractData.id || `contract-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    await kv.set(`contract:${contract.id}`, contract);

    return c.json(contract);
  } catch (error) {
    console.error('Create contract error:', error);
    return c.json({ error: 'Failed to create contract' }, 500);
  }
});

// Get all contracts
app.get("/make-server-5d78aefb/contracts", async (c) => {
  try {
    const contracts = await kv.getByPrefix('contract:');
    return c.json(contracts);
  } catch (error) {
    console.error('Get contracts error:', error);
    return c.json({ error: 'Failed to get contracts' }, 500);
  }
});

// Update contract
app.put("/make-server-5d78aefb/contracts/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const contractId = c.req.param('id');
    const updates = await c.req.json();
    
    const currentContract = await kv.get(`contract:${contractId}`);
    
    if (!currentContract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const updatedContract = { ...currentContract, ...updates };
    await kv.set(`contract:${contractId}`, updatedContract);

    // If contract is being marked as completed, increment artist's bookingsCompleted
    if (updates.status === 'completed' && currentContract.status !== 'completed') {
      console.log(`Contract ${contractId} marked as completed, updating artist bookingsCompleted`);
      
      // Find and update the artist/service
      const artistId = currentContract.artistId;
      const service = await kv.get(`service:${artistId}`);
      
      if (service) {
        const currentBookings = service.bookingsCompleted || 0;
        service.bookingsCompleted = currentBookings + 1;
        await kv.set(`service:${artistId}`, service);
        console.log(`Updated service ${artistId} bookingsCompleted from ${currentBookings} to ${service.bookingsCompleted}`);
      } else {
        console.warn(`Service ${artistId} not found when trying to update bookingsCompleted`);
      }
    }

    return c.json(updatedContract);
  } catch (error) {
    console.error('Update contract error:', error);
    return c.json({ error: 'Failed to update contract' }, 500);
  }
});

// ==================== REVIEW ROUTES ====================

// Create review
app.post("/make-server-5d78aefb/reviews", async (c) => {
  const authHeader = c.req.header('Authorization');
  console.log('Review creation - Auth header:', authHeader ? 'Present' : 'Missing');
  
  const authResult = await verifyAuth(authHeader);
  
  if (!authResult) {
    console.error('Review creation - Unauthorized: No valid auth result');
    return c.json({ error: 'Unauthorized. You must be logged in to create a review.' }, 401);
  }

  try {
    const reviewData = await c.req.json();
    console.log('Review creation - User ID:', authResult.user.id);
    
    const review = {
      ...reviewData,
      id: reviewData.id || `review-${Date.now()}`,
      userId: authResult.user.id,
      createdAt: new Date().toISOString()
    };

    await kv.set(`review:${review.id}`, review);
    console.log('Review created successfully:', review.id);

    return c.json(review);
  } catch (error) {
    console.error('Create review error:', error);
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

// Get all reviews
app.get("/make-server-5d78aefb/reviews", async (c) => {
  try {
    const reviews = await kv.getByPrefix('review:');
    return c.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return c.json({ error: 'Failed to get reviews' }, 500);
  }
});

// ==================== BOOKING ROUTES ====================

// Create booking
app.post("/make-server-5d78aefb/bookings", async (c) => {
  // Allow both authenticated and guest users to create bookings
  const authResult = await verifyAuth(c.req.header('Authorization'));

  try {
    const bookingData = await c.req.json();
    
    const booking = {
      ...bookingData,
      id: bookingData.id || `booking-${Date.now()}`,
      // Use authenticated user ID if available, otherwise use the userId from bookingData (guest)
      userId: authResult?.user.id || bookingData.userId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`booking:${booking.id}`, booking);

    return c.json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

// Get all bookings
app.get("/make-server-5d78aefb/bookings", async (c) => {
  try {
    const bookings = await kv.getByPrefix('booking:');
    return c.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return c.json({ error: 'Failed to get bookings' }, 500);
  }
});

// Update booking
app.put("/make-server-5d78aefb/bookings/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`booking:${id}`);
    if (!existing) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    
    const updated = { ...existing, ...updates };
    await kv.set(`booking:${id}`, updated);
    
    return c.json(updated);
  } catch (error) {
    console.error('Update booking error:', error);
    return c.json({ error: 'Failed to update booking' }, 500);
  }
});

Deno.serve(app.fetch);
