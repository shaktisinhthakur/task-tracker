'use client';
import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import { Users, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

// 3D Tilt Card Component
function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "transition-transform duration-200 ease-out will-change-transform bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6", 
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2">Dashboard overview</h1>
        <p className="text-slate-400">Welcome back. Here is your team's current status.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <TiltCard className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-t-blue-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Users /></div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Employees</p>
              <h3 className="text-2xl font-bold text-white">{data.totalEmployees}</h3>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-t-indigo-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg"><Layers /></div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Tasks</p>
              <h3 className="text-2xl font-bold text-white">{data.totalTasks}</h3>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-t-emerald-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle2 /></div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Completed</p>
              <h3 className="text-2xl font-bold text-white">{data.completedTasks}</h3>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-t-blue-400">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-400/20 text-blue-300 rounded-lg"><Clock /></div>
            <div>
              <p className="text-sm text-slate-400 font-medium">In Progress</p>
              <h3 className="text-2xl font-bold text-white">{data.inProgressTasks}</h3>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-t-red-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg"><AlertTriangle /></div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Overdue</p>
              <h3 className="text-2xl font-bold text-white">{data.overdueTasks}</h3>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Overview */}
        <TiltCard className="col-span-1 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-white mb-6 self-start w-full border-b border-slate-800 pb-2">Status Split</h3>
          
          {/* Simple CSS Donut Chart representation */}
          <div className="relative w-48 h-48 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center"
               style={{
                 background: `conic-gradient(
                   #10b981 0% ${(data.statusSplit.COMPLETED / data.totalTasks) * 100}%,
                   #3b82f6 ${(data.statusSplit.COMPLETED / data.totalTasks) * 100}% ${((data.statusSplit.COMPLETED + data.statusSplit.IN_PROGRESS) / data.totalTasks) * 100}%,
                   #64748b ${((data.statusSplit.COMPLETED + data.statusSplit.IN_PROGRESS) / data.totalTasks) * 100}% ${((data.statusSplit.COMPLETED + data.statusSplit.IN_PROGRESS + data.statusSplit.NOT_STARTED) / data.totalTasks) * 100}%,
                   #eab308 ${((data.statusSplit.COMPLETED + data.statusSplit.IN_PROGRESS + data.statusSplit.NOT_STARTED) / data.totalTasks) * 100}% 100%
                 )`
               }}>
            <div className="absolute inset-2 rounded-full bg-slate-900 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-bold text-white">{data.totalTasks}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
          
          <div className="w-full mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-300">Completed</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-300">In Progress</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div><span className="text-slate-300">Not Started</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-slate-300">On Hold</span></div>
          </div>
        </TiltCard>

        {/* Employee Progress */}
        <TiltCard className="col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-2">Employee Progress Overview</h3>
          <div className="space-y-6">
            {data.employeeProgress.map((emp: any) => (
              <div key={emp.id} className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-300">{emp.name}</span>
                  <span className="text-sm text-blue-400">{emp.avgProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${emp.avgProgress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>

      {/* Recent Tasks Table */}
      <TiltCard className="overflow-hidden p-0 rounded-2xl">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Upcoming & Active Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-800">
                <th className="p-4 font-medium">Task</th>
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Deadline</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium w-48">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTasks.map((task: any) => {
                const deadline = new Date(task.deadline);
                const isOverdue = deadline < new Date() && task.status !== 'COMPLETED';
                const isSoon = !isOverdue && (deadline.getTime() - new Date().getTime()) < (3 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={task.id} className={clsx(
                    "border-b border-slate-800 hover:bg-slate-800/50 transition-colors",
                    isOverdue && "bg-red-500/5 hover:bg-red-500/10",
                    isSoon && !isOverdue && "bg-orange-500/5 hover:bg-orange-500/10"
                  )}>
                    <td className="p-4">
                      <div className="font-medium text-white">{task.title}</div>
                      <div className={clsx("text-xs", isOverdue ? "text-red-400" : isSoon ? "text-orange-400" : "text-slate-500")}>
                        {task.priority} Priority
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{task.employee?.name || 'Unassigned'}</td>
                    <td className="p-4 text-slate-300">
                      {deadline.toLocaleDateString()}
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
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className={clsx(
                            "h-2 rounded-full",
                            task.status === 'COMPLETED' ? "bg-emerald-500" : "bg-blue-500"
                          )} style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-400 w-8">{task.progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TiltCard>
    </div>
  );
}
