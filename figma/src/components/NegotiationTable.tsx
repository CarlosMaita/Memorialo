import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, User, Building2, Calendar, MapPin, DollarSign,
  Clock, Send, Paperclip, FileText, X, ChevronLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ChatConversation, ChatMessage, User as UserType } from '../types';

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
  ) => Promise<ChatMessage>;
  markChatConversationRead: (conversationId: string) => Promise<{ unreadCount: number; readCount: number }>;
  subscribeChatStream: (
    onEvent: (payload: { type: string; message?: ChatMessage }) => void,
    onError?: (error: Error) => void,
  ) => () => void;
};

interface NegotiationParty {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
  avatar?: string;
}

interface NegotiationBooking {
  id: string;
  date?: string;
  startTime?: string;
  location?: string;
  totalPrice?: number;
  eventType?: string;
  specialRequests?: string;
  planName?: string;
  artistName?: string;
  clientName?: string;
  status?: string;
}

interface NegotiationTableProps {
  user: UserType;
  booking: NegotiationBooking;
  counterparty: NegotiationParty;
  viewerRole: 'client' | 'provider';
  api: ChatApi;
  onBack?: () => void;
  onContractAction?: () => void;
  contractStatus?: string;
}

export function NegotiationTable({
  user,
  booking,
  counterparty,
  viewerRole,
  api,
  onBack,
  onContractAction,
  contractStatus,
}: NegotiationTableProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, [booking.id]);

  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = api.subscribeChatStream((payload) => {
      if (payload.type === 'chat.message.created' && payload.message) {
        const msg = payload.message;
        if (msg.conversationId === conversation.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
      }
    });

    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadConversation = async () => {
    setLoadingConversation(true);
    try {
      const conv = await api.ensureChatConversation({
        bookingId: booking.id,
        clientUserId: viewerRole === 'client' ? user.id : counterparty.userId,
        providerUserId: viewerRole === 'provider' ? user.id : counterparty.userId,
      });
      setConversation(conv);

      const msgs = await api.getChatMessages(conv.id);
      setMessages(msgs);

      await api.markChatConversationRead(conv.id);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    const body = newMessage.trim();
    setNewMessage('');

    try {
      const sent = await api.sendChatMessage(conversation.id, body);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(body);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    en_negociacion: { label: 'En negociación', color: 'bg-yellow-100 text-yellow-800' },
    pending_client: { label: 'Contrato enviado', color: 'bg-blue-100 text-blue-800' },
    esperando_pago: { label: 'Esperando pago', color: 'bg-green-100 text-green-800' },
    active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
    completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  };

  const currentStatus = contractStatus || booking.status || 'en_negociacion';
  const statusInfo = statusLabel[currentStatus] || { label: currentStatus, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[#1B2A47] truncate">Mesa de Negociación</h2>
          <p className="text-xs text-gray-500 truncate">
            {viewerRole === 'client' ? booking.artistName : booking.clientName}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {(currentStatus === 'en_negociacion' || currentStatus === 'pending_client') && onContractAction && viewerRole === 'provider' && (
          <Button size="sm" onClick={onContractAction} className="shrink-0 bg-[#1B2A47] hover:bg-[#1B2A47]/90">
            <FileText className="w-4 h-4 mr-1" />
            Enviar contrato
          </Button>
        )}
        {currentStatus === 'pending_client' && onContractAction && viewerRole === 'client' && (
          <Button size="sm" onClick={onContractAction} className="shrink-0 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#1B2A47]">
            <FileText className="w-4 h-4 mr-1" />
            Ver contrato
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Counterparty Info */}
        <div className="w-72 shrink-0 border-r bg-gray-50 overflow-y-auto hidden md:block">
          <div className="p-4 space-y-4">
            {/* Counterparty card */}
            <div className="bg-white rounded-lg p-4 border space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[#1B2A47] text-white text-sm">
                    {getInitials(counterparty.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-[#1B2A47]">{counterparty.name}</p>
                  {counterparty.businessName && (
                    <p className="text-xs text-gray-500">{counterparty.businessName}</p>
                  )}
                  <Badge variant="outline" className="text-xs mt-1">
                    {viewerRole === 'client' ? 'Proveedor' : 'Cliente'}
                  </Badge>
                </div>
              </div>

              {counterparty.email && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{counterparty.email}</span>
                </div>
              )}

              {counterparty.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MessageCircle className="w-3 h-3 shrink-0" />
                  <span>{counterparty.phone}</span>
                </div>
              )}
            </div>

            {/* Booking details */}
            <div className="bg-white rounded-lg p-4 border space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalles de la solicitud</h3>

              {booking.date && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{booking.date}</span>
                  {booking.startTime && <span className="text-gray-400">· {booking.startTime}</span>}
                </div>
              )}

              {booking.location && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{booking.location}</span>
                </div>
              )}

              {booking.totalPrice !== undefined && booking.totalPrice > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>${booking.totalPrice}</span>
                  {booking.planName && <span className="text-gray-400">· {booking.planName}</span>}
                </div>
              )}

              {booking.eventType && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="capitalize">{booking.eventType}</span>
                </div>
              )}

              {booking.specialRequests && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-500 font-medium mb-1">Solicitudes especiales</p>
                  <p className="text-xs text-gray-700">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loadingConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Cargando conversación...
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
                    <MessageCircle className="w-8 h-8 opacity-30" />
                    <p>Inicia la conversación para negociar los detalles.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.authorUserId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <Avatar className="h-7 w-7 mr-2 shrink-0 mt-1">
                              <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                                {getInitials(msg.authorName || counterparty.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            {!isMe && (
                              <span className="text-xs text-gray-500 mb-1 ml-1">
                                {msg.authorName || counterparty.name}
                              </span>
                            )}
                            <div
                              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-[#1B2A47] text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                              }`}
                            >
                              {msg.body}
                            </div>
                            <span className="text-xs text-gray-400 mt-0.5 mx-1">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="border-t p-3 bg-white">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje... (Enter para enviar)"
                    rows={2}
                    className="resize-none flex-1 text-sm"
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={() => void handleSend()}
                    disabled={!newMessage.trim() || sending}
                    className="shrink-0 h-9 w-9 bg-[#1B2A47] hover:bg-[#1B2A47]/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
