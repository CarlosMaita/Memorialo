export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  whatsappNumber?: string; // WhatsApp para comunicación post-contrato
  createdAt: string;
  avatar?: string;
  isProvider: boolean; // If true, user is a service provider
  providerId?: string; // If user is a provider, link to their provider profile
  role?: 'user' | 'provider' | 'admin'; // User role for access control
  banned?: boolean; // If true, user is banned from the platform
  bannedAt?: string; // When the user was banned
  bannedReason?: string; // Reason for the ban
  archived?: boolean; // If true, user is archived (inactive but data preserved)
  archivedAt?: string; // When the user was archived
}