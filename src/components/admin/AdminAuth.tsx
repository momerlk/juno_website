import React, { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background px-4 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,24,24,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,69,133,0.08),transparent_24%)]" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-md border border-white/10 bg-[#0b0b0b]/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Admin Portal
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              Sign in
            </h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/30"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-primary/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/30"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Sign in
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default AdminAuth;
