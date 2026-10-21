'use client';
import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, User, Plus, X, Copy, Mail, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{
    name: string;
    email: string;
    pass: string;
    role?: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users. You might not have Admin access.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormData({ ...formData, password: pass });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      setUsers([data, ...users]);
      setGeneratedCreds({
        name: formData.name,
        email: formData.email,
        pass: formData.password,
        role: formData.role,
        emailSent: Boolean(data.emailSent),
        emailError: data.emailError
      });
      setIsModalOpen(false);
      
      if (data.emailSent) {
        toast.success(`User created & credentials emailed to ${formData.email}!`);
      } else {
        toast.success('User account created! (Note: Configure SMTP in .env to deliver email)');
      }

      setFormData({ name: '', email: '', password: '', role: 'USER' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!generatedCreds) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/email/resend-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: generatedCreds.name,
          email: generatedCreds.email,
          password: generatedCreds.pass,
          role: generatedCreds.role,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      setGeneratedCreds({ ...generatedCreds, emailSent: true, emailError: undefined });
      toast.success(`Credentials emailed to ${generatedCreds.email}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyCreds = () => {
    if (!generatedCreds) return;
    navigator.clipboard.writeText(`Website: ${window.location.origin}/login\nEmail: ${generatedCreds.email}\nPassword: ${generatedCreds.pass}`);
    toast.success('Copied to clipboard');
  };

  if (isLoading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-violet-500" />
            Users & Access
          </h1>
          <p className="text-slate-400">Manage portal access, roles, and security.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {generatedCreds && (
        <div className="mb-8 p-6 bg-slate-900 border border-slate-700/80 rounded-2xl relative shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Account Created Successfully!
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                {generatedCreds.emailSent ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Mail className="w-4 h-4" /> Login password was sent directly to <strong>{generatedCreds.email}</strong>.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Email not sent ({generatedCreds.emailError || 'Configure SMTP in .env'}). Please copy details below or click Send Email.
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setGeneratedCreds(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-1 mb-5">
            <div><span className="text-slate-500">Portal URL:</span> <span className="text-slate-300">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="text-white font-semibold">{generatedCreds.email}</span></div>
            <div><span className="text-slate-500">Password:</span> <span className="text-emerald-400 font-bold">{generatedCreds.pass}</span></div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={copyCreds} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 font-medium transition shadow-md">
              <Copy className="w-4 h-4" /> Copy Credentials
            </button>
            <button
              onClick={handleResendEmail}
              disabled={isSendingEmail}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 font-medium transition shadow-md"
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Sending Email...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> {generatedCreds.emailSent ? 'Resend Email' : 'Send Credentials via Email'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-sm border-b border-slate-700">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email Address</th>
              <th className="p-4 font-medium">System Role</th>
              <th className="p-4 font-medium">Created On</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                <td className="p-4">
                  <div className="font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" /> {u.name}
                  </div>
                </td>
                <td className="p-4 text-slate-300">{u.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Create Portal User</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-violet-500" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-violet-500" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-violet-500">
                  <option value="USER">User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <div className="flex gap-2">
                  <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-violet-500" placeholder="Secure password" />
                  <button type="button" onClick={generatePassword} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition" title="Auto-generate">
                    <Key className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
