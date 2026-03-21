import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { ChatMessage } from '../types';

interface SessionChatProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  currentUserId: string;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getParticipantColor(name: string): string {
  switch (name) {
    case 'Aniela': return '#6366f1';
    case 'Koné': return '#f59e0b';
    case 'Fatou': return '#10b981';
    default: return '#6b7280';
  }
}

export function SessionChat({ messages, onSend, currentUserId }: SessionChatProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue.trim());
    setInputValue('');
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Discussion ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const color = getParticipantColor(msg.user_name);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  <AvatarFallback
                    className="text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {msg.user_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] ${isMe ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium" style={{ color }}>
                      {msg.user_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 rounded-lg px-3 py-1.5 text-xs inline-block ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Aucun message pour le moment.
            </div>
          )}

          {/* Typing indicator placeholder */}
          <div className="h-4" />
        </div>

        {/* Input */}
        <div className="shrink-0 p-3 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Envoyer un message..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
