import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Paperclip,
  Send,
  Smile,
  Users,
  X,
} from 'lucide-react';
import type { TicketDetail, TicketMessage } from '../types';

interface TicketDetailDrawerProps {
  ticket: TicketDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  isSending: boolean;
  onClose: () => void;
  onSendMessage: (payload: {
    content: string;
    inlineImageBase64?: string;
  }) => Promise<void>;
}

const STATUS_BADGES = {
  OPEN: {
    label: 'Open',
    className: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/10',
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'text-purple-300 border-purple-400/40 bg-purple-500/10',
    icon: Clock,
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
    icon: Clock,
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
    icon: CheckCircle,
  },
  CLOSED: {
    label: 'Closed',
    className: 'text-slate-300 border-slate-400/40 bg-slate-500/10',
    icon: CheckCircle,
  },
} as const;

const PRIORITY_BADGES = {
  LOW: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
  MEDIUM: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  HIGH: 'text-orange-300 border-orange-400/40 bg-orange-500/10',
  CRITICAL: 'text-red-300 border-red-400/40 bg-red-500/10',
} as const;

const presenceColor = {
  online: 'bg-emerald-400',
  away: 'bg-amber-400',
  offline: 'bg-slate-500',
} as const;

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  isOpen,
  isLoading,
  isSending,
  onClose,
  onSendMessage,
}) => {
  const [message, setMessage] = useState('');
  const [inlineImage, setInlineImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setInlineImage(null);
    }
  }, [isOpen, ticket?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setInlineImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if ((!message || !message.trim()) && !inlineImage) {
      return;
    }
    try {
      await onSendMessage({
        content: message.trim(),
        inlineImageBase64: inlineImage ?? undefined,
      });
      setMessage('');
      setInlineImage(null);
    } catch (error) {
      // The parent component is expected to handle toast/error feedback.
    }
  }, [inlineImage, message, onSendMessage]);

  const renderMessageStatusIcon = useCallback((status: TicketMessage['status']) => {
    switch (status) {
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-cyan-400" />;
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'SENT':
      default:
        return <Check className="h-3 w-3 text-gray-500" />;
    }
  }, []);

  const headerBadges = useMemo(() => {
    if (!ticket) {
      return null;
    }
    const statusBadge = STATUS_BADGES[ticket.status];
    const StatusIcon = statusBadge.icon;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-light text-white">
          Ticket #{ticket.id}
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${statusBadge.className}`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusBadge.label}
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${PRIORITY_BADGES[ticket.priority]}`}
        >
          {ticket.priority}
        </span>
      </div>
    );
  }, [ticket]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800/50 bg-gray-800/30 px-6 py-4">
          {ticket && headerBadges}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-800/50 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/30 border-t-transparent" />
              </div>
            )}

            {!isLoading && ticket && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-light text-white">
                    {ticket.subject}
                  </h3>
                  <p className="mt-2 text-gray-400">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-800/50 bg-gray-800/30 p-4">
                    <div className="mb-2 text-sm text-gray-400">Assignee</div>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-sm font-medium text-gray-900">
                          {ticket.assignee.avatarUrl ? (
                            <img
                              src={ticket.assignee.avatarUrl}
                              alt={ticket.assignee.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            ticket.assignee.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-white">
                            {ticket.assignee.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.assignee.role ?? 'Assignee'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Unassigned</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-800/50 bg-gray-800/30 p-4">
                    <div className="mb-2 text-sm text-gray-400">Reporter</div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-medium text-gray-900">
                        {ticket.reporter.avatarUrl ? (
                          <img
                            src={ticket.reporter.avatarUrl}
                            alt={ticket.reporter.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          ticket.reporter.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-white">
                          {ticket.reporter.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.reporter.role ?? 'Reporter'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-800/50 bg-gray-800/30 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      Created At
                    </div>
                    <div className="text-sm text-white">
                      {formatDateTime(ticket.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-800/50 bg-gray-800/30 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      Last Updated
                    </div>
                    <div className="text-sm text-white">
                      {formatDateTime(ticket.updatedAt)}
                    </div>
                  </div>
                </div>

                {ticket.tags.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm text-gray-400">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-gray-700/50 bg-gray-800/30 px-3 py-1 text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.attachments.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm text-gray-400">Attachments</div>
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 rounded-xl border border-gray-800/50 bg-gray-800/40 p-3 transition-colors duration-200 hover:bg-gray-800/60"
                        >
                          <Paperclip className="h-5 w-5 text-cyan-300" />
                          <div className="flex-1">
                            <div className="text-sm text-white">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attachment.sizeLabel}
                            </div>
                          </div>
                          {attachment.url && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.timeline.length > 0 && (
                  <div>
                    <div className="mb-4 text-sm text-gray-400">
                      Activity Timeline
                    </div>
                    <div className="space-y-4">
                      {ticket.timeline.map((event) => {
                        let icon = <Clock className="h-4 w-4 text-cyan-300" />;
                        if (event.icon === 'CREATED') {
                          icon = <CheckCircle className="h-4 w-4 text-cyan-300" />;
                        } else if (event.icon === 'ASSIGNEE') {
                          icon = <Users className="h-4 w-4 text-purple-300" />;
                        } else if (event.icon === 'STATUS') {
                          icon = <AlertCircle className="h-4 w-4 text-amber-300" />;
                        }

                        return (
                          <div key={event.id} className="flex gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10">
                              {icon}
                            </div>
                            <div>
                              <div className="text-sm text-white">
                                {event.label}
                              </div>
                              {event.description && (
                                <div className="text-xs text-gray-400">
                                  {event.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {formatDateTime(event.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex h-full w-full max-w-md flex-col border-l border-gray-800/50 bg-gray-900/40">
            <div className="flex items-center justify-between border-b border-gray-800/50 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-white">Discussion</div>
                <div className="text-xs text-gray-500">Collaborate in real-time</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Users className="h-4 w-4" />
                {ticket?.participants.length ?? 0} people
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              {ticket && ticket.participants.length > 0 && (
                <div className="border-b border-gray-800/50 px-5 py-4">
                  <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">
                    Participants
                  </div>
                  <div className="space-y-3">
                    {ticket.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/70 text-sm font-medium text-white">
                          {participant.avatarUrl ? (
                            <img
                              src={participant.avatarUrl}
                              alt={participant.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            participant.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 ${presenceColor[participant.presence]}`}
                          />
                        </div>
                        <div>
                          <div className="text-sm text-white">
                            {participant.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {participant.role ?? participant.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {ticket?.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-xs font-medium text-gray-900">
                      {msg.author.avatarUrl ? (
                        <img
                          src={msg.author.avatarUrl}
                          alt={msg.author.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        msg.author.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {msg.author.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(msg.createdAt)}
                        </span>
                        {renderMessageStatusIcon(msg.status)}
                      </div>
                      <div className="mt-2 rounded-xl rounded-tl-none border border-gray-800/50 bg-gray-800/60 p-3 text-sm text-gray-200">
                        {msg.imagePreviewUrl && (
                          <img
                            src={msg.imagePreviewUrl}
                            alt="Message attachment"
                            className="mb-3 max-h-48 w-full rounded-lg object-cover"
                          />
                        )}
                        <p className="whitespace-pre-line">{msg.content}</p>
                        {msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-2 rounded-lg border border-gray-700/40 bg-gray-800/40 px-3 py-2 text-xs text-gray-300"
                              >
                                <Paperclip className="h-3.5 w-3.5 text-cyan-300" />
                                <span>{attachment.name}</span>
                                <span className="text-gray-500">
                                  {attachment.sizeLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {inlineImage && (
                <div className="border-t border-gray-800/50 px-5 pb-2">
                  <div className="relative inline-block">
                    <img
                      src={inlineImage}
                      alt="Preview"
                      className="max-h-24 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setInlineImage(null)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors duration-200 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-800/50 bg-gray-900/40 px-5 py-4">
                <div className="flex items-end gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-gray-800/50 bg-gray-800/60 p-3 text-gray-300 transition-colors duration-200 hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-gray-800/50 bg-gray-800/60 p-3 text-gray-300 transition-colors duration-200 hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <div className="relative flex-1">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSubmit().catch(() => undefined);
                        }
                      }}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full resize-none rounded-xl border border-gray-700/50 bg-gray-800/60 px-4 py-3 text-sm text-white placeholder-gray-500 transition-all duration-200 focus:border-cyan-400/40 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmit().catch(() => undefined)}
                    disabled={
                      isSending || (!message.trim() && !inlineImage)
                    }
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 p-3 text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Press Enter to send, Shift + Enter for a new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailDrawer;
