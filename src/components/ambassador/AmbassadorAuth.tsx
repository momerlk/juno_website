import React, { useState } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../seller/FormInput';

const AmbassadorAuth: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const { login } = useAmbassadorAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      // Ensure we're sending the full international format
      const fullNumber = `+92${phoneNumber.replace(/^0+/, '')}`;
      login(fullNumber);
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
            Enter your phone number to access your dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-400">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                className="glass-input w-full pl-24 py-3 text-white relative z-0"
                placeholder="3001234567"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-white pointer-events-none border-r border-white/20 pr-2 z-10">
                <Phone size={18} className="text-primary" />
                <span className="font-bold">+92</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500">Enter your 10-digit phone number without the leading 0.</p>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Continue to Dashboard
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
};

export default AmbassadorAuth;