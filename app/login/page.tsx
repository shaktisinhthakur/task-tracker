'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // Track mouse globally for spotlight effect
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Welcome back!', {
          icon: '🚀',
          style: { background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '16px', fontWeight: 600 }
        });
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        toast.error(data.error || 'Invalid credentials', {
          style: { background: '#0f172a', color: '#fff', border: '1px solid #ef4444', borderRadius: '16px' }
        });
        setIsLoading(false);
      }
    } catch {
      toast.error('Connection failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center font-sans" style={{ background: '#030014' }}>
      <Toaster position="top-center" />

      {/* ── Animated Mesh Gradient Background ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[70vw] h-[70vw] rounded-full opacity-30 animate-[drift1_20s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-25 animate-[drift2_25s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full opacity-20 animate-[drift3_18s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
      </div>

      {/* ── Floating Particles ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full animate-[floatUp_var(--dur)_linear_infinite]" style={{
            '--dur': `${8 + Math.random() * 15}s`,
            left: `${Math.random() * 100}%`,
            bottom: `-${Math.random() * 20}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
            opacity: 0.4 + Math.random() * 0.4,
            animationDelay: `${Math.random() * 10}s`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* ── Mouse Spotlight ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124, 58, 237, 0.06), transparent 40%)`
      }} />

      {/* ── Spinning 3D Cube ── */}
      <div className="absolute z-0 w-[300px] h-[300px] [transform-style:preserve-3d] animate-[spinCube_20s_linear_infinite] opacity-20">
        {[
          'rotateY(0deg) translateZ(150px)',
          'rotateY(90deg) translateZ(150px)',
          'rotateY(180deg) translateZ(150px)',
          'rotateY(-90deg) translateZ(150px)',
          'rotateX(90deg) translateZ(150px)',
          'rotateX(-90deg) translateZ(150px)',
        ].map((t, i) => (
          <div key={i} className="absolute inset-0 border rounded-xl backdrop-blur-sm"
               style={{
                 transform: t,
                 borderColor: `rgba(124, 58, 237, ${0.15 + i * 0.03})`,
                 background: `linear-gradient(135deg, rgba(124,58,237,0.05), rgba(6,182,212,0.05))`,
               }} />
        ))}
      </div>

      {/* ── Login Card ── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 w-full max-w-[440px] mx-4 transition-all duration-300 ease-out will-change-transform"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Animated border glow */}
        <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-r from-violet-600 via-cyan-500 to-pink-500 opacity-30 blur-[2px] animate-[borderSpin_4s_linear_infinite]" />

        <div className="relative rounded-[28px] overflow-hidden" style={{ background: 'rgba(10, 5, 30, 0.85)', backdropFilter: 'blur(40px)' }}>
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-[28px] border border-white/[0.08]" />
          
          <div className="relative p-10 pt-12" style={{ transform: 'translateZ(40px)' }}>
            {/* Logo */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-5">
                <div className="absolute -inset-4 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 rotate-6 hover:rotate-0 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white -rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-[28px] font-black tracking-tight" style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TaskTracker
              </h1>
              <p className="text-[13px] font-medium text-slate-500 mt-1 tracking-widest uppercase">Secure Portal</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email" required
                    placeholder="Email address"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl text-[15px] font-medium text-white placeholder-slate-600 outline-none transition-all duration-300 border border-white/[0.06] focus:border-violet-500/40"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-600 group-focus-within:text-violet-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    type="password" required
                    placeholder="Password"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl text-[15px] font-medium text-white placeholder-slate-600 outline-none transition-all duration-300 border border-white/[0.06] focus:border-violet-500/40"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-4 rounded-2xl text-[15px] font-bold relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
              >
                {/* Button gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 transition-opacity group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <span className="relative z-10 text-white flex items-center justify-center gap-3">
                  {isLoading ? (
                    <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[12px] text-slate-600">Protected by enterprise-grade encryption</p>
              <div className="flex justify-center items-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-500/70 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spinCube {
          0% { transform: rotateX(-15deg) rotateY(0deg); }
          100% { transform: rotateX(-15deg) rotateY(360deg); }
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, 8%) scale(1.1); }
          50% { transform: translate(-3%, 5%) scale(0.95); }
          75% { transform: translate(8%, -5%) scale(1.05); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-8%, -5%) scale(1.15); }
          66% { transform: translate(5%, 8%) scale(0.9); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10%, 10%) scale(1.1); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes borderSpin {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
