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

// Storage bucket name
const IMAGES_BUCKET = 'make-5d78aefb-service-images';

// Initialize storage bucket on startup
async function initializeStorage() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing storage buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === IMAGES_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating storage bucket: ${IMAGES_BUCKET}`);
      const { error } = await supabase.storage.createBucket(IMAGES_BUCKET, {
        public: false,
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (error) {
        // Check if error is because bucket already exists (race condition)
        if (error.message?.includes('already exists') || error.statusCode === '409') {
          console.log(`Storage bucket ${IMAGES_BUCKET} already exists (created by another instance)`);
        } else {
          console.error('Error creating storage bucket:', error);
        }
      } else {
        console.log(`Storage bucket ${IMAGES_BUCKET} created successfully`);
      }
    } else {
      console.log(`Storage bucket ${IMAGES_BUCKET} already exists`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on startup
initializeStorage();

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
      // Handle specific error cases without verbose logging for expected errors
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        console.log('Signup attempt with existing email:', email);
        return c.json({ 
          error: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.' 
        }, 409);
      }
      
      if (error.message?.includes('Password should be at least')) {
        console.log('Signup attempt with weak password for email:', email);
        return c.json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        }, 400);
      }
      
      // For unexpected errors, log the full details
      console.error('Unexpected signup error:', error);
      return c.json({ error: error.message || 'Error al crear la cuenta' }, 400);
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
    
    // Return null if not found instead of 404 error
    // This is expected behavior when a user has isProvider=true but hasn't created their provider profile yet
    if (!provider) {
      return c.json(null);
    }

    return c.json(provider);
  } catch (error) {
    console.error('Get provider by userId error:', error);
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

// ==================== IMAGE UPLOAD ROUTES ====================

// Upload image to Supabase Storage
app.post("/make-server-5d78aefb/upload-image", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { imageData, fileName, contentType } = await c.req.json();
    
    if (!imageData || !fileName) {
      return c.json({ error: 'Image data and filename are required' }, 400);
    }

    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = fileName.split('.').pop();
    const uniqueFileName = `${authResult.user.id}/${timestamp}-${randomStr}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(uniqueFileName, bytes, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: `Failed to upload image: ${uploadError.message}` }, 500);
    }

    // Generate signed URL that expires in 10 years (essentially permanent for our use case)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .createSignedUrl(uniqueFileName, 315360000); // 10 years in seconds

    if (urlError) {
      console.error('URL generation error:', urlError);
      return c.json({ error: 'Failed to generate image URL' }, 500);
    }

    console.log(`Image uploaded successfully: ${uniqueFileName}`);
    return c.json({ 
      url: urlData.signedUrl,
      path: uniqueFileName 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// ==================== EMAIL NOTIFICATION ROUTES ====================

// Helper function to send email notifications
async function sendEmailNotification(to: string, subject: string, body: string) {
  // For MVP, we'll log emails to console
  // In production, integrate with services like Resend, SendGrid, or AWS SES
  console.log('===== EMAIL NOTIFICATION =====');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('==============================');
  
  // TODO: Integrate with email service provider
  // Example with Resend:
  // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  // await resend.emails.send({ from: 'noreply@memorialo.com', to, subject, html: body });
  
  return true;
}

// Send booking notification to provider
app.post("/make-server-5d78aefb/notifications/booking-created", async (c) => {
  try {
    const { artistEmail, artistName, clientName, serviceName, eventDate, bookingId } = await c.req.json();
    
    if (!artistEmail) {
      return c.json({ error: 'Artist email is required' }, 400);
    }

    const subject = '🎉 Nueva Reserva en Memorialo';
    const body = `
      Hola ${artistName},
      
      ¡Tienes una nueva solicitud de reserva!
      
      Cliente: ${clientName}
      Servicio: ${serviceName}
      Fecha del Evento: ${eventDate}
      
      Por favor, inicia sesión en Memorialo para revisar los detalles y firmar el contrato.
      
      https://memorialo.com
      
      ¡Gracias por usar Memorialo!
      
      ---
      ID de Reserva: ${bookingId}
    `;

    await sendEmailNotification(artistEmail, subject, body);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Send booking notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// Send contract signature notification
app.post("/make-server-5d78aefb/notifications/contract-signed", async (c) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      signerName, 
      serviceName, 
      eventDate, 
      contractId,
      bothPartiesSigned 
    } = await c.req.json();
    
    if (!recipientEmail) {
      return c.json({ error: 'Recipient email is required' }, 400);
    }

    const subject = bothPartiesSigned 
      ? '✅ Contrato Completamente Firmado - Memorialo' 
      : '📝 Nueva Firma de Contrato - Memorialo';
    
    const body = bothPartiesSigned
      ? `
        Hola ${recipientName},
        
        ¡Excelentes noticias! El contrato ha sido firmado por ambas partes.
        
        Servicio: ${serviceName}
        Fecha del Evento: ${eventDate}
        
        Ahora puedes contactar a la otra parte usando la información disponible en el contrato.
        Inicia sesión en Memorialo para ver los detalles de contacto.
        
        https://memorialo.com
        
        ¡Que tengas un evento exitoso!
        
        ---
        ID de Contrato: ${contractId}
      `
      : `
        Hola ${recipientName},
        
        ${signerName} ha firmado el contrato del servicio.
        
        Servicio: ${serviceName}
        Fecha del Evento: ${eventDate}
        
        Por favor, inicia sesión en Memorialo para revisar y firmar el contrato.
        
        https://memorialo.com
        
        ---
        ID de Contrato: ${contractId}
      `;

    await sendEmailNotification(recipientEmail, subject, body);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Send contract signature notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// ==================== EVENT ROUTES ====================

// Create event
app.post("/make-server-5d78aefb/events", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const eventData = await c.req.json();
    
    const event = {
      ...eventData,
      id: eventData.id || `event-${Date.now()}`,
      userId: authResult.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`event:${event.id}`, event);

    return c.json(event);
  } catch (error) {
    console.error('Create event error:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Get all events
app.get("/make-server-5d78aefb/events", async (c) => {
  try {
    const events = await kv.getByPrefix('event:');
    return c.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return c.json({ error: 'Failed to get events' }, 500);
  }
});

// Update event
app.put("/make-server-5d78aefb/events/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const eventId = c.req.param('id');
    const updates = await c.req.json();
    
    const currentEvent = await kv.get(`event:${eventId}`);
    
    if (!currentEvent) {
      return c.json({ error: 'Event not found' }, 404);
    }

    if (currentEvent.userId !== authResult.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updatedEvent = { 
      ...currentEvent, 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await kv.set(`event:${eventId}`, updatedEvent);

    return c.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// Delete event
app.delete("/make-server-5d78aefb/events/:id", async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization'));
  
  if (!authResult) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const eventId = c.req.param('id');
    const event = await kv.get(`event:${eventId}`);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    if (event.userId !== authResult.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await kv.del(`event:${eventId}`);

    return c.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

Deno.serve(app.fetch);
