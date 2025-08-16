import React, { useState } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../seller/FormInput';

const AmbassadorAuth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const { login } = useAmbassadorAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
      navigate('/ambassador/dashboard');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background-light py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Ambassador Portal
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Enter your email to access your dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            required
            icon={<Mail size={20} />}
            placeholder="your.email@example.com"
          />
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
};

export default AmbassadorAuth;