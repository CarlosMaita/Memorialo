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
  artistName: string;
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
