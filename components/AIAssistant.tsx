'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { getDemoProfile } from '@/lib/demo-engine';

type Position = { left: number; top: number };

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

const BUTTON_SIZE = 52;
const EDGE_PADDING = 12;
const POSITION_STORAGE_KEY = 'easylearn-chat-position';

function clampPosition(position: Position, width: number, height: number): Position {
  return {
    left: Math.max(EDGE_PADDING, Math.min(position.left, width - BUTTON_SIZE - EDGE_PADDING)),
    top: Math.max(EDGE_PADDING, Math.min(position.top, height - BUTTON_SIZE - EDGE_PADDING)),
  };
}

export default function AIAssistant() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    // Determine which profile to use (auth or local demo)
    if (profile) {
      setActiveProfile(profile);
    } else {
      const demoProfile = getDemoProfile();
      if (demoProfile) setActiveProfile(demoProfile);
    }
  }, [profile]);

  useEffect(() => {
    const updateViewport = () => {
      const { innerWidth: width, innerHeight: height } = window;
      setViewport({ width, height });
      setPosition((current) => current
        ? clampPosition(current, width, height)
        : {
            left: Math.max(EDGE_PADDING, width - BUTTON_SIZE - 24),
            top: Math.max(EDGE_PADDING, height - BUTTON_SIZE - 24),
          });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    try {
      const storedPosition = window.localStorage.getItem(POSITION_STORAGE_KEY);
      if (storedPosition) {
        const parsed = JSON.parse(storedPosition);
        if (Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
          setPosition(clampPosition(parsed, window.innerWidth, window.innerHeight));
        }
      }
    } catch (error) {
      console.warn('[Chat] Could not restore assistant position:', error);
    }

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'ai',
          content: t('ai_assistant_welcome'),
        }
      ]);
    }
  }, [isOpen, messages.length, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].slice(-12),
          userContext: { profile: activeProfile },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Le service de discussion est momentanément indisponible.');
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'ai', content: data.reply },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: error instanceof Error
            ? error.message
            : "Désolé, j'ai rencontré un problème. Peux-tu réessayer ?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !position) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: position.left,
      startTop: position.top,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 5) drag.moved = true;
    if (!drag.moved) return;

    setPosition(clampPosition({
      left: drag.startLeft + deltaX,
      top: drag.startTop + deltaY,
    }, window.innerWidth, window.innerHeight));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const finalPosition = clampPosition({
        left: drag.startLeft + event.clientX - drag.startX,
        top: drag.startTop + event.clientY - drag.startY,
      }, window.innerWidth, window.innerHeight);
      setPosition(finalPosition);
      draggedRef.current = true;
      try {
        window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(finalPosition));
      } catch (error) {
        console.warn('[Chat] Could not save assistant position:', error);
      }
    }
    dragRef.current = null;
  };

  const spaceAbove = position ? position.top - EDGE_PADDING : 0;
  const spaceBelow = position && viewport.height
    ? viewport.height - position.top - BUTTON_SIZE - EDGE_PADDING
    : 0;
  const panelVertical = spaceAbove > spaceBelow ? 'above' : 'below';
  const availableVerticalSpace = panelVertical === 'above' ? spaceAbove : spaceBelow;
  const panelHeight = Math.max(120, Math.min(500, availableVerticalSpace - 12));
  const panelWidth = viewport.width ? Math.min(400, viewport.width - EDGE_PADDING * 2) : 400;
  const spaceLeft = position?.left ?? 0;
  const spaceRight = viewport.width && position
    ? viewport.width - position.left - BUTTON_SIZE
    : 0;
  const preferredPanelLeft = position && spaceRight >= spaceLeft
    ? position.left
    : (position?.left ?? 0) + BUTTON_SIZE - panelWidth;
  const panelLeft = viewport.width
    ? Math.max(EDGE_PADDING, Math.min(preferredPanelLeft, viewport.width - panelWidth - EDGE_PADDING))
    : 0;
  const panelTop = position && viewport.height
    ? Math.max(EDGE_PADDING, Math.min(
        panelVertical === 'above' ? position.top - panelHeight - EDGE_PADDING : position.top + BUTTON_SIZE + EDGE_PADDING,
        viewport.height - panelHeight - EDGE_PADDING,
      ))
    : 0;

  const floatingStyle = position
    ? { left: position.left, top: position.top }
    : { right: 24, bottom: 24 };

  return (
    <div className="fixed z-[100]" style={floatingStyle}>
      {/* Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Assistant EasyBot"
          className="absolute flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in duration-200"
          style={{
            width: `${panelWidth}px`,
            height: `${panelHeight}px`,
            left: `${panelLeft - (position?.left ?? 0)}px`,
            top: `${panelTop - (position?.top ?? 0)}px`,
          }}
        >
          {/* Header */}
          <div className="bg-brand-blue text-white p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">EasyBot IA</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  En ligne
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Fermer l'assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" role="log" aria-live="polite" aria-label="Conversation avec EasyBot">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-blue text-white rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.role === 'ai' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-p:text-inherit prose-li:text-inherit">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-card border border-border rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                  Génération en cours...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-background">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                aria-label="Votre question pour EasyBot"
                maxLength={2000}
                className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Envoyer le message"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> Généré par IA - Peut commettre des erreurs
              </span>
            </div>
          </form>
        </div>
      )}

      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          setIsOpen((open) => !open);
        }}
        aria-label={isOpen ? "Fermer l'assistant EasyBot" : "Ouvrir ou déplacer l'assistant EasyBot"}
        title="Faire glisser pour déplacer"
        className="group relative flex h-[52px] w-[52px] touch-none items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!isOpen && (
          <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 whitespace-nowrap">
            Besoin d'aide ?
          </span>
        )}
      </button>
    </div>
  );
}
