import React, { useState } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SellerAuth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useSellerAuth();

  const prefix = window.location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(`${prefix}/dashboard`);
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <img
            src="/juno_logos/icon+text_white.png"
            alt="Juno"
            className="h-10 mx-auto mb-8 opacity-90"
          />
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
          <p className="mt-2 text-neutral-400 text-sm">Sign in to Juno Studio</p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : (
              <>
                Sign in
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.form>

        {/* Join CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="border-t border-white/10 pt-8 text-center space-y-2"
        >
          <p className="text-sm text-neutral-500">Not on Juno yet?</p>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/onboarding`)}
            className="text-sm font-semibold text-white hover:text-primary transition-colors"
          >
            Apply to sell on Juno →
          </button>
          <p className="text-xs text-neutral-600 pt-1">
            Every brand is reviewed personally. We'll be in touch within 48 hours.
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default SellerAuth;
