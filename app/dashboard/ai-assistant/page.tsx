'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
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
  FileText,
  Plus,
  RefreshCw,
  Cpu,
  Layers,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import ApiKeySettingsModal from '@/components/ApiKeySettingsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: any[];
  images?: string[];
  provider?: string;
  model?: string;
  usage?: any;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to TaskTracker AI Studio 🚀\n\nI am connected to your live TaskTracker database via **RAG (Retrieval-Augmented Generation)**.\n\n* **Primary LLM:** Groq (Llama 3.3 70B & Llama 3.2 Vision)\n* **Multi-Model Support:** Switch anytime to OpenAI ChatGPT, Anthropic Claude, or Google Gemini.\n* **Knowledge Context:** Real-time tasks, deadlines, employee assignments, and any custom documents you upload in the sidebar.\n\nHow can I help you streamline your projects today?`,
      timestamp: new Date(),
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'openai' | 'anthropic' | 'gemini'>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');
  const [useRag, setUseRag] = useState(true);
  const [attachedImage, setAttachedImage] = useState<{ name: string; mimeType: string; base64: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Custom documents state
  const [customDocs, setCustomDocs] = useState<{ id: string; name: string; content: string }[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Live database stats
  const [liveStats, setLiveStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelsByProvider: Record<string, { id: string; label: string; vision?: boolean }[]> = {
    groq: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Fastest)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { id: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 Vision (Multimodal)', vision: true },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32k context)' },
    ],
    openai: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', vision: true },
      { id: 'gpt-4o', label: 'GPT-4o Omni', vision: true },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', vision: true },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', vision: true },
    ],
    gemini: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', vision: true },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', vision: true },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', vision: true },
    ],
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setLiveStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProviderChange = (provider: 'groq' | 'openai' | 'anthropic' | 'gemini') => {
    setSelectedProvider(provider);
    const available = modelsByProvider[provider];
    if (available && available.length > 0) {
      setSelectedModel(available[0].id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    const currentModelObj = modelsByProvider[selectedProvider]?.find((m) => m.id === selectedModel);
    if (!currentModelObj?.vision) {
      const visionModel = modelsByProvider[selectedProvider]?.find((m) => m.vision);
      if (visionModel) {
        setSelectedModel(visionModel.id);
        toast(`Switched model to ${visionModel.label} for vision`, { icon: '👁️' });
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
      toast.success(`Attached "${file.name}"`);
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

      const formattedHistory = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
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
        customDocs: customDocs.map((d) => `Document "${d.name}":\n${d.content}`),
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
        usage: data.usage,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      toast.error(error.message || 'Error communicating with AI');
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Error:** ${error.message}\n\nPlease check your **${selectedProvider.toUpperCase()}** API key configuration in Settings (gear icon) or in \`.env\`.`,
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
    if (confirm('Clear the entire conversation?')) {
      setMessages([
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: `Conversation reset. Ready for your next inquiry!`,
          timestamp: new Date(),
          provider: selectedProvider,
          model: selectedModel,
        },
      ]);
      toast.success('Chat cleared');
    }
  };

  const addCustomDocument = () => {
    if (!newDocName.trim() || !newDocContent.trim()) {
      toast.error('Please enter a document name and content');
      return;
    }
    const doc = {
      id: 'doc_' + Date.now(),
      name: newDocName.trim(),
      content: newDocContent.trim(),
    };
    setCustomDocs([...customDocs, doc]);
    setNewDocName('');
    setNewDocContent('');
    setIsAddingDoc(false);
    toast.success(`Knowledge document "${doc.name}" indexed for RAG`);
  };

  const promptTemplates = [
    {
      title: '🚨 Overdue Tasks & Blockers',
      prompt: 'Identify all tasks currently overdue or at risk. Detail the assignees, deadlines, and suggest mitigation steps.',
    },
    {
      title: '👥 Employee Workload Balance',
      prompt: 'Analyze the task distribution across all employees. Who is overloaded and who has bandwidth to take on more work?',
    },
    {
      title: '🎯 Weekly Sprint Summary',
      prompt: 'Generate an executive summary of current task progress, completed milestones, and high-priority upcoming items.',
    },
    {
      title: '📝 Draft Task Breakdown',
      prompt: 'Help me draft a clear project breakdown with tasks, priority ratings, and recommended deadlines for our next sprint.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-6 h-6" />
            </span>
            AI Assistant Studio
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              RAG Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multimodal project intelligence with instant Groq inference, OpenAI, Anthropic & Gemini.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium shadow-sm"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Manage API Keys</span>
          </button>
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/40 rounded-xl text-slate-400 hover:text-red-400 transition text-xs font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Knowledge Context, Model Control & Quick Prompts */}
        <div className="lg:col-span-1 space-y-5">
          {/* Multi-Model Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                Active Model
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {selectedProvider}
              </span>
            </div>

            {/* Provider Tabs */}
            <div className="grid grid-cols-2 gap-1.5">
              {(['groq', 'openai', 'anthropic', 'gemini'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => handleProviderChange(prov)}
                  className={clsx(
                    'py-2 px-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition border flex items-center justify-center gap-1',
                    selectedProvider === prov
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  )}
                >
                  <span>{prov}</span>
                  {prov === 'groq' && <span className="text-[10px] text-amber-300">⚡</span>}
                </button>
              ))}
            </div>

            {/* Model Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">Model Variant:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                {modelsByProvider[selectedProvider]?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RAG Switch */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Database RAG</span>
              </div>
              <button
                type="button"
                onClick={() => setUseRag(!useRag)}
                className={clsx(
                  'w-10 h-5 rounded-full transition relative',
                  useRag ? 'bg-emerald-600' : 'bg-slate-800'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                    useRag ? 'left-5' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Quick Prompt Templates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Prompt Templates
            </h3>
            <div className="space-y-2">
              {promptTemplates.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/30 text-xs transition group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-blue-400 transition">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Knowledge Documents (RAG Ingestion) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                Custom Docs ({customDocs.length})
              </h3>
              <button
                onClick={() => setIsAddingDoc(!isAddingDoc)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doc</span>
              </button>
            </div>

            {isAddingDoc && (
              <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/30 space-y-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="Doc title (e.g. Q4 Sprint Goals)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
                <textarea
                  placeholder="Paste document text or notes here..."
                  rows={3}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddingDoc(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomDocument}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium"
                  >
                    Save Doc
                  </button>
                </div>
              </div>
            )}

            {customDocs.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                No custom docs added. Paste company policies or sprint specs to ground the AI alongside live tasks.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {customDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-slate-300 font-medium">{doc.name}</span>
                    <button
                      onClick={() => setCustomDocs(customDocs.filter((d) => d.id !== doc.id))}
                      className="text-slate-500 hover:text-red-400 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Main Chat Studio (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[680px]">
          {/* Chat Stream Header */}
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  AI Dialogue Stream
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {selectedProvider.toUpperCase()} / {selectedModel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time contextual question-answering with automated task grounding
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Engine</span>
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {isAssistant && (
                      <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-500/30">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={clsx(
                        'rounded-2xl px-5 py-4 leading-relaxed shadow-lg break-words text-sm',
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                          : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-xs'
                      )}
                    >
                      {/* Attached images preview */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {msg.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Attached multimodal input"
                              className="w-44 h-44 object-cover rounded-xl border border-white/20 shadow-md"
                            />
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="whitespace-pre-wrap font-sans leading-relaxed">
                        {msg.content}
                      </div>

                      {/* Grounded Sources Accordion */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800">
                          <button
                            onClick={() =>
                              setExpandedSources((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>
                              {expandedSources[msg.id]
                                ? 'Collapse Retrieved Sources'
                                : `View ${msg.sources.length} Grounded Context Sources`}
                            </span>
                            {expandedSources[msg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {expandedSources[msg.id] && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs animate-in fade-in duration-200">
                              {msg.sources.map((src: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-300"
                                >
                                  <div className="font-semibold text-slate-100 flex items-center justify-between">
                                    <span className="truncate">{src.title}</span>
                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                      {src.type}
                                    </span>
                                  </div>
                                  {src.subtitle && (
                                    <p className="text-slate-400 text-xs mt-1">{src.subtitle}</p>
                                  )}
                                  {src.detail && (
                                    <p className="text-slate-500 text-[11px] mt-0.5 font-mono">{src.detail}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3 flex items-center justify-between text-xs opacity-60">
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {isAssistant && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              className="hover:text-white transition flex items-center gap-1"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>Copy</span>
                            </button>
                            {msg.provider && (
                              <span className="font-mono uppercase text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                                {msg.provider}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="p-2 bg-blue-600/30 text-blue-300 rounded-xl shrink-0 mt-0.5 border border-blue-500/30">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl shrink-0 border border-indigo-500/30">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4 bg-slate-950/80 rounded-2xl rounded-tl-xs border border-slate-800 flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {selectedProvider.toUpperCase()} is synthesizing response from tasks & context...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={attachedImage.base64}
                  alt="Thumbnail"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                />
                <div>
                  <p className="text-sm text-slate-200 font-medium">{attachedImage.name}</p>
                  <p className="text-xs text-purple-400">Multimodal Input Ready for {selectedProvider.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Studio Input Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex items-end space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-900 border border-slate-800 rounded-xl transition shrink-0"
                title="Attach Image (Multimodal Vision)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

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
                  placeholder="Ask a question about tasks, employee workloads, or project deadlines..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition"
                />
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className="p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeysUpdated={() => toast.success('API keys updated')}
      />
    </div>
  );
}
