'use client';
import { useState, useEffect } from 'react';
import { CheckSquare, Search, Filter, X } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'MEDIUM',
    employeeId: ''
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(res => res.json()),
      fetch('/api/employees').then(res => res.json())
    ]).then(([tasksData, empData]) => {
      setTasks(tasksData);
      setEmployees(empData);
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);
      setFormData({ title: '', description: '', deadline: '', priority: 'MEDIUM', employeeId: '' });
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.employee?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-emerald-500" />
            Task Management
          </h1>
          <p className="text-slate-400">Track and update project assignments across the team.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition">
          + Create Task
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks or employees..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">Task Title</th>
                <th className="p-4 font-medium">Assigned To</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Deadline</th>
                <th className="p-4 font-medium w-48">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const deadline = new Date(task.deadline);
                const isOverdue = deadline < new Date() && task.status !== 'COMPLETED';
                
                return (
                  <tr key={task.id} className={clsx(
                    "border-b border-slate-800 hover:bg-slate-800/50 transition-colors",
                    isOverdue && "bg-red-500/5 hover:bg-red-500/10"
                  )}>
                    <td className="p-4">
                      <div className="font-bold text-white">{task.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{task.employee?.name || 'Unassigned'}</td>
                    <td className="p-4">
                      <span className={clsx(
                        "text-xs font-bold",
                        task.priority === 'HIGH' ? 'text-red-400' : task.priority === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium shadow-sm",
                        task.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        task.status === 'IN_PROGRESS' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        task.status === 'ON_HOLD' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                        "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={clsx("p-4 font-medium", isOverdue ? "text-red-400" : "text-slate-300")}>
                      {deadline.toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                          <div className={clsx(
                            "h-2.5 rounded-full transition-all",
                            task.status === 'COMPLETED' ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          )} style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300 w-8">{task.progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Create New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Task Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Design homepage" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Task details..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
                <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
                <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="" disabled>Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
