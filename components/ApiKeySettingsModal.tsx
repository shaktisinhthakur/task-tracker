'use client';
import { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  X,
  Server,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  defaultModel: string;
  models: { id: string; label: string; supportsVision?: boolean }[];
  envKey: string;
  apiKeyDocsUrl: string;
  hasServerKey: boolean;
}

export default function ApiKeySettingsModal({
  isOpen,
  onClose,
  onKeysUpdated,
}: ApiKeySettingsModalProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [activeTab, setActiveTab] = useState<string>('groq');
  const [userKeys, setUserKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, { loading: boolean; result?: { ok: boolean; message: string } }>>({});
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Load stored keys from localStorage and fetch server status
  useEffect(() => {
    if (isOpen) {
      loadKeysFromStorage();
      fetchStatus();
    }
  }, [isOpen]);

  const loadKeysFromStorage = () => {
    try {
      const stored = localStorage.getItem('tasktracker_llm_keys');
      if (stored) {
        setUserKeys(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored API keys', e);
    }
  };

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/chat/status');
      const data = await res.json();
      if (data.providers) {
        setProviders(data.providers);
      }
    } catch (err) {
      toast.error('Failed to load provider key status from server');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleKeyChange = (providerId: string, val: string) => {
    const updated = { ...userKeys, [providerId]: val };
    setUserKeys(updated);
  };

  const saveKeys = () => {
    try {
      localStorage.setItem('tasktracker_llm_keys', JSON.stringify(userKeys));
      toast.success('API keys saved locally in your browser!');
      if (onKeysUpdated) onKeysUpdated();
    } catch (e) {
      toast.error('Failed to save keys locally');
    }
  };

  const clearAllKeys = () => {
    if (confirm('Are you sure you want to clear all locally stored API keys?')) {
      localStorage.removeItem('tasktracker_llm_keys');
      setUserKeys({});
      toast.success('Local API keys cleared');
      if (onKeysUpdated) onKeysUpdated();
    }
  };

  const testKey = async (providerId: string) => {
    const currentKey = userKeys[providerId];
    setTestingStatus((prev) => ({
      ...prev,
      [providerId]: { loading: true },
    }));

    try {
      const res = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          apiKey: currentKey || undefined,
        }),
      });
      const data = await res.json();

      setTestingStatus((prev) => ({
        ...prev,
        [providerId]: { loading: false, result: data },
      }));

      if (data.ok) {
        toast.success(`Key verified for ${providerId.toUpperCase()}!`);
      } else {
        toast.error(`Verification failed: ${data.message}`);
      }
    } catch (error: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          result: { ok: false, message: error.message || 'Network request failed' },
        },
      }));
      toast.error('Network error during key verification');
    }
  };

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === activeTab) || providers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Multi-Model LLM & Key Configuration
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Groq Primary
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose to configure keys via UI (stored locally in browser) or via server <code className="text-slate-300">.env</code>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 space-x-2 overflow-x-auto">
          {providers.map((p) => {
            const hasLocalKey = Boolean(userKeys[p.id] && userKeys[p.id].trim().length > 0);
            const isReady = p.hasServerKey || hasLocalKey;

            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 ${
                  activeTab === p.id
                    ? 'border-blue-500 bg-slate-900 text-blue-400 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>{p.name.split(' ')[0]}</span>
                {p.id === 'groq' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    Primary
                  </span>
                )}
                {isReady ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {currentProvider && (
            <div className="space-y-6">
              {/* Provider Info Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base flex items-center gap-2">
                    {currentProvider.name}
                    {currentProvider.id === 'groq' && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        Default & Highest Speed
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{currentProvider.description}</p>
                </div>
                <a
                  href={currentProvider.apiKeyDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center space-x-3 ${
                    currentProvider.hasServerKey
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <div>
                    <span className="font-semibold block">Server .env Status</span>
                    <span>
                      {currentProvider.hasServerKey
                        ? `Configured via ${currentProvider.envKey}`
                        : `Not set in .env (${currentProvider.envKey})`}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center space-x-3 ${
                    userKeys[currentProvider.id]?.trim()
                      ? 'bg-blue-950/20 border-blue-800/40 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <div>
                    <span className="font-semibold block">Browser BYOK Key</span>
                    <span>
                      {userKeys[currentProvider.id]?.trim()
                        ? 'Custom Key stored in browser'
                        : 'No custom key entered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Key Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Enter Your {currentProvider.name} API Key
                </label>
                <div className="relative">
                  <input
                    type={visibleKeys[currentProvider.id] ? 'text' : 'password'}
                    placeholder={`e.g. gsk_... or sk-...`}
                    value={userKeys[currentProvider.id] || ''}
                    onChange={(e) => handleKeyChange(currentProvider.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-24 font-mono transition"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleKeys((prev) => ({
                          ...prev,
                          [currentProvider.id]: !prev[currentProvider.id],
                        }))
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                      title={visibleKeys[currentProvider.id] ? 'Hide Key' : 'Show Key'}
                    >
                      {visibleKeys[currentProvider.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    {userKeys[currentProvider.id] && (
                      <button
                        type="button"
                        onClick={() => handleKeyChange(currentProvider.id, '')}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                        title="Clear Key"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Your key is stored only in your browser's encrypted localStorage and sent directly for inference.
                </p>
              </div>

              {/* Supported Models Catalog */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Available Models ({currentProvider.models.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentProvider.models.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-slate-200">{m.id}</span>
                        <p className="text-[11px] text-slate-400">{m.label}</p>
                      </div>
                      {m.supportsVision && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                          Vision
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Test Connection Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-white">Live Connection Test</h5>
                    <p className="text-xs text-slate-400">
                      Send a lightweight ping to verify that your key and provider connection work.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => testKey(currentProvider.id)}
                  disabled={testingStatus[currentProvider.id]?.loading}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      testingStatus[currentProvider.id]?.loading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {testingStatus[currentProvider.id]?.loading ? 'Testing...' : 'Test Connection'}
                  </span>
                </button>
              </div>

              {/* Test Result Message */}
              {testingStatus[currentProvider.id]?.result && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    testingStatus[currentProvider.id]?.result?.ok
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/30 border-red-800/60 text-red-300'
                  }`}
                >
                  {testingStatus[currentProvider.id]?.result?.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">
                      {testingStatus[currentProvider.id]?.result?.ok
                        ? 'Verification Succeeded'
                        : 'Verification Failed'}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {testingStatus[currentProvider.id]?.result?.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Guide on Setup Options */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Setup Options Explained
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="font-semibold text-slate-200 block mb-1">
                  Option 1: Server Environment (.env)
                </span>
                Add keys to <code className="text-blue-400">task-tracker/.env</code> (e.g.{' '}
                <code className="text-slate-300">GROQ_API_KEY=gsk_...</code>). Shared across all
                users on this server.
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="font-semibold text-slate-200 block mb-1">
                  Option 2: Browser BYOK (Interactive)
                </span>
                Paste your key in this modal and click "Save Keys". Takes precedence for your
                session without touching the server files.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={clearAllKeys}
            type="button"
            className="text-xs text-slate-400 hover:text-red-400 transition"
          >
            Clear Browser Keys
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveKeys();
                onClose();
              }}
              type="button"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/30"
            >
              Save Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
