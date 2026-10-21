'use client';
import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Briefcase, Calendar, X, Trash2, CheckCircle2, Copy, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{
    name: string;
    email: string;
    pass: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [userRole, setUserRole] = useState<string>('USER');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    joinedAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.role) setUserRole(data.user.role);
      });
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }
      const data = await res.json();
      const { employee, tempPassword, emailSent, emailError } = data;
      setEmployees([...employees, employee]);
      setGeneratedCreds({
        name: employee.name,
        email: employee.email,
        pass: tempPassword,
        emailSent: Boolean(emailSent),
        emailError,
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', designation: '', joinedAt: new Date().toISOString().split('T')[0] });
      
      if (emailSent) {
        toast.success(`Employee added & password sent directly to ${employee.email}!`);
      } else {
        toast.success('Employee added! (Configure SMTP in .env to deliver email automatically)');
      }
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
          role: 'USER',
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

  const deleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? This will also remove their portal access.')) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      setEmployees(employees.filter(e => e.id !== id));
      toast.success('Employee deleted');
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const copyCreds = () => {
    if (!generatedCreds) return;
    navigator.clipboard.writeText(`Email: ${generatedCreds.email}\nTemporary Password: ${generatedCreds.pass}`);
    toast.success('Copied to clipboard');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.designation.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Employees
          </h1>
          <p className="text-slate-400">Manage team members and their roles.</p>
        </div>
        {userRole === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow transition"
          >
            + Add Employee
          </button>
        )}
      </div>

      {generatedCreds && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] animate-in slide-in-from-top-4 duration-500 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Account Created Successfully
                </h3>
                <p className="text-slate-400 text-sm">
                  {generatedCreds.emailSent ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                      <Mail className="w-4 h-4" /> Password and login details have been emailed directly to <strong>{generatedCreds.email}</strong>.
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-4 h-4" /> Email was not sent ({generatedCreds.emailError || 'Configure SMTP in .env'}). Please share credentials manually or click Send Email below.
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setGeneratedCreds(null)} className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition duration-500 rounded-full -mr-8 -mt-8"></div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Email Address</div>
                <div className="text-white font-medium truncate">{generatedCreds.email}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition duration-500 rounded-full -mr-8 -mt-8"></div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Temporary Password</div>
                <div className="text-emerald-400 font-mono tracking-widest">{generatedCreds.pass}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={copyCreds} 
                className={clsx(
                  "w-full sm:w-auto px-6 py-3 font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]",
                  isCopied 
                    ? "bg-slate-800 text-emerald-400 cursor-default" 
                    : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                )}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Copied Successfully!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" /> Copy to Clipboard
                  </>
                )}
              </button>

              <button
                onClick={handleResendEmail}
                disabled={isSendingEmail}
                className="w-full sm:w-auto px-6 py-3 font-medium rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" /> {generatedCreds.emailSent ? 'Resend Email' : 'Send Credentials via Email'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name or designation..."
        className="w-full max-w-md px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none mb-6"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-1">{emp.name}</h3>
            <p className="text-blue-400 font-medium mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> {emp.designation}
            </p>
            
            <div className="space-y-3 text-slate-400 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" /> {emp.email}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" /> {emp.phone}
              </div>
              {emp.joinedAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" /> Joined: {new Date(emp.joinedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-500">{emp.tasks?.length || 0} Assigned Tasks</span>
              <div className="flex gap-4">
                {userRole === 'ADMIN' && (
                  <button onClick={() => deleteEmployee(emp.id)} className="text-slate-500 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedEmployee(emp)} className="text-blue-400 hover:text-white transition">
                  View Profile &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Add New Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number (Digits only)</label>
                <input required type="text" pattern="[0-9]*" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Joining Date</label>
                <input type="date" value={formData.joinedAt} onChange={e => setFormData({...formData, joinedAt: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow transition disabled:opacity-50 flex items-center">
                  {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-6 border-b border-slate-800 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedEmployee.name}</h2>
                  <p className="text-blue-400">{selectedEmployee.designation}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Email Address</div>
                  <div className="text-white text-sm font-medium">{selectedEmployee.email}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Phone Number</div>
                  <div className="text-white text-sm font-medium">{selectedEmployee.phone}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Joining Date</div>
                  <div className="text-white text-sm font-medium">{selectedEmployee.joinedAt ? new Date(selectedEmployee.joinedAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Active Tasks</div>
                  <div className="text-white text-sm font-medium">{selectedEmployee.tasks?.length || 0} tasks</div>
                </div>
              </div>

              <div>
                <h4 className="text-slate-300 font-medium mb-3 border-b border-slate-800 pb-2">Assigned Tasks</h4>
                {selectedEmployee.tasks?.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No tasks currently assigned.</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedEmployee.tasks?.map((task: any) => (
                      <li key={task.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-sm text-slate-300 truncate max-w-[200px]">{task.title}</span>
                        <span className={clsx("text-xs px-2 py-1 rounded-full", 
                          task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-slate-500/10 text-slate-400'
                        )}>{task.status.replace('_', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
