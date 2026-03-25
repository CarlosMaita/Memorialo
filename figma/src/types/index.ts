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
  providerRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  providerRequestedAt?: string;
  providerApprovedAt?: string;
  providerApprovedBy?: string;
  role?: 'user' | 'provider' | 'admin'; // User role for access control
  banned?: boolean; // If true, user is banned from the platform
  bannedAt?: string; // When the user was banned
  bannedReason?: string; // Reason for the ban
  billingSuspendedAt?: string;
  billingSuspensionReason?: string;
  archived?: boolean; // If true, user is archived (inactive but data preserved)
  archivedAt?: string; // When the user was archived
}

export interface ChatParticipant {
  userId: string;
  role: 'client' | 'provider' | 'admin';
  name?: string;
  joinedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorUserId: string;
  authorName?: string;
  body: string;
  createdAt?: string;
  editedAt?: string | null;
  isReadByMe?: boolean;
  readByCount?: number;
  attachments?: ChatAttachment[];
  hasAttachments?: boolean;
  attachmentsCount?: number;
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface ChatConversation {
  id: string;
  bookingId?: string | null;
  serviceId?: string | null;
  clientUserId: string;
  providerUserId: string;
  requiresAdminIntervention: boolean;
  interventionRequestedAt?: string | null;
  interventionRequestedBy?: string | null;
  lastMessageAt?: string | null;
  updatedAt?: string;
  expiresAt?: string | null;
  unreadCount: number;
  participants: ChatParticipant[];
  lastMessage?: {
    id: string;
    authorUserId: string;
    authorName?: string;
    body: string;
    createdAt?: string;
    attachments?: ChatAttachment[];
    hasAttachments?: boolean;
    attachmentsCount?: number;
  } | null;
}

export interface ChatStreamPayload {
  type: string;
  message?: ChatMessage;
}