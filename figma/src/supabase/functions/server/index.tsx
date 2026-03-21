import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const IMAGES_BUCKET = 'make-5d78aefb-service-images';
const COMMISSION_RATE = 0.08;
const P = "/make-server-5d78aefb";

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Auth helper
async function verifyAuth(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { user, accessToken: token };
  } catch { return null; }
}

async function verifyAdmin(authResult: any) {
  if (!authResult) return false;
  try {
    const u = await kv.get(`user:${authResult.user.id}`);
    return u?.role === 'admin';
  } catch { return false; }
}

// Health
app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

// ==================== AUTH ====================

app.post(`${P}/auth/signup`, async (c) => {
  try {
    const { email, password, name, phone, isProvider } = await c.req.json();
    if (!email || !password || !name) return c.json({ error: 'Email, password, and name are required' }, 400);

    const { data, error } = await supabase.auth.admin.createUser({
      email, password, user_metadata: { name, phone, isProvider }, email_confirm: true
    });

    if (error) {
      if (error.message?.includes('already been registered') || error.code === 'email_exists')
        return c.json({ error: 'Este correo electr\u00f3nico ya est\u00e1 registrado. Por favor, inicia sesi\u00f3n o usa otro correo.' }, 409);
      if (error.message?.includes('Password should be at least'))
        return c.json({ error: 'La contrase\u00f1a debe tener al menos 6 caracteres' }, 400);
      return c.json({ error: error.message || 'Error al crear la cuenta' }, 400);
    }

    const user = {
      id: data.user.id, email: data.user.email, name, phone: phone || '',
      createdAt: new Date().toISOString(), isProvider: isProvider || false,
      role: email === 'admin@memorialo.com' ? 'admin' : (isProvider ? 'provider' : 'user'), banned: false
    };
    await kv.set(`user:${data.user.id}`, user);
    return c.json({ user, message: 'User created successfully' });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Error al crear la cuenta. Por favor, intenta de nuevo.' }, 500);
  }
});

app.post(`${P}/auth/init-admin`, async (c) => {
  try {
    const adminEmail = 'admin@memorialo.com';
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail, password: 'admin123',
      user_metadata: { name: 'Administrador Principal' }, email_confirm: true
    });

    let userId;
    if (error) {
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        const { data: users } = await supabase.auth.admin.listUsers();
        const admin = users.users.find(u => u.email === adminEmail);
        if (!admin) return c.json({ error: 'Admin not found' }, 500);
        userId = admin.id;
      } else return c.json({ error: error.message }, 400);
    } else userId = data.user.id;

    const adminUser = {
      id: userId, email: adminEmail, name: 'Administrador Principal',
      phone: '+58-424-1234567', whatsappNumber: '+58-424-1234567',
      createdAt: new Date('2024-01-01').toISOString(),
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      isProvider: false, role: 'admin', banned: false
    };
    await kv.set(`user:${userId}`, adminUser);
    return c.json({ success: true, message: 'Admin initialized', user: adminUser });
  } catch (error) {
    console.log('Init admin error:', error);
    return c.json({ error: 'Failed to initialize admin user' }, 500);
  }
});

app.get(`${P}/auth/session`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ user: null });
  const userData = await kv.get(`user:${auth.user.id}`);
  return c.json({ user: userData, accessToken: auth.accessToken });
});

app.post(`${P}/auth/ensure-user`, async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const existing = await kv.get(`user:${auth.user.id}`);
    if (existing) return c.json(existing);

    const meta = auth.user.user_metadata || {};
    const email = auth.user.email || meta.email || '';
    const newUser = {
      id: auth.user.id, email,
      name: meta.name || meta.full_name || meta.preferred_username || email.split('@')[0] || 'Usuario',
      phone: meta.phone || '', avatar: meta.avatar_url || meta.picture || '',
      createdAt: new Date().toISOString(), isProvider: false, role: 'user' as const, banned: false,
    };
    await kv.set(`user:${auth.user.id}`, newUser);
    return c.json(newUser);
  } catch (error) {
    console.log('ensure-user error:', error);
    return c.json({ error: 'Failed to ensure user record' }, 500);
  }
});

// ==================== USERS ====================

app.get(`${P}/users/:id`, async (c) => {
  try {
    const user = await kv.get(`user:${c.req.param('id')}`);
    if (!user) return c.json({ error: 'User not found' }, 404);
    if (user.banned) return c.json({ error: 'User is banned', reason: user.bannedReason }, 403);
    if (user.archived) return c.json({ error: 'User account is archived' }, 403);
    return c.json(user);
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

app.put(`${P}/users/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const userId = c.req.param('id');
    if (auth.user.id !== userId) return c.json({ error: 'Forbidden' }, 403);
    const updates = await c.req.json();
    const cur = await kv.get(`user:${userId}`);
    if (!cur) return c.json({ error: 'User not found' }, 404);
    const updated = { ...cur, ...updates };
    await kv.set(`user:${userId}`, updated);
    return c.json(updated);
  } catch (error) {
    console.log('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ==================== PROVIDERS ====================

app.post(`${P}/providers`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const d = await c.req.json();
    const provider = {
      id: `provider-${Date.now()}`, userId: auth.user.id, ...d,
      verified: false, createdAt: new Date().toISOString(), services: [], totalBookings: 0, rating: 5
    };
    await kv.set(`provider:${provider.id}`, provider);
    const user = await kv.get(`user:${auth.user.id}`);
    if (user) { user.isProvider = true; user.providerId = provider.id; await kv.set(`user:${auth.user.id}`, user); }
    return c.json(provider);
  } catch (error) {
    console.log('Create provider error:', error);
    return c.json({ error: 'Failed to create provider' }, 500);
  }
});

app.get(`${P}/providers`, async (c) => {
  try { return c.json(await kv.getByPrefix('provider:')); }
  catch (error) { console.log('Get providers error:', error); return c.json({ error: 'Failed to get providers' }, 500); }
});

app.get(`${P}/providers/user/:userId`, async (c) => {
  try {
    const userId = c.req.param('userId');
    const providers = await kv.getByPrefix('provider:');
    const provider = providers.find((p: any) => p.userId === userId);
    if (provider) return c.json(provider);

    const user = await kv.get(`user:${userId}`);
    if (!user?.isProvider) return c.json(null);

    const np = {
      id: user.providerId || `provider-${Date.now()}`, userId: user.id,
      businessName: user.name || 'Mi Negocio', category: 'general', description: '',
      verified: false, createdAt: new Date().toISOString(), services: [], totalBookings: 0, rating: 5
    };
    await kv.set(`provider:${np.id}`, np);
    if (!user.providerId || user.providerId !== np.id) {
      user.providerId = np.id; await kv.set(`user:${userId}`, user);
    }
    return c.json(np);
  } catch (error) {
    console.log('Get provider by userId error:', error);
    return c.json({ error: 'Failed to get provider' }, 500);
  }
});

app.put(`${P}/providers/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const cur = await kv.get(`provider:${id}`);
    if (!cur) return c.json({ error: 'Provider not found' }, 404);
    if (cur.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = { ...cur, ...updates };
    await kv.set(`provider:${id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.log('Update provider error:', error);
    return c.json({ error: 'Failed to update provider' }, 500);
  }
});

// ==================== SERVICES ====================

app.post(`${P}/services`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const d = await c.req.json();
    const svc = { ...d, id: d.id || `service-${Date.now()}`, createdAt: new Date().toISOString(), userId: auth.user.id };
    await kv.set(`service:${svc.id}`, svc);
    return c.json(svc);
  } catch (error) { console.log('Create service error:', error); return c.json({ error: 'Failed to create service' }, 500); }
});

app.get(`${P}/services`, async (c) => {
  try { return c.json(await kv.getByPrefix('service:')); }
  catch (error) { console.log('Get services error:', error); return c.json({ error: 'Failed to get services' }, 500); }
});

app.put(`${P}/services/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id'); const updates = await c.req.json();
    const cur = await kv.get(`service:${id}`);
    if (!cur) return c.json({ error: 'Service not found' }, 404);
    if (cur.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = { ...cur, ...updates };
    await kv.set(`service:${id}`, updated);
    return c.json(updated);
  } catch (error) { console.log('Update service error:', error); return c.json({ error: 'Failed to update service' }, 500); }
});

app.delete(`${P}/services/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id');
    const svc = await kv.get(`service:${id}`);
    if (!svc) return c.json({ error: 'Service not found' }, 404);
    if (svc.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);
    await kv.del(`service:${id}`);
    return c.json({ message: 'Service deleted' });
  } catch (error) { console.log('Delete service error:', error); return c.json({ error: 'Failed to delete service' }, 500); }
});

// ==================== CONTRACTS ====================

app.post(`${P}/contracts`, async (c) => {
  try {
    const d = await c.req.json();
    const contract = { ...d, id: d.id || `contract-${Date.now()}`, createdAt: new Date().toISOString() };
    await kv.set(`contract:${contract.id}`, contract);
    return c.json(contract);
  } catch (error) { console.log('Create contract error:', error); return c.json({ error: 'Failed to create contract' }, 500); }
});

app.get(`${P}/contracts`, async (c) => {
  try { return c.json(await kv.getByPrefix('contract:')); }
  catch (error) { console.log('Get contracts error:', error); return c.json({ error: 'Failed to get contracts' }, 500); }
});

app.put(`${P}/contracts/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id'); const updates = await c.req.json();
    const cur = await kv.get(`contract:${id}`);
    if (!cur) return c.json({ error: 'Contract not found' }, 404);
    const updated = { ...cur, ...updates };
    await kv.set(`contract:${id}`, updated);

    // Update bookingsCompleted on completion
    if (updates.status === 'completed' && cur.status !== 'completed') {
      const svc = await kv.get(`service:${cur.artistId}`);
      if (svc) { svc.bookingsCompleted = (svc.bookingsCompleted || 0) + 1; await kv.set(`service:${cur.artistId}`, svc); }
      updated.completedAt = new Date().toISOString();
      await kv.set(`contract:${id}`, updated);
    }
    return c.json(updated);
  } catch (error) { console.log('Update contract error:', error); return c.json({ error: 'Failed to update contract' }, 500); }
});

// ==================== REVIEWS ====================

app.post(`${P}/reviews`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized. You must be logged in to create a review.' }, 401);
  try {
    const d = await c.req.json();
    const review = { ...d, id: d.id || `review-${Date.now()}`, userId: auth.user.id, createdAt: new Date().toISOString() };
    await kv.set(`review:${review.id}`, review);
    return c.json(review);
  } catch (error) { console.log('Create review error:', error); return c.json({ error: 'Failed to create review' }, 500); }
});

app.get(`${P}/reviews`, async (c) => {
  try { return c.json(await kv.getByPrefix('review:')); }
  catch (error) { console.log('Get reviews error:', error); return c.json({ error: 'Failed to get reviews' }, 500); }
});

// ==================== BOOKINGS ====================

app.post(`${P}/bookings`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  try {
    const d = await c.req.json();
    const booking = { ...d, id: d.id || `booking-${Date.now()}`, userId: auth?.user.id || d.userId, createdAt: new Date().toISOString() };
    await kv.set(`booking:${booking.id}`, booking);
    return c.json(booking);
  } catch (error) { console.log('Create booking error:', error); return c.json({ error: 'Failed to create booking' }, 500); }
});

app.get(`${P}/bookings`, async (c) => {
  try { return c.json(await kv.getByPrefix('booking:')); }
  catch (error) { console.log('Get bookings error:', error); return c.json({ error: 'Failed to get bookings' }, 500); }
});

app.put(`${P}/bookings/:id`, async (c) => {
  try {
    const id = c.req.param('id'); const updates = await c.req.json();
    const cur = await kv.get(`booking:${id}`);
    if (!cur) return c.json({ error: 'Booking not found' }, 404);
    const updated = { ...cur, ...updates };
    await kv.set(`booking:${id}`, updated);
    return c.json(updated);
  } catch (error) { console.log('Update booking error:', error); return c.json({ error: 'Failed to update booking' }, 500); }
});

// ==================== IMAGE UPLOAD ====================

app.post(`${P}/upload-image`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { imageData, fileName, contentType } = await c.req.json();
    if (!imageData || !fileName) return c.json({ error: 'Image data and filename are required' }, 400);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const bin = atob(base64Data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const ext = fileName.split('.').pop();
    const uniqueName = `${auth.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: upErr } = await supabase.storage.from(IMAGES_BUCKET).upload(uniqueName, bytes, { contentType: contentType || 'image/jpeg', upsert: false });
    if (upErr) return c.json({ error: `Upload failed: ${upErr.message}` }, 500);

    const { data: urlData, error: urlErr } = await supabase.storage.from(IMAGES_BUCKET).createSignedUrl(uniqueName, 315360000);
    if (urlErr) return c.json({ error: 'Failed to generate image URL' }, 500);

    return c.json({ url: urlData.signedUrl, path: uniqueName });
  } catch (error) { console.log('Image upload error:', error); return c.json({ error: 'Failed to upload image' }, 500); }
});

// ==================== NOTIFICATIONS ====================

app.post(`${P}/notifications/booking-created`, async (c) => {
  try {
    const d = await c.req.json();
    if (!d.artistEmail) return c.json({ error: 'Artist email is required' }, 400);
    console.log(`[EMAIL] New booking notification to ${d.artistEmail} for ${d.serviceName}`);
    return c.json({ success: true });
  } catch (error) { return c.json({ error: 'Failed to send notification' }, 500); }
});

app.post(`${P}/notifications/contract-signed`, async (c) => {
  try {
    const d = await c.req.json();
    if (!d.recipientEmail) return c.json({ error: 'Recipient email is required' }, 400);
    console.log(`[EMAIL] Contract signed notification to ${d.recipientEmail}`);
    return c.json({ success: true });
  } catch (error) { return c.json({ error: 'Failed to send notification' }, 500); }
});

// ==================== EVENTS ====================

app.post(`${P}/events`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const d = await c.req.json();
    const ev = { ...d, id: d.id || `event-${Date.now()}`, userId: auth.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`event:${ev.id}`, ev);
    return c.json(ev);
  } catch (error) { console.log('Create event error:', error); return c.json({ error: 'Failed to create event' }, 500); }
});

app.get(`${P}/events`, async (c) => {
  try { return c.json(await kv.getByPrefix('event:')); }
  catch (error) { console.log('Get events error:', error); return c.json({ error: 'Failed to get events' }, 500); }
});

app.put(`${P}/events/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id'); const updates = await c.req.json();
    const cur = await kv.get(`event:${id}`);
    if (!cur) return c.json({ error: 'Event not found' }, 404);
    if (cur.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`event:${id}`, updated);
    return c.json(updated);
  } catch (error) { console.log('Update event error:', error); return c.json({ error: 'Failed to update event' }, 500); }
});

app.delete(`${P}/events/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const id = c.req.param('id');
    const ev = await kv.get(`event:${id}`);
    if (!ev) return c.json({ error: 'Event not found' }, 404);
    if (ev.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);
    await kv.del(`event:${id}`);
    return c.json({ message: 'Event deleted' });
  } catch (error) { console.log('Delete event error:', error); return c.json({ error: 'Failed to delete event' }, 500); }
});

// ==================== BILLING ====================

app.get(`${P}/billing/config`, (c) => c.json({ commissionRate: COMMISSION_RATE }));

app.get(`${P}/billing/provider/:providerId`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const providerId = c.req.param('providerId');
    const provider = await kv.get(`provider:${providerId}`);
    if (!provider) return c.json({ error: 'Provider not found' }, 404);
    if (provider.userId !== auth.user.id) { if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403); }

    const allInvoices = await kv.getByPrefix(`billing:invoice:${providerId}:`);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const allServices = await kv.getByPrefix('service:');
    const svcIds = new Set(allServices.filter((s: any) => s.userId === provider.userId).map((s: any) => s.id));
    const allContracts = await kv.getByPrefix('contract:');
    const completed = allContracts.filter((ct: any) => svcIds.has(ct.artistId) && ct.status === 'completed' && (ct.completedAt || ct.createdAt || '').startsWith(currentMonth));

    const totalSales = completed.reduce((s: number, ct: any) => s + (ct.terms?.price || 0), 0);
    const stored = allInvoices.find((inv: any) => inv.month === currentMonth);

    const currentInvoice = {
      id: `billing:invoice:${providerId}:${currentMonth}`, providerId, month: currentMonth,
      commissionRate: COMMISSION_RATE,
      completedContracts: completed.map((ct: any) => ({ contractId: ct.id, clientName: ct.clientName, serviceName: ct.artistName, price: ct.terms?.price || 0, completedAt: ct.completedAt || ct.createdAt })),
      totalSales, commissionAmount: totalSales * COMMISSION_RATE,
      status: stored?.status || (totalSales > 0 ? 'pending' : 'empty'),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(),
      gracePeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 20).toISOString(),
      paidAt: stored?.paidAt, paymentReference: stored?.paymentReference,
      generatedAt: stored?.generatedAt || now.toISOString()
    };

    const history = allInvoices.filter((inv: any) => inv.month !== currentMonth).sort((a: any, b: any) => b.month.localeCompare(a.month));
    return c.json({ currentInvoice, history, commissionRate: COMMISSION_RATE });
  } catch (error) { console.log('Get billing error:', error); return c.json({ error: 'Failed to get billing data' }, 500); }
});

app.post(`${P}/billing/provider/:providerId/pay`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const providerId = c.req.param('providerId');
    const { month, paymentReference, amount } = await c.req.json();
    if (!month) return c.json({ error: 'Month is required' }, 400);
    const provider = await kv.get(`provider:${providerId}`);
    if (!provider) return c.json({ error: 'Provider not found' }, 404);
    if (provider.userId !== auth.user.id) return c.json({ error: 'Forbidden' }, 403);

    const key = `billing:invoice:${providerId}:${month}`;
    const existing = await kv.get(key);
    const invoice = { ...(existing || {}), id: key, providerId, month, commissionRate: COMMISSION_RATE, amount, status: 'paid', paidAt: new Date().toISOString(), paymentReference: paymentReference || `PAY-${Date.now()}`, generatedAt: existing?.generatedAt || new Date().toISOString() };
    await kv.set(key, invoice);
    return c.json({ success: true, invoice });
  } catch (error) { console.log('Record payment error:', error); return c.json({ error: 'Failed to record payment' }, 500); }
});

app.get(`${P}/billing/admin/overview`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const now = new Date();
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const all = await kv.getByPrefix('billing:invoice:');
    const cur = all.filter((i: any) => i.month === cm);
    return c.json({
      currentMonth: cm, invoices: cur,
      totalPending: cur.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + (i.commissionAmount || i.amount || 0), 0),
      totalCollected: cur.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.commissionAmount || i.amount || 0), 0)
    });
  } catch (error) { console.log('Billing admin overview error:', error); return c.json({ error: 'Failed to get billing overview' }, 500); }
});

// ==================== ADMIN ====================

app.get(`${P}/admin/users`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden - Admin access required' }, 403);
  try { return c.json(await kv.getByPrefix('user:')); }
  catch (error) { console.log('Get all users error:', error); return c.json({ error: 'Failed to get users' }, 500); }
});

app.post(`${P}/admin/providers/:id/verify`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const p = await kv.get(`provider:${id}`);
    if (!p) return c.json({ error: 'Provider not found' }, 404);
    const updated = { ...p, verified: true, verifiedAt: new Date().toISOString(), verifiedBy: auth.user.id };
    await kv.set(`provider:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to verify provider' }, 500); }
});

app.post(`${P}/admin/providers/:id/ban`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id'); const { reason } = await c.req.json();
    if (!reason) return c.json({ error: 'Ban reason is required' }, 400);
    const p = await kv.get(`provider:${id}`);
    if (!p) return c.json({ error: 'Provider not found' }, 404);
    const updated = { ...p, banned: true, bannedAt: new Date().toISOString(), bannedBy: auth.user.id, bannedReason: reason };
    await kv.set(`provider:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to ban provider' }, 500); }
});

app.post(`${P}/admin/providers/:id/unban`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const p = await kv.get(`provider:${id}`);
    if (!p) return c.json({ error: 'Provider not found' }, 404);
    const updated = { ...p, banned: false, bannedAt: undefined, bannedBy: undefined, bannedReason: undefined, unbannedAt: new Date().toISOString(), unbannedBy: auth.user.id };
    await kv.set(`provider:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to unban provider' }, 500); }
});

// Admin user management (ban/unban/archive/unarchive/delete)
app.post(`${P}/admin/users/:id/ban`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id'); const { reason } = await c.req.json();
    if (!reason) return c.json({ error: 'Reason required' }, 400);
    const u = await kv.get(`user:${id}`);
    if (!u) return c.json({ error: 'User not found' }, 404);
    const updated = { ...u, banned: true, bannedAt: new Date().toISOString(), bannedBy: auth.user.id, bannedReason: reason };
    await kv.set(`user:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to ban user' }, 500); }
});

app.post(`${P}/admin/users/:id/unban`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const u = await kv.get(`user:${id}`);
    if (!u) return c.json({ error: 'User not found' }, 404);
    const updated = { ...u, banned: false, bannedAt: undefined, bannedBy: undefined, bannedReason: undefined, unbannedAt: new Date().toISOString(), unbannedBy: auth.user.id };
    await kv.set(`user:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to unban user' }, 500); }
});

app.post(`${P}/admin/users/:id/archive`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const u = await kv.get(`user:${id}`);
    if (!u) return c.json({ error: 'User not found' }, 404);
    if (u.role === 'admin') return c.json({ error: 'Cannot archive admin users' }, 400);
    const updated = { ...u, archived: true, archivedAt: new Date().toISOString(), archivedBy: auth.user.id };
    await kv.set(`user:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to archive user' }, 500); }
});

app.post(`${P}/admin/users/:id/unarchive`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const u = await kv.get(`user:${id}`);
    if (!u) return c.json({ error: 'User not found' }, 404);
    const updated = { ...u, archived: false, archivedAt: undefined, archivedBy: undefined, unarchivedAt: new Date().toISOString(), unarchivedBy: auth.user.id };
    await kv.set(`user:${id}`, updated);
    return c.json(updated);
  } catch (error) { return c.json({ error: 'Failed to unarchive user' }, 500); }
});

app.delete(`${P}/admin/users/:id`, async (c) => {
  const auth = await verifyAuth(c.req.header('Authorization'));
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await verifyAdmin(auth))) return c.json({ error: 'Forbidden' }, 403);
  try {
    const id = c.req.param('id');
    const u = await kv.get(`user:${id}`);
    if (!u) return c.json({ error: 'User not found' }, 404);
    if (u.role === 'admin') return c.json({ error: 'Cannot delete admin users' }, 400);

    try { await supabase.auth.admin.deleteUser(id); } catch {}
    await kv.del(`user:${id}`);
    if (u.isProvider && u.providerId) await kv.del(`provider:${u.providerId}`);

    // Clean up related data
    const svcs = (await kv.getByPrefix('service:')).filter((s: any) => s.userId === id);
    for (const s of svcs) await kv.del(`service:${s.id}`);
    const bks = (await kv.getByPrefix('booking:')).filter((b: any) => b.userId === id);
    for (const b of bks) await kv.del(`booking:${b.id}`);

    return c.json({ success: true, message: 'User deleted' });
  } catch (error) { console.log('Delete user error:', error); return c.json({ error: 'Failed to delete user' }, 500); }
});

// ==================== SEO ====================

app.get(`${P}/robots.txt`, (c) => {
  const url = c.req.header('origin') || 'https://memorialo.com';
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /mi-negocio\nDisallow: /mi-panel\n\nSitemap: ${url}${P}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
});

app.get(`${P}/sitemap.xml`, async (c) => {
  try {
    const url = c.req.header('origin') || 'https://memorialo.com';
    const now = new Date().toISOString().split('T')[0];
    const pages = ['/', '/nosotros', '/como-funciona', '/para-proveedores', '/para-clientes', '/terminos', '/privacidad'];
    let svcs: any[] = [];
    try { svcs = await kv.getByPrefix('service:'); } catch {}

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const p of pages) xml += `  <url><loc>${url}${p}</loc><lastmod>${now}</lastmod></url>\n`;
    for (const s of svcs) xml += `  <url><loc>${url}/servicio/${s.id}</loc><lastmod>${(s.updatedAt || now).split('T')[0]}</lastmod></url>\n`;
    xml += `</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch (error) { return c.json({ error: 'Failed to generate sitemap' }, 500); }
});

Deno.serve(app.fetch);
