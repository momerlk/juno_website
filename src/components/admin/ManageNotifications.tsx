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
      className="bg-background rounded-lg p-6 mt-6"
    >
      <div className="flex items-center mb-4">
        <Bell size={22} className="text-primary mr-3" />
        <h2 className="text-xl font-semibold text-white">Broadcast Notifications</h2>
      </div>
      <form onSubmit={handleSendBroadcast} className="space-y-4">
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
            className="w-full px-3 py-2 bg-background-light border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
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
