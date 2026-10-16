'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Paperclip,
  Maximize2,
  Trash2,
  Settings,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Database,
  Layers,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: any[];
  images?: string[];
  provider?: string;
  model?: string;
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'openai' | 'anthropic' | 'gemini'>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.1-8b-instant');
  const [useRag, setUseRag] = useState(true);
  const [attachedImage, setAttachedImage] = useState<{ name: string; mimeType: string; base64: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am your **TaskTracker AI Copilot** powered by **Groq** and live **RAG** (Retrieval Augmented Generation).\n\nI have real-time visibility into all your tasks, deadlines, employee assignments, and workload metrics.\n\nAsk me anything or pick a quick prompt below:`,
      timestamp: new Date(),
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available models mapping
  const modelsByProvider: Record<string, { id: string; label: string; vision?: boolean }[]> = {
    groq: [
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Ultra-fast & Default)' },
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
      { id: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 Vision (Multimodal)', vision: true },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
    openai: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', vision: true },
      { id: 'gpt-4o', label: 'GPT-4o (Omni)', vision: true },
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', vision: true },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', vision: true },
    ],
    gemini: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', vision: true },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', vision: true },
    ],
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // When provider changes, select its default model
  const handleProviderChange = (provider: 'groq' | 'openai' | 'anthropic' | 'gemini') => {
    setSelectedProvider(provider);
    const available = modelsByProvider[provider];
    if (available && available.length > 0) {
      setSelectedModel(available[0].id);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    // Auto-switch to vision model if current model doesn't support vision
    const currentModelObj = modelsByProvider[selectedProvider]?.find((m) => m.id === selectedModel);
    if (!currentModelObj?.vision) {
      const visionModel = modelsByProvider[selectedProvider]?.find((m) => m.vision);
      if (visionModel) {
        setSelectedModel(visionModel.id);
        toast(`Switched to ${visionModel.label} for image support`, { icon: '👁️' });
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachedImage({
        name: file.name,
        mimeType: file.type,
        base64,
      });
      toast.success(`Image "${file.name}" attached`);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() && !attachedImage) return;

    const userMsgId = 'usr_' + Date.now();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date(),
      images: attachedImage ? [attachedImage.base64] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImg = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Get user client API keys from localStorage if any
      let apiKeyOverride = '';
      try {
        const stored = localStorage.getItem('tasktracker_llm_keys');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[selectedProvider]) {
            apiKeyOverride = parsed[selectedProvider];
          }
        }
      } catch (e) {
        console.error(e);
      }

      // Build conversation history
      const formattedHistory = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      formattedHistory.push({
        role: 'user',
        content: query,
      });

      const payload: any = {
        messages: formattedHistory,
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKeyOverride || undefined,
        useRag,
      };

      if (currentImg) {
        payload.images = [
          {
            name: currentImg.name,
            mimeType: currentImg.mimeType,
            base64Data: currentImg.base64,
          },
        ];
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const assistantMsg: Message = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        sources: data.sources || [],
        provider: data.provider,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      toast.error(error.message || 'Error communicating with AI');
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Error:** ${error.message}\n\n*Tip:* Check that your **${selectedProvider.toUpperCase()}** API key is set in **Settings** (click ⚙️ top right) or added to \`.env\`.`,
          timestamp: new Date(),
          provider: selectedProvider,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (confirm('Clear current chat conversation?')) {
      setMessages([
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: `Chat cleared. Ready for your next query!`,
          timestamp: new Date(),
          provider: selectedProvider,
          model: selectedModel,
        },
      ]);
      toast.success('Conversation reset');
    }
  };

  const quickPrompts = [
    '🚨 What tasks are currently overdue?',
    '📊 Summarize team workload and employee status',
    '⚡ List all HIGH priority tasks',
    '💡 Recommend priority actions for tomorrow',
  ];

  return (
    <>
      {/* Floating Trigger Button (Always visible on bottom-right of dashboard) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center space-x-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-3 rounded-full shadow-[0_0_25px_rgba(79,70,229,0.45)] hover:shadow-[0_0_35px_rgba(79,70,229,0.7)] transition-all duration-300 hover:scale-105"
            title="Open TaskTracker AI Assistant"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping"></span>
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:inline">AI Copilot</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
              {selectedProvider}
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[460px] max-w-[95vw] h-[640px] max-h-[88vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="relative p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Bot className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-slate-950"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  TaskTracker Copilot
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                    RAG Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>{selectedProvider.toUpperCase()}</span>
                  <span>•</span>
                  <span className="truncate max-w-[140px] font-mono text-slate-300">
                    {selectedModel}
                  </span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Model & Key Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Link
                href="/dashboard/ai-assistant"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Open Fullscreen Studio"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Minimize Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Header: Quick Provider & Model Picker */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-1.5 flex-1 overflow-x-auto">
              {(['groq', 'openai', 'anthropic', 'gemini'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => handleProviderChange(prov)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition uppercase tracking-wider',
                    selectedProvider === prov
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  )}
                >
                  {prov}
                  {prov === 'groq' && <span className="ml-1 text-[9px] text-blue-200">★</span>}
                </button>
              ))}
            </div>

            {/* Model Dropdown */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 text-slate-300 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-mono"
            >
              {modelsByProvider[selectedProvider]?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {isAssistant && (
                      <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg shrink-0 mt-0.5 border border-indigo-500/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={clsx(
                        'rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm break-words',
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs'
                      )}
                    >
                      {/* Attached images preview */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {msg.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Attached multimodal input"
                              className="w-28 h-28 object-cover rounded-lg border border-white/20 shadow-sm"
                            />
                          ))}
                        </div>
                      )}

                      {/* Content with basic markdown rendering */}
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px]">
                        {msg.content}
                      </div>

                      {/* RAG Sources Accordion */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/50">
                          <button
                            onClick={() =>
                              setExpandedSources((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="flex items-center space-x-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <Database className="w-3 h-3" />
                            <span>
                              {expandedSources[msg.id]
                                ? 'Hide Grounded Sources'
                                : `View ${msg.sources.length} Grounded Sources`}
                            </span>
                            {expandedSources[msg.id] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {expandedSources[msg.id] && (
                            <div className="mt-2 space-y-1.5 text-[10px] animate-in fade-in duration-150">
                              {msg.sources.map((src: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-700/40 text-slate-300"
                                >
                                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                                    <span className="truncate">{src.title}</span>
                                    <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-400">
                                      {src.type}
                                    </span>
                                  </div>
                                  {src.subtitle && (
                                    <p className="text-slate-400 text-[10px] mt-0.5">{src.subtitle}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Footer */}
                      <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-70">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isAssistant && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              className="hover:text-white transition"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {msg.provider && (
                              <span className="font-mono uppercase">{msg.provider}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="p-1.5 bg-blue-600/30 text-blue-300 rounded-lg shrink-0 mt-0.5 border border-blue-500/30">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg shrink-0 border border-indigo-500/20">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-slate-800/90 rounded-2xl rounded-tl-xs border border-slate-700/60 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {selectedProvider.toUpperCase()} is analyzing tasks & workload...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (when only welcome message is present or user wants ideas) */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
              <p className="text-[10px] text-slate-400 mb-1.5 font-medium">Quick Starters:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="text-[11px] bg-slate-800/80 hover:bg-blue-600/20 hover:text-blue-300 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={attachedImage.base64}
                  alt="Thumbnail"
                  className="w-10 h-10 object-cover rounded-md border border-slate-700"
                />
                <div className="text-xs">
                  <p className="text-slate-200 font-medium truncate max-w-[200px]">
                    {attachedImage.name}
                  </p>
                  <p className="text-[10px] text-purple-400">Multimodal Vision Active</p>
                </div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Box Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            {/* Hidden File Input for Multimodal Images */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex items-end space-x-2">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition shrink-0"
                title="Attach Image (Multimodal Vision)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* RAG Toggle */}
              <button
                type="button"
                onClick={() => {
                  setUseRag(!useRag);
                  toast(useRag ? 'RAG context disabled' : 'RAG context enabled', {
                    icon: useRag ? '⚪' : '🟢',
                  });
                }}
                className={clsx(
                  'p-2.5 rounded-xl transition shrink-0 text-xs flex items-center space-x-1',
                  useRag
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/50'
                    : 'text-slate-500 hover:text-slate-400 bg-slate-900'
                )}
                title={useRag ? 'RAG Active (Database Tasks & Employees)' : 'RAG Disabled'}
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about tasks, deadlines, employees..."
                  rows={1}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none max-h-24 transition"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key & Provider Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeysUpdated={() => {
          toast.success('Model settings updated');
        }}
      />
    </>
  );
}
