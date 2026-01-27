import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { getAllInvites } from '../../api/adminApi';

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const ManageInvites: React.FC = () => {
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      setIsLoading(true);
      try {
        const response = await getAllInvites();
        if (response.ok) {
          setInvites(response.body);
        } else {
          setError('Failed to fetch invites.');
        }
      } catch (err) {
        setError('An error occurred while fetching invites.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvites();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-primary/20 rounded-lg mr-3">
            <Gift size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">All Ambassador Invites</h2>
      </div>

      {isLoading ? (
        <div className="text-center text-neutral-400 py-12">Loading invites...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-neutral-400">Owner</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Invite Code</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Signups</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{invite.owner}</td>
                  <td className="p-4">
                      <span className="font-mono text-secondary bg-secondary/10 px-2 py-1 rounded border border-secondary/20">{invite.code}</span>
                  </td>
                  <td className="p-4 text-white">{invite.signups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default ManageInvites;
