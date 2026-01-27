import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send } from 'lucide-react';
import FormInput from '../seller/FormInput';
import { broadcastNotification } from '../../api/adminApi';

const ManageNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setError('Title and body are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await broadcastNotification(title, body);
      if (result && result.data && Array.isArray(result.data)) {
        const ticketIds = result.data.map((t: any) => t.id).filter((id : any) => id).join(', ');
        setSuccess(`Broadcast sent successfully! Tickets: ${ticketIds}`);
      } else {
        setSuccess(result.message || 'Broadcast request sent successfully, but no ticket details returned.');
      }
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-panel p-6 mt-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center mb-6 border-b border-white/10 pb-4">
        <div className="p-3 bg-primary/20 rounded-xl mr-4">
            <Bell size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">Broadcast Notifications</h2>
      </div>
      <form onSubmit={handleSendBroadcast} className="space-y-6">
        <FormInput
          id="notification-title"
          label="Notification Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g., New Season Arrivals!"
          required
        />
        <div>
          <label htmlFor="notification-body" className="block text-sm font-medium text-neutral-400 mb-1">
            Notification Body
          </label>
          <textarea
            id="notification-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the notification..."
            required
            className="glass-input w-full min-h-[120px]"
            rows={4}
          />
        </div>
        
        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">{success}</div>}

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="glass-button bg-primary text-white hover:bg-primary-dark shadow-glow-primary border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} className="mr-2" />
            {isLoading ? 'Sending...' : 'Send Broadcast'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ManageNotifications;
