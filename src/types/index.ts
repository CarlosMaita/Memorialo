export interface ServicePlan {
  id: string;
  name: string;
  price: number;
  duration: number; // in hours
  includes: string[];
  description: string;
  popular?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  location: string;
  bio: string;
  specialties: string[];
  availability: string[];
  portfolio: string[];
  verified: boolean;
  responseTime: string;
  bookingsCompleted: number;
  servicePlans: ServicePlan[];
}

export interface ContractSignature {
  signedBy: string;
  signedAt: string;
  ipAddress?: string;
}

export interface Contract {
  id: string;
  bookingId: string;
  artistId: string;
  artistName: string;
  clientId?: string; // User ID of client
  clientName: string;
  createdAt: string;
  terms: {
    serviceDescription: string;
    price: number;
    duration: number;
    date: string;
    location: string;
    cancellationPolicy: string;
    paymentTerms: string;
    additionalTerms: string[];
  };
  clientSignature?: ContractSignature;
  artistSignature?: ContractSignature;
  status: 'draft' | 'pending_client' | 'pending_artist' | 'signed' | 'cancelled';
}

export interface Booking {
  id: string;
  artistId: string;
  userId?: string; // User who made the booking
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  duration: number;
  eventType: string;
  location: string;
  specialRequests: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  planId?: string;
  planName?: string;
  contractId?: string;
  reviewId?: string; // Link to review if user has left one
}

export interface Service {
  id: string;
  artistId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  avatar?: string;
  isProvider: boolean; // If true, user is a service provider
  providerId?: string; // If user is a provider, link to their provider profile
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description: string;
  verified: boolean;
  createdAt: string;
  services: string[]; // Array of service IDs
  totalBookings: number;
  rating: number;
}

export interface Review {
  id: string;
  bookingId: string;
  artistId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  response?: {
    text: string;
    createdAt: string;
  };
}
