import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, MessageCircle, Paperclip, Send, ShieldAlert, X } from 'lucide-react';
import { ChatAttachment, ChatConversation, ChatMessage, User } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
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

interface ChatWidgetProps {
  user: User | null;
  bookings: any[];
  api: ChatApi;
  hideLauncher?: boolean;
}

type PendingAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  imageData: string;
  previewUrl: string;
};

type OpenChatEventDetail = {
  bookingId?: string;
};

const CHAT_WARNING_DISMISSED_STORAGE_KEY = 'memorialo-chat-warning-dismissed';

export function ChatWidget({ user, bookings, api, hideLauncher = false }: ChatWidgetProps) {
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [counterpartOnline, setCounterpartOnline] = useState(false);
  const [showInterventionConfirm, setShowInterventionConfirm] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [dismissedClientWarnings, setDismissedClientWarnings] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const storedValue = window.localStorage.getItem(CHAT_WARNING_DISMISSED_STORAGE_KEY);
      const parsed = storedValue ? JSON.parse(storedValue) : {};
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

  const activeConversation = useMemo(
    () => conversations.find(conversation => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations],
  );

  const activeCounterpart = useMemo(
    () => activeConversation?.participants.find(participant => participant.userId !== user?.id) || null,
    [activeConversation, user?.id],
  );

  const activeCounterpartUserId = useMemo(
    () => activeCounterpart?.userId ? String(activeCounterpart.userId) : null,
    [activeCounterpart],
  );

  const totalUnreadCount = useMemo(
    () => conversations.reduce((sum, conversation) => sum + Math.max(0, Number(conversation.unreadCount || 0)), 0),
    [conversations],
  );

  const activeBooking = useMemo(() => {
    if (!activeConversation?.bookingId) {
      return null;
    }

    return bookings.find(booking => String(booking.id) === String(activeConversation.bookingId)) || null;
  }, [activeConversation?.bookingId, bookings]);

  const activeConversationReference = useMemo(() => {
    const contractId = activeBooking?.contractId ? String(activeBooking.contractId).trim() : '';
    if (contractId) {
      return { label: 'Contrato', code: contractId };
    }

    const bookingId = activeConversation?.bookingId ? String(activeConversation.bookingId).trim() : '';
    if (bookingId) {
      return { label: 'Reserva', code: bookingId };
    }

    return null;
  }, [activeBooking?.contractId, activeConversation?.bookingId]);

  const candidateBookings = useMemo(() => {
    if (!user) return [];

    return bookings.filter(booking => {
      const userIsParticipant = booking.userId === user.id || booking.artistUserId === user.id;
      return userIsParticipant && booking.status !== 'cancelled';
    });
  }, [bookings, user]);

  const escalationAudienceLabel = user?.isProvider ? 'cliente' : 'proveedor';
  const escalationDescription = `Usa esta opcion solo cuando necesites mediacion con el ${escalationAudienceLabel}: conflicto, incumplimiento, falta de respuesta importante o lenguaje inapropiado. Para coordinar detalles normales del servicio, sigue usando el chat. Al confirmar, notificaremos al administrador para revisar el caso.`;

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    return () => {
      if (hydrateMessagesTimeoutRef.current !== null) {
        window.clearTimeout(hydrateMessagesTimeoutRef.current);
      }

      if (typingResetTimeoutRef.current !== null) {
        window.clearTimeout(typingResetTimeoutRef.current);
      }

      if (typingStopDebounceRef.current !== null) {
        window.clearTimeout(typingStopDebounceRef.current);
      }

      pendingAttachmentsRef.current.forEach(attachment => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  const messageHasAttachments = (message?: Pick<ChatMessage, 'attachments' | 'hasAttachments' | 'attachmentsCount'> | null) => {
    if (!message) {
      return false;
    }

    if ((message.attachments?.length || 0) > 0) {
      return true;
    }

    if ((message.attachmentsCount || 0) > 0) {
      return true;
    }

    return !!message.hasAttachments;
  };

  const clearPendingAttachments = () => {
    setPendingAttachments(previous => {
      previous.forEach(attachment => URL.revokeObjectURL(attachment.previewUrl));
      return [];
    });
  };

  useEffect(() => {
    clearPendingAttachments();
  }, [activeConversationId]);

  useEffect(() => {
    if (!chatWindowOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, chatWindowOpen, activeConversationId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadConversations = async () => {
      setLoading(true);
      try {
        const items = await api.getChatConversations();
        if (!cancelled) {
          setConversations(items);
          setActiveConversationId(previous => previous || items[0]?.id || null);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error(error?.message || 'No se pudo cargar el chat.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [api, chatWindowOpen, conversationListOpen, user]);

  useEffect(() => {
    if (!chatWindowOpen || !activeConversationId || !user) {
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const items = await api.getChatMessages(activeConversationId);
        if (!cancelled) {
          setMessages(items);
          await api.markChatConversationRead(activeConversationId);
          setConversations(prev => prev.map(conversation => conversation.id === activeConversationId ? {
            ...conversation,
            unreadCount: 0,
          } : conversation));
        }
      } catch {
        if (!cancelled) {
          console.error('No se pudieron cargar los mensajes.');
        }
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, api, chatWindowOpen, user]);

  useEffect(() => {
    if (!chatWindowOpen || !activeConversationId || !user) {
      return;
    }

    const realtime = api.subscribeChatConversationSignals(activeConversationId, {
      onPresenceChange: (onlineUserIds) => {
        if (!activeCounterpartUserId) {
          setCounterpartOnline(false);
          return;
        }

        setCounterpartOnline(onlineUserIds.includes(activeCounterpartUserId));
      },
      onTyping: (payload) => {
        if (payload.conversationId !== activeConversationId) {
          return;
        }

        if (payload.userId === String(user.id)) {
          return;
        }

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
      onError: (error) => {
        console.error(error.message || 'No se pudieron sincronizar señales del chat.');
      },
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
  }, [activeConversationId, activeCounterpartUserId, api, chatWindowOpen, user]);

  useEffect(() => {
    if (!chatWindowOpen || !activeConversationId || !user || submitting) {
      return;
    }

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
  }, [activeConversationId, chatWindowOpen, draft, submitting, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = api.subscribeChatStream((payload) => {
      if (payload.type !== 'chat.message.created' || !payload.message) {
        return;
      }

      const message = payload.message;
      const shouldHydrateAttachments =
        message.conversationId === activeConversationId &&
        messageHasAttachments(message) &&
        (message.attachments?.length || 0) === 0;

      setConversations(prev => prev.map(conversation => {
        if (conversation.id !== message.conversationId) {
          return conversation;
        }

        const shouldIncreaseUnread = activeConversationId !== conversation.id && message.authorUserId !== user.id;

        return {
          ...conversation,
          lastMessageAt: message.createdAt,
          lastMessage: {
            id: message.id,
            authorUserId: message.authorUserId,
            authorName: message.authorName,
            body: message.body || (messageHasAttachments(message) ? 'Imagen compartida' : ''),
            createdAt: message.createdAt,
            attachments: message.attachments,
            attachmentsCount: message.attachmentsCount,
            hasAttachments: message.hasAttachments,
          },
          unreadCount: shouldIncreaseUnread ? (conversation.unreadCount + 1) : conversation.unreadCount,
        };
      }));

      if (message.conversationId === activeConversationId) {
        setMessages(prev => {
          const exists = prev.some(item => item.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }

      if (shouldHydrateAttachments && hydrateMessagesTimeoutRef.current === null) {
        hydrateMessagesTimeoutRef.current = window.setTimeout(() => {
          hydrateMessagesTimeoutRef.current = null;

          if (!activeConversationId) {
            return;
          }

          void api.getChatMessages(activeConversationId)
            .then(items => {
              setMessages(items);
            })
            .catch(() => {
              // Keep optimistic stream state if hydration fails.
            });
        }, 250);
      }
    });

    return () => unsubscribe();
  }, [activeConversationId, api, chatWindowOpen, conversationListOpen, user]);

  const handleCreateFromBooking = async () => {
    if (candidateBookings.length === 0) {
      console.log('No hay reservas disponibles para abrir chat.');
      return;
    }

    try {
      const booking = candidateBookings[0];
      const created = await api.ensureChatConversation({ bookingId: booking.id });

      setConversations(prev => {
        const alreadyExists = prev.some(conversation => conversation.id === created.id);
        return alreadyExists ? prev : [created, ...prev];
      });
      setActiveConversationId(created.id);
      setConversationListOpen(false);
      setChatWindowOpen(true);
    } catch (error: any) {
      console.error(error?.message || 'No se pudo crear la conversacion.');
    }
  };

  const ensureAndOpenConversationByBooking = async (bookingId: string) => {
    try {
      const created = await api.ensureChatConversation({ bookingId });

      setConversations(prev => {
        const exists = prev.some(conversation => conversation.id === created.id);

        if (exists) {
          return prev;
        }

        return [created, ...prev];
      });

      setActiveConversationId(created.id);
      setConversationListOpen(false);
      setChatWindowOpen(true);
    } catch (error: any) {
      console.error(error?.message || 'No se pudo abrir la conversacion del chat.');
    }
  };

  useEffect(() => {
    const handleOpenChatEvent = (event: Event) => {
      const customEvent = event as CustomEvent<OpenChatEventDetail>;
      const bookingId = customEvent.detail?.bookingId;

      if (!user || !bookingId) {
        return;
      }

      void ensureAndOpenConversationByBooking(bookingId);
    };

    window.addEventListener('memorialo:open-chat', handleOpenChatEvent);

    return () => {
      window.removeEventListener('memorialo:open-chat', handleOpenChatEvent);
    };
  }, [api, user]);

  const handleOpenConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setConversationListOpen(false);
    setChatWindowOpen(true);
  };

  const handleOpenLinkedReservation = () => {
    const bookingId = activeConversation?.bookingId ? String(activeConversation.bookingId) : null;
    const contractId = activeBooking?.contractId ? String(activeBooking.contractId) : null;

    if (!bookingId && !contractId) {
      return;
    }

    window.dispatchEvent(new CustomEvent('memorialo:open-booking', {
      detail: {
        bookingId,
        contractId,
      },
    }));
  };

  const handleToggleConversationList = () => {
    setConversationListOpen(previous => !previous);
  };

  const handleCloseChatWindow = () => {
    setChatWindowOpen(false);
    clearPendingAttachments();
  };

  const handleSend = async () => {
    if (!activeConversationId || submitting || (!draft.trim() && pendingAttachments.length === 0)) {
      return;
    }

    const draftToSend = draft.trim();
    const attachmentsToSend = pendingAttachments.map(attachment => ({
      imageData: attachment.imageData,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      previewUrl: attachment.previewUrl,
    }));
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      conversationId: activeConversationId,
      authorUserId: String(user.id),
      authorName: user.name,
      body: draftToSend,
      createdAt: new Date().toISOString(),
      attachments: attachmentsToSend.map((attachment, index) => ({
        id: `${optimisticId}-att-${index}`,
        fileName: attachment.fileName,
        mimeType: attachment.contentType,
        sizeBytes: 0,
        url: attachment.previewUrl,
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
      const sent = await api.sendChatMessage(
        activeConversationId,
        draftToSend,
        attachmentsToSend.map(attachment => ({
          imageData: attachment.imageData,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
        })),
      );

      setMessages(prev => {
        const withoutOptimistic = prev.filter(message => message.id !== optimisticId);
        const hasSent = withoutOptimistic.some(message => message.id === sent.id);
        return hasSent ? withoutOptimistic : [...withoutOptimistic, sent];
      });
      setConversations(prev => prev.map(conversation => conversation.id === activeConversationId ? {
        ...conversation,
        lastMessageAt: sent.createdAt,
        lastMessage: {
          id: sent.id,
          authorUserId: sent.authorUserId,
          authorName: sent.authorName,
          body: sent.body || (messageHasAttachments(sent) ? 'Imagen compartida' : ''),
          createdAt: sent.createdAt,
          attachments: sent.attachments,
          attachmentsCount: sent.attachmentsCount,
          hasAttachments: sent.hasAttachments,
        },
      } : conversation));
      clearPendingAttachments();
    } catch (error: any) {
      setMessages(prev => prev.filter(message => message.id !== optimisticId));
      setDraft(draftToSend);
      console.error(error?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];

    if (files.length === 0) {
      return;
    }

    try {
      const availableSlots = Math.max(0, 5 - pendingAttachments.length);
      const filesToAdd = files.slice(0, availableSlots);

      const nextAttachments = await Promise.all(filesToAdd.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('Solo se permiten imagenes en el chat.');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Cada imagen debe pesar 5MB o menos.');
        }

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

      setPendingAttachments(previous => [...previous, ...nextAttachments]);
    } catch (error: any) {
      console.error(error?.message || 'No se pudieron preparar las imagenes.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemovePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(previous => {
      const attachment = previous.find(item => item.id === attachmentId);
      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return previous.filter(item => item.id !== attachmentId);
    });
  };

  const handleRequestIntervention = async () => {
    if (!activeConversationId) {
      return;
    }

    try {
      await api.requestChatIntervention(activeConversationId);
      setConversations(prev => prev.map(conversation => conversation.id === activeConversationId ? {
        ...conversation,
        requiresAdminIntervention: true,
      } : conversation));
    } catch (error: any) {
      console.error(error?.message || 'No se pudo solicitar intervencion.');
    }
  };

  const renderAttachments = (attachments?: ChatAttachment[], mine?: boolean) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block overflow-hidden rounded-lg border ${mine ? 'border-white/20' : 'border-gray-200'} bg-white/5`}
          >
            <img src={attachment.url} alt={attachment.fileName} className="h-28 w-full object-cover" />
          </a>
        ))}
      </div>
    );
  };

  const getInitials = (name?: string) => {
    const normalized = String(name || 'U').trim();
    const parts = normalized.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(part => part[0]?.toUpperCase() || '').join('') || 'U';
  };

  if (!user) {
    return null;
  }

  const activeConversationHasHistory = Boolean(
    activeConversation?.lastMessageAt ||
    activeConversation?.lastMessage?.body ||
    messageHasAttachments(activeConversation?.lastMessage ?? null),
  );

  const shouldShowClientAgreementWarning = Boolean(
    chatWindowOpen &&
    activeConversation &&
    !user.isProvider &&
    !activeConversationHasHistory &&
    messages.length === 0 &&
    !dismissedClientWarnings[activeConversation.id],
  );

  const handleDismissClientWarning = () => {
    if (!activeConversation) {
      return;
    }

    setDismissedClientWarnings(previous => {
      const next = {
        ...previous,
        [activeConversation.id]: true,
      };

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(CHAT_WARNING_DISMISSED_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage write failures and keep the warning dismissed for this session.
        }
      }

      return next;
    });
  };

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div className="flex flex-col items-end gap-3">
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

        {chatWindowOpen && activeConversation && (
          <Card className="z-50 flex h-[540px] w-[360px] max-w-[92vw] flex-col shadow-2xl border-[#1B2A47]/20">
            <CardHeader className="border-b px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex flex-1 items-center gap-2.5">
                  <Avatar className="size-8 border border-slate-200">
                    <AvatarImage src={undefined} alt={activeCounterpart?.name || 'Usuario'} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                      {getInitials(activeCounterpart?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="max-w-full truncate text-[15px] leading-none text-[#1B2A47]">
                        {activeCounterpart?.name || 'Conversacion'}
                      </CardTitle>
                      {activeConversationReference && (
                        <button
                          type="button"
                          onClick={handleOpenLinkedReservation}
                          className="max-w-full rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-[#1B2A47] transition hover:bg-slate-200"
                          title="Abrir reserva vinculada"
                        >
                          <span className="block max-w-[180px] truncate">
                            {activeConversationReference.label}: {activeConversationReference.code}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!activeConversation.requiresAdminIntervention && (
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
                  <Button variant="ghost" size="icon" onClick={handleCloseChatWindow} aria-label="Cerrar chat" className="h-8 w-8 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="min-h-[16px] pl-[42px]">
                  {activeCounterpartUserId && (
                    <p className={`text-[11px] ${counterpartTyping ? 'text-[#1B2A47] font-medium' : 'text-gray-500'}`}>
                      {counterpartTyping ? 'Escribiendo...' : (counterpartOnline ? 'En linea' : 'Desconectado')}
                    </p>
                  )}
                  {activeConversation.expiresAt && (
                    <p className="text-[11px] text-gray-500">
                      Chat e imagenes disponibles hasta {new Date(activeConversation.expiresAt).toLocaleDateString('es-VE')}
                    </p>
                  )}
                  {activeConversation.requiresAdminIntervention && (
                    <p className="flex items-center gap-1 text-[11px] text-amber-700">
                      <ShieldAlert className="w-3 h-3" /> Intervencion activa
                    </p>
                  )}
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              {shouldShowClientAgreementWarning && (
                <div className="px-3 pt-3">
                  <Alert className="border-amber-300 bg-amber-50 pr-10 text-amber-950 [&>svg]:text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-amber-900">
                      <p className="font-medium">Usa este canal para establecer todos los acuerdos del servicio.</p>
                      <p>Este chat sera la fuente unica de garantia en caso de controversia.</p>
                    </AlertDescription>
                    <button
                      type="button"
                      onClick={handleDismissClientWarning}
                      aria-label="Cerrar advertencia del chat"
                      className="absolute right-2 top-2 rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Alert>
                </div>
              )}

              <ScrollArea className={`min-h-0 flex-1 px-3 py-3 ${shouldShowClientAgreementWarning ? 'pt-2' : ''}`}>
                <div className="space-y-2">
                  {messages.map(message => {
                    const mine = message.authorUserId === user.id;

                    return (
                      <div key={message.id} className={`flex min-w-0 ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] overflow-hidden rounded-xl px-3 py-2 text-sm ${mine ? 'bg-[#1B2A47] text-white' : 'bg-gray-100 text-gray-800'}`}>
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

                  {messages.length === 0 && (
                    <p className="text-sm text-gray-500">Aun no hay mensajes en esta conversacion.</p>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3 space-y-3 bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handleFileSelection(event);
                  }}
                />
                {pendingAttachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {pendingAttachments.map((attachment) => (
                      <div key={attachment.id} className="relative overflow-hidden rounded-lg border border-gray-200">
                        <img src={attachment.previewUrl} alt={attachment.fileName} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePendingAttachment(attachment.id)}
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
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={submitting}
                  className="min-h-[86px] max-h-[160px] resize-none"
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
                    disabled={submitting || (!draft.trim() && pendingAttachments.length === 0)}
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
            </CardContent>
          </Card>
        )}

        {conversationListOpen && (
          <Card className="w-[340px] max-w-[92vw] max-h-[420px] overflow-hidden shadow-2xl border-[#1B2A47]/20">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-[15px] leading-none text-[#1B2A47]">Conversaciones</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setConversationListOpen(false)} aria-label="Cerrar listado" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                <div className="p-2 space-y-1">
                  {loading && <p className="px-2 py-3 text-xs text-gray-500">Cargando...</p>}
                  {!loading && conversations.length === 0 && (
                    <p className="px-2 py-3 text-xs text-gray-500">No hay conversaciones.</p>
                  )}

                  {conversations.map(conversation => {
                    const isActive = conversation.id === activeConversationId;
                    const counterpart = conversation.participants.find(participant => participant.userId !== user.id);

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleOpenConversation(conversation.id)}
                        className={`w-full overflow-hidden rounded-xl px-3 py-3 text-left transition ${isActive ? 'bg-[#1B2A47] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex flex-1 items-center gap-3">
                            <Avatar className="size-10 shrink-0 border border-slate-200/80">
                              <AvatarImage src={undefined} alt={counterpart?.name || 'Usuario'} />
                              <AvatarFallback className={`${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'} text-xs font-semibold`}>
                                {getInitials(counterpart?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="block w-full truncate text-sm font-semibold">{counterpart?.name || 'Conversacion'}</div>
                              <div className={`mt-1 block w-full overflow-hidden text-xs leading-5 [overflow-wrap:anywhere] ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                                {conversation.lastMessage?.body || 'Sin mensajes'}
                              </div>
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="shrink-0 bg-[#D4AF37] text-[#1B2A47] text-[10px]">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              {candidateBookings.length > 0 && conversations.length === 0 && (
                <div className="border-t p-3">
                  <Button onClick={handleCreateFromBooking} variant="outline" className="w-full bg-white">
                    Abrir chat disponible
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!chatWindowOpen && !hideLauncher && (
          <Button
            onClick={handleToggleConversationList}
            aria-label="Abrir chat"
            className="h-14 w-14 rounded-full bg-[#1B2A47] p-0 text-white shadow-lg hover:bg-[#2d4270]"
          >
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadCount > 0 && (
                <>
                  <span className="absolute -right-0.5 -top-0.5 flex size-3.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37]/70" />
                    <span className="relative inline-flex size-3.5 rounded-full border-2 border-[#1B2A47] bg-[#D4AF37]" />
                  </span>
                  <span className="sr-only">
                    {`Tienes ${totalUnreadCount} mensaje${totalUnreadCount === 1 ? '' : 's'} sin leer`}
                  </span>
                </>
              )}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
