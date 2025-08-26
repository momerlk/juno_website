import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const WorkAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Growth team',
    password: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useWorkAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate('/work/dashboard');
        } else {
          setError('Invalid email or password.');
        }
      } else {
        const success = await register(formData.name, formData.email, formData.role, formData.password, formData.phone);
        if (success) {
          setIsLogin(true);
          setFormData({ name: '', email: '', role: 'Growth team', password: '', phone: '' });
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light text-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-background rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold">{isLogin ? 'Juno Work Portal' : 'Create Your Account'}</h1>
            <p className="text-neutral-400">{isLogin ? 'Login to continue' : 'Join the team'}</p>
        </div>
        
        {error && <div className="p-3 text-center text-sm text-red-500 bg-red-500/10 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <input className="w-full px-4 py-2 text-white bg-background-light border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" type="text" placeholder="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
          )}
          <input className="w-full px-4 py-2 text-white bg-background-light border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" type="email" placeholder="Email Address" name="email" value={formData.email} onChange={handleInputChange} required />
          <input className="w-full px-4 py-2 text-white bg-background-light border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" type="password" placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} required />
          {!isLogin && (
            <>
                <input className="w-full px-4 py-2 text-white bg-background-light border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" type="text" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 text-white bg-background-light border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Growth team">Growth team</option>
                    <option value="CEO">CEO</option>
                    <option value="COO">COO</option>
                    <option value="CGO">CGO</option>
                </select>
            </>
          )}
          <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Processing...' : (isLogin ? <><LogIn className="mr-2" size={16}/> Login</> : <><UserPlus className="mr-2" size={16}/> Register</>)}
          </button>
        </form>
        <p className="text-sm text-center text-neutral-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="ml-2 font-semibold text-primary hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default WorkAuth;
