import { useState, useMemo, useEffect, useRef, type ChangeEvent } from 'react';
import {
  ArrowLeft, AlertTriangle, Paperclip, Send, X, ShieldAlert,
  Calendar, Clock, MapPin, DollarSign, FileText, Search, MessageCircle, ChevronRight
} from 'lucide-react';
import { ChatConversation, ChatMessage, ChatAttachment, User } from '../types';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ConfirmDialog } from './ConfirmDialog';

type ChatApi = {
  getChatConversations: () => Promise<ChatConversation[]>;
  ensureChatConversation: (payload: {
    bookingId?: string;
    serviceId?: string;
    clientUserId?: string;
    providerUserId?: string;
  }) => Promise<ChatConversation>;
  getChatMessages: (conversationId: string) => Promise<ChatMessage[]>;
  sendChatMessage: (
    conversationId: string,
    body: string,
    attachments?: Array<{ imageData: string; fileName: string; contentType: string }>
  ) => Promise<ChatMessage>;
  markChatConversationRead: (conversationId: string) => Promise<{ unreadCount: number; readCount: number }>;
  requestChatIntervention: (conversationId: string) => Promise<{ requiresAdminIntervention: boolean }>;
  subscribeChatStream: (
    onEvent: (payload: { type: string; message?: ChatMessage }) => void,
    onError?: (error: Error) => void,
  ) => () => void;
  subscribeChatConversationSignals: (
    conversationId: string,
    handlers: {
      onPresenceChange?: (onlineUserIds: string[]) => void;
      onTyping?: (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
      onError?: (error: Error) => void;
    },
  ) => {
    sendTyping: (isTyping: boolean) => void;
    unsubscribe: () => void;
  };
};

type PendingAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  imageData: string;
  previewUrl: string;
};

const CHAT_WARNING_DISMISSED_STORAGE_KEY = 'memorialo-chat-warning-dismissed';

interface ProviderNegotiationPageProps {
  contracts: any[];
  bookings: any[];
  activeContractId: string | null;
  user: User;
  onNavigateToContract: (contractId: string) => void;
  onBack: () => void;
  chatApi: ChatApi;
}

function getInitials(name?: string): string {
  const normalized = String(name || 'U').trim();
  const parts = normalized.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map(part => part[0]?.toUpperCase() || '').join('') || 'U';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'en_negociacion': return 'En negociación';
    case 'pending_client': return 'Pendiente firma cliente';
    case 'pending_artist': return 'Esperando proveedor';
    case 'active': return 'Confirmado';
    case 'esperando_pago': return 'Esperando pago';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'en_negociacion': return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'pending_client': return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    case 'pending_artist': return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'active': return 'bg-green-50 text-green-700 border-green-300';
    case 'esperando_pago': return 'bg-orange-50 text-orange-700 border-orange-300';
    case 'completed': return 'bg-gray-50 text-gray-700 border-gray-300';
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-300';
    default: return 'bg-gray-50 text-gray-700 border-gray-300';
  }
}

function messageHasAttachments(message?: Pick<ChatMessage, 'attachments' | 'hasAttachments' | 'attachmentsCount'> | null): boolean {
  if (!message) return false;
  if ((message.attachments?.length || 0) > 0) return true;
  if ((message.attachmentsCount || 0) > 0) return true;
  return !!message.hasAttachments;
}

export function ProviderNegotiationPage({
  contracts,
  bookings,
  activeContractId,
  user,
  onNavigateToContract,
  onBack,
  chatApi,
}: ProviderNegotiationPageProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [counterpartOnline, setCounterpartOnline] = useState(false);
  const [showInterventionConfirm, setShowInterventionConfirm] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [contractSearch, setContractSearch] = useState('');
  const [dismissedWarnings, setDismissedWarnings] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem(CHAT_WARNING_DISMISSED_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const hydrateMessagesTimeoutRef = useRef<number | null>(null);
  const typingResetTimeoutRef = useRef<number | null>(null);
  const typingStopDebounceRef = useRef<number | null>(null);
  const typingPublishedRef = useRef(false);
  const sendTypingRef = useRef<(isTyping: boolean) => void>(() => undefined);

  const conversationId = conversation?.id || null;

  // Active contract and its associated booking
  const activeContract = useMemo(
    () => contracts.find(c => c.id === activeContractId) || null,
    [contracts, activeContractId],
  );

  const activeBooking = useMemo(
    () => {
      if (!activeContract?.bookingId) return null;
      return bookings.find(b => String(b.id) === String(activeContract.bookingId)) || null;
    },
    [activeContract, bookings],
  );

  const counterpart = useMemo(
    () => conversation?.participants.find(p => p.userId !== String(user.id)) || null,
    [conversation, user.id],
  );

  const counterpartUserId = counterpart?.userId ? String(counterpart.userId) : null;

  // Active contracts list (non-cancelled, non-completed) for sidebar
  const activeContractsList = useMemo(() => {
    return contracts.filter(c =>
      c.status !== 'cancelled' && c.status !== 'completed'
    );
  }, [contracts]);

  const filteredContractsList = useMemo(() => {
    const q = contractSearch.trim().toLowerCase();
    if (!q) return activeContractsList;
    return activeContractsList.filter(c => {
      return [c.clientName, c.id, c.artistName, c.terms?.serviceDescription]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [activeContractsList, contractSearch]);

  // Load conversation when active contract changes
  useEffect(() => {
    if (!activeBooking?.id) {
      setConversation(null);
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setConversation(null);
    setMessages([]);

    const load = async () => {
      try {
        const conv = await chatApi.ensureChatConversation({ bookingId: activeBooking.id });
        if (!cancelled) setConversation(conv);
      } catch (err) {
        console.error('Error loading conversation:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [activeBooking?.id, chatApi]);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const items = await chatApi.getChatMessages(conversationId);
        if (!cancelled) {
          setMessages(items);
          await chatApi.markChatConversationRead(conversationId);
          setConversation(prev => prev ? { ...prev, unreadCount: 0 } : prev);
        }
      } catch {
        console.error('Error loading messages.');
      }
    };

    void loadMessages();
    return () => { cancelled = true; };
  }, [conversationId, chatApi]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Subscribe to conversation signals
  useEffect(() => {
    if (!conversationId || !counterpartUserId) return;

    const realtime = chatApi.subscribeChatConversationSignals(conversationId, {
      onPresenceChange: (onlineUserIds) => {
        setCounterpartOnline(onlineUserIds.includes(counterpartUserId));
      },
      onTyping: (payload) => {
        if (payload.conversationId !== conversationId) return;
        if (payload.userId === String(user.id)) return;

        setCounterpartTyping(payload.isTyping);

        if (typingResetTimeoutRef.current !== null) {
          window.clearTimeout(typingResetTimeoutRef.current);
          typingResetTimeoutRef.current = null;
        }

        if (payload.isTyping) {
          typingResetTimeoutRef.current = window.setTimeout(() => {
            setCounterpartTyping(false);
            typingResetTimeoutRef.current = null;
          }, 2000);
        }
      },
      onError: (error) => console.error(error.message || 'Chat signal error.'),
    });

    sendTypingRef.current = realtime.sendTyping;

    return () => {
      if (typingResetTimeoutRef.current !== null) {
        window.clearTimeout(typingResetTimeoutRef.current);
        typingResetTimeoutRef.current = null;
      }
      if (typingStopDebounceRef.current !== null) {
        window.clearTimeout(typingStopDebounceRef.current);
        typingStopDebounceRef.current = null;
      }
      realtime.sendTyping(false);
      typingPublishedRef.current = false;
      sendTypingRef.current = () => undefined;
      setCounterpartTyping(false);
      setCounterpartOnline(false);
      realtime.unsubscribe();
    };
  }, [conversationId, counterpartUserId, chatApi, user.id]);

  // Subscribe to global chat stream
  useEffect(() => {
    const unsubscribe = chatApi.subscribeChatStream((payload) => {
      if (payload.type !== 'chat.message.created' || !payload.message) return;

      const message = payload.message;
      const shouldHydrate =
        message.conversationId === conversationId &&
        messageHasAttachments(message) &&
        (message.attachments?.length || 0) === 0;

      if (message.conversationId === conversationId) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          return exists ? prev : [...prev, message];
        });
      }

      if (shouldHydrate && hydrateMessagesTimeoutRef.current === null && conversationId) {
        hydrateMessagesTimeoutRef.current = window.setTimeout(() => {
          hydrateMessagesTimeoutRef.current = null;
          void chatApi.getChatMessages(conversationId)
            .then(items => setMessages(items))
            .catch(() => { /* keep optimistic state */ });
        }, 250);
      }
    });

    return () => unsubscribe();
  }, [conversationId, chatApi]);

  // Typing debounce
  useEffect(() => {
    if (!conversationId || submitting) return;

    const hasText = draft.trim().length > 0;

    if (hasText && !typingPublishedRef.current) {
      sendTypingRef.current(true);
      typingPublishedRef.current = true;
    }
    if (!hasText && typingPublishedRef.current) {
      sendTypingRef.current(false);
      typingPublishedRef.current = false;
    }

    if (typingStopDebounceRef.current !== null) {
      window.clearTimeout(typingStopDebounceRef.current);
      typingStopDebounceRef.current = null;
    }

    if (hasText) {
      typingStopDebounceRef.current = window.setTimeout(() => {
        sendTypingRef.current(false);
        typingPublishedRef.current = false;
        typingStopDebounceRef.current = null;
      }, 1500);
    }
  }, [conversationId, draft, submitting]);

  // Cleanup
  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    return () => {
      if (hydrateMessagesTimeoutRef.current !== null) window.clearTimeout(hydrateMessagesTimeoutRef.current);
      if (typingResetTimeoutRef.current !== null) window.clearTimeout(typingResetTimeoutRef.current);
      if (typingStopDebounceRef.current !== null) window.clearTimeout(typingStopDebounceRef.current);
      pendingAttachmentsRef.current.forEach(a => URL.revokeObjectURL(a.previewUrl));
    };
  }, []);

  const clearPendingAttachments = () => {
    setPendingAttachments(prev => {
      prev.forEach(a => URL.revokeObjectURL(a.previewUrl));
      return [];
    });
  };

  const handleSend = async () => {
    if (!conversationId || submitting || (!draft.trim() && pendingAttachments.length === 0)) return;

    const draftToSend = draft.trim();
    const attachmentsToSend = pendingAttachments.map(a => ({
      imageData: a.imageData,
      fileName: a.fileName,
      contentType: a.contentType,
      previewUrl: a.previewUrl,
    }));
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      conversationId,
      authorUserId: String(user.id),
      authorName: user.name,
      body: draftToSend,
      createdAt: new Date().toISOString(),
      attachments: attachmentsToSend.map((a, i) => ({
        id: `${optimisticId}-att-${i}`,
        fileName: a.fileName,
        mimeType: a.contentType,
        sizeBytes: 0,
        url: a.previewUrl,
      })),
      hasAttachments: attachmentsToSend.length > 0,
      attachmentsCount: attachmentsToSend.length,
    };

    setDraft('');
    sendTypingRef.current(false);
    typingPublishedRef.current = false;
    setMessages(prev => [...prev, optimisticMessage]);
    setSubmitting(true);

    try {
      const sent = await chatApi.sendChatMessage(
        conversationId,
        draftToSend,
        attachmentsToSend.map(a => ({ imageData: a.imageData, fileName: a.fileName, contentType: a.contentType })),
      );

      setMessages(prev => {
        const without = prev.filter(m => m.id !== optimisticId);
        const hasSent = without.some(m => m.id === sent.id);
        return hasSent ? without : [...without, sent];
      });
      clearPendingAttachments();
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setDraft(draftToSend);
      console.error(err?.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length === 0) return;

    try {
      const available = Math.max(0, 5 - pendingAttachments.length);
      const toAdd = files.slice(0, available);

      const next = await Promise.all(toAdd.map(async (file) => {
        if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imagenes.');
        if (file.size > 5 * 1024 * 1024) throw new Error('Cada imagen debe pesar 5MB o menos.');

        const imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        return {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          fileName: file.name,
          contentType: file.type,
          imageData,
          previewUrl: URL.createObjectURL(file),
        };
      }));

      setPendingAttachments(prev => [...prev, ...next]);
    } catch (err: any) {
      console.error(err?.message || 'Error preparing images.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) URL.revokeObjectURL(attachment.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const handleRequestIntervention = async () => {
    if (!conversationId) return;
    try {
      await chatApi.requestChatIntervention(conversationId);
      setConversation(prev => prev ? { ...prev, requiresAdminIntervention: true } : prev);
    } catch (err: any) {
      console.error(err?.message || 'Error requesting intervention.');
    }
  };

  const handleDismissWarning = () => {
    if (!conversationId) return;
    setDismissedWarnings(prev => {
      const next = { ...prev, [conversationId]: true };
      try {
        window.localStorage.setItem(CHAT_WARNING_DISMISSED_STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const renderAttachments = (attachments?: ChatAttachment[], mine?: boolean) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {attachments.map(att => (
          <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
            className={`block overflow-hidden rounded-lg border ${mine ? 'border-white/20' : 'border-gray-200'} bg-white/5`}>
            <img src={att.url} alt={att.fileName} className="h-28 w-full object-cover" />
          </a>
        ))}
      </div>
    );
  };

  const hasHistory = Boolean(
    conversation?.lastMessageAt ||
    conversation?.lastMessage?.body ||
    messageHasAttachments(conversation?.lastMessage ?? null),
  );

  const shouldShowWarning = Boolean(
    conversation &&
    !hasHistory &&
    messages.length === 0 &&
    !dismissedWarnings[conversationId || ''],
  );

  const escalationDescription = 'Usa esta opcion solo cuando necesites mediacion: conflicto, incumplimiento, falta de respuesta importante o lenguaje inapropiado. Para coordinar detalles normales del servicio, sigue usando el chat. Al confirmar, notificaremos al administrador para revisar el caso.';

  // ── Contract/client info panel ─────────────────────────────────────────
  const clientName = activeContract?.clientName || activeBooking?.clientName || activeBooking?.artistName || 'Cliente';
  const clientEmail = activeContract?.clientEmail || '';
  const contractStatus = activeContract?.status || activeBooking?.status || '';
  const contractDate = activeContract?.terms?.date || activeBooking?.date || '';
  const contractStartTime = activeContract?.terms?.startTime || activeBooking?.startTime || '';
  const contractLocation = activeContract?.terms?.location || activeBooking?.location || '';
  const contractPrice = activeContract?.terms?.price || activeBooking?.totalPrice || '';
  const contractDescription = activeContract?.terms?.serviceDescription || '';
  const contractIdDisplay = activeContract?.id || '';

  const ClientInfoPanel = () => (
    <div className="space-y-4">
      {/* Client card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12 border border-slate-200">
              <AvatarFallback className="bg-[#1B2A47] text-white text-sm font-semibold">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-[#1B2A47] text-sm">{clientName}</h3>
              {clientEmail && <p className="text-xs text-gray-500">{clientEmail}</p>}
            </div>
          </div>
          {activeContract?.clientWhatsapp && (
            <p className="text-xs text-gray-600"><span className="font-medium">WhatsApp:</span> {activeContract.clientWhatsapp}</p>
          )}
        </CardContent>
      </Card>

      {/* Service info card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-2">
          <h4 className="font-semibold text-[#1B2A47] text-sm mb-2">Información del servicio contratado</h4>

          {contractIdDisplay && (
            <div className="flex items-start gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Contrato</p>
                <p className="text-gray-700 font-medium truncate">{contractIdDisplay}</p>
              </div>
            </div>
          )}

          {contractStatus && (
            <div className="flex items-start gap-2 text-xs">
              <div className="w-3.5 shrink-0" />
              <Badge variant="outline" className={`${getStatusBadgeClass(contractStatus)} text-xs`}>
                {getStatusLabel(contractStatus)}
              </Badge>
            </div>
          )}

          {contractDate && (
            <div className="flex items-start gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Fecha</p>
                <p className="text-gray-700">
                  {new Date(contractDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {contractStartTime && ` · ${contractStartTime}`}
                </p>
              </div>
            </div>
          )}

          {contractLocation && (
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Ubicación</p>
                <p className="text-gray-700">{contractLocation}</p>
              </div>
            </div>
          )}

          {contractPrice && (
            <div className="flex items-start gap-2 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Total</p>
                <p className="text-gray-700 font-semibold text-green-600">${contractPrice}</p>
              </div>
            </div>
          )}

          {contractDescription && (
            <div className="text-xs mt-2 pt-2 border-t border-slate-100">
              <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Descripción del servicio</p>
              <p className="text-gray-700 line-clamp-4">{contractDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ── Contracts sidebar ──────────────────────────────────────────────────
  const ContractsSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#1B2A47]/10">
        <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-0.5">Negociaciones</h2>
        <p className="text-xs text-gray-500">{activeContractsList.length} contrato{activeContractsList.length !== 1 ? 's' : ''} activo{activeContractsList.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={contractSearch}
            onChange={(e) => setContractSearch(e.target.value)}
            placeholder="Buscar por cliente..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredContractsList.length === 0 && (
            <p className="text-xs text-gray-500 px-2 py-3">
              {activeContractsList.length === 0 ? 'No hay contratos activos.' : 'Sin resultados.'}
            </p>
          )}
          {filteredContractsList.map(contract => {
            const isActive = contract.id === activeContractId;
            const booking = bookings.find(b => String(b.id) === String(contract.bookingId));
            const clientDisplayName = contract.clientName || booking?.clientName || 'Cliente';
            return (
              <button
                key={contract.id}
                onClick={() => onNavigateToContract(contract.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-[#1B2A47] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="size-8 shrink-0 border border-slate-200/60">
                    <AvatarFallback className={`${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'} text-xs font-semibold`}>
                      {getInitials(clientDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{clientDisplayName}</p>
                    <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                      {contract.id?.slice(-12) || ''}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-[10px] px-1.5 py-0 ${isActive ? 'border-white/30 text-white/80' : getStatusBadgeClass(contract.status)}`}
                    >
                      {getStatusLabel(contract.status)}
                    </Badge>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // ── Mobile: list-only view (no active contract) ────────────────────────
  if (!activeContractId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#1B2A47] text-white px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-white hover:text-white hover:bg-white/10"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold">Negociaciones</h1>
            <p className="text-xs text-white/70">{activeContractsList.length} contrato{activeContractsList.length !== 1 ? 's' : ''} activo{activeContractsList.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-white min-h-[calc(100vh-60px)]">
            <ContractsSidebar />
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A47] text-white px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 text-white hover:text-white hover:bg-white/10"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold truncate">Negociación</h1>
          <p className="text-xs text-white/70 truncate">{clientName}</p>
        </div>
        {contractIdDisplay && (
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
            {String(contractIdDisplay).slice(0, 16)}{String(contractIdDisplay).length > 16 ? '…' : ''}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={showInterventionConfirm}
        onOpenChange={setShowInterventionConfirm}
        onConfirm={handleRequestIntervention}
        title="¿Deseas escalar esta conversación?"
        description={escalationDescription}
        confirmText="Sí, escalar"
        cancelText="Volver al chat"
        variant="warning"
      />

      <div className="flex flex-col md:flex-row gap-0 md:gap-4 py-0 md:py-6 md:px-4">

          {/* Left: Contract list (hidden on mobile when viewing a contract) */}
          <div className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-white border-r border-gray-200 md:border md:rounded-xl md:shadow-sm flex-col" style={{ minHeight: 600 }}>
            <ContractsSidebar />
          </div>

          {/* Middle: Chat */}
          <div className="flex-1 min-w-0">
            {/* Mobile: back to list link */}
            <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
              <button
                onClick={() => onNavigateToContract('')}
                className="flex items-center gap-1.5 text-xs text-[#1B2A47] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ver todos los contratos
              </button>
            </div>

            <Card className="shadow-sm flex flex-col md:rounded-xl rounded-none" style={{ minHeight: 560 }}>
              {/* Chat header */}
              <div className="border-b px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex flex-1 items-center gap-2.5">
                    <Avatar className="size-8 border border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                        {getInitials(counterpart?.name || clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1B2A47] truncate">
                        {counterpart?.name || clientName}
                      </p>
                    </div>
                  </div>
                  {conversation && !conversation.requiresAdminIntervention && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setShowInterventionConfirm(true)}
                          className="h-8 w-8 shrink-0"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8} className="max-w-[220px] leading-relaxed">
                        Escalar. Usa esta opcion cuando exista conflicto, incumplimiento o necesites intervencion del administrador.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="min-h-[16px] pl-[42px]">
                  {counterpartUserId && (
                    <p className={`text-[11px] ${counterpartTyping ? 'text-[#1B2A47] font-medium' : 'text-gray-500'}`}>
                      {counterpartTyping ? 'Escribiendo...' : counterpartOnline ? 'En linea' : 'Desconectado'}
                    </p>
                  )}
                  {conversation?.expiresAt && (
                    <p className="text-[11px] text-gray-500">
                      Chat e imagenes disponibles hasta {new Date(conversation.expiresAt).toLocaleDateString('es-VE')}
                    </p>
                  )}
                  {conversation?.requiresAdminIntervention && (
                    <p className="flex items-center gap-1 text-[11px] text-amber-700">
                      <ShieldAlert className="w-3 h-3" /> Intervencion activa
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col min-h-0 p-0">
                {shouldShowWarning && (
                  <div className="px-3 pt-3">
                    <Alert className="border-amber-300 bg-amber-50 pr-10 text-amber-950 [&>svg]:text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-amber-900">
                        <p className="font-medium">Usa este canal para establecer todos los acuerdos del servicio.</p>
                        <p>Este chat sera la fuente unica de garantia en caso de controversia.</p>
                      </AlertDescription>
                      <button
                        type="button"
                        onClick={handleDismissWarning}
                        aria-label="Cerrar advertencia del chat"
                        className="absolute right-2 top-2 rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Alert>
                  </div>
                )}

                <ScrollArea className="flex-1 px-3 py-3" style={{ height: 340 }}>
                  <div className="space-y-2">
                    {loading && (
                      <p className="text-sm text-gray-500 text-center py-4">Cargando conversación...</p>
                    )}
                    {!loading && !activeBooking && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Este contrato no tiene una reserva asociada.
                      </p>
                    )}
                    {!loading && activeBooking && messages.map(message => {
                      const mine = message.authorUserId === String(user.id);
                      return (
                        <div key={message.id} className={`flex min-w-0 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] overflow-hidden rounded-xl px-3 py-2 text-sm ${mine ? 'bg-[#1B2A47] text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {!mine && <p className="mb-1 truncate text-[11px] font-semibold">{message.authorName || 'Usuario'}</p>}
                            {message.body && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.body}</p>}
                            {renderAttachments(message.attachments, mine)}
                            <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                              {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {!loading && activeBooking && messages.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">Aun no hay mensajes en esta conversacion.</p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-3 space-y-3 bg-white">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { void handleFileSelection(e); }}
                  />
                  {pendingAttachments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {pendingAttachments.map(att => (
                        <div key={att.id} className="relative overflow-hidden rounded-lg border border-gray-200">
                          <img src={att.previewUrl} alt={att.fileName} className="h-20 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePendingAttachment(att.id)}
                            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-700 shadow"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Escribe tu mensaje..."
                    disabled={submitting || !conversationId}
                    className="min-h-[80px] max-h-[160px] resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting || pendingAttachments.length >= 5}
                      className="h-11 w-11 shrink-0 rounded-xl px-0"
                      aria-label="Adjuntar imagen"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={submitting || (!draft.trim() && pendingAttachments.length === 0) || !conversationId}
                      className="h-11 flex-1 rounded-xl bg-[#D4AF37] px-0 text-[#1B2A47] hover:bg-[#c59f2f]"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Puedes compartir hasta 5 imagenes por mensaje. El chat y sus imagenes se eliminan 30 dias despues del evento.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Client + Service info */}
          {/* Desktop: shown inline */}
          <div className="hidden md:block w-64 lg:w-72 shrink-0">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#1B2A47] px-1">Cliente</h2>
              <ClientInfoPanel />
            </div>
          </div>

          {/* Mobile: accordion */}
          <div className="md:hidden px-4 py-3 bg-white border-t border-gray-100">
            <Accordion type="single" collapsible>
              <AccordionItem value="info" className="border rounded-xl bg-white shadow-sm">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-[#1B2A47]">
                  Información del cliente
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ClientInfoPanel />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
    </div>
  );
}
