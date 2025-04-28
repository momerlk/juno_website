import React, { useState } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SellerAuth: React.FC = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const { login, signup, isLoading } = useSellerAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignup) {
        await signup(email, password, businessName);
        navigate('/seller/onboarding');
      } else {
        await login(email, password);
        navigate('/seller/dashboard');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background-light py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {isSignup ? 'Create your seller account' : 'Sign in to your seller account'}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {isSignup ? 'Start selling on Juno today' : 'Welcome back to Juno'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="business-name" className="sr-only">Business Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    id="business-name"
                    name="business-name"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-neutral-700 bg-background text-white placeholder-neutral-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-neutral-700 bg-background text-white placeholder-neutral-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-neutral-700 bg-background text-white placeholder-neutral-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isSignup ? 'Sign up' : 'Sign in')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/seller/onboarding")}  
              className="text-sm text-neutral-400 hover:text-primary"
            >
              {"Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
};

export default SellerAuth;