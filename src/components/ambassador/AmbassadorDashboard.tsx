import React, { useState, useEffect } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion } from 'framer-motion';
import { Gift, Users, LogOut, Copy, Check } from 'lucide-react';

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const AmbassadorDashboard: React.FC = () => {
  const { ambassador, logout, fetchInviteData, generateInviteCode } = useAmbassadorAuth();
  const [inviteData, setInviteData] = useState<Array<InviteData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getInviteData = async () => {
      if (ambassador) { // Only fetch if ambassador is loaded
        setIsLoading(true);
        const data = await fetchInviteData();
        setInviteData(data);
        setIsLoading(false);
      }
    };
    getInviteData();
  }, [ambassador, fetchInviteData]); // Re-run when ambassador is loaded

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    const data = await generateInviteCode();
    if (data) {
      setInviteData([data]);
    } else {
      alert('Failed to generate invite code.');
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (inviteData !== null && inviteData.length > 0) {
        const invite = inviteData[0]; // Assuming we only have one invite code
      navigator.clipboard.writeText(invite.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Ambassador Dashboard</h1>
            <p className="text-neutral-400">Welcome, {ambassador?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center text-neutral-400 hover:text-white"
          >
            <LogOut size={20} className="mr-2" />
            Sign Out
          </button>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : inviteData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-lg p-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-2">Your Invite Code</h2>
              <p className="text-neutral-400 mb-6">Share your code to earn rewards!</p>
              
              <div className="flex items-center justify-center bg-background-light p-4 rounded-lg border-2 border-dashed border-primary mb-6">
                <span className="text-3xl font-bold text-primary tracking-widest mr-4">{inviteData[0].code}</span>
                <button onClick={handleCopy} className="p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30">
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background-light p-6 rounded-lg flex items-center">
                  <Gift size={32} className="text-secondary mr-4" />
                  <div>
                    <p className="text-neutral-400 text-sm">Total Signups</p>
                    <p className="text-2xl font-bold text-white">{inviteData[0].signups}</p>
                  </div>
                </div>
                <div className="bg-background-light p-6 rounded-lg flex items-center">
                  <Users size={32} className="text-accent mr-4" />
                  <div>
                    <p className="text-neutral-400 text-sm">Your Rank</p>
                    <p className="text-2xl font-bold text-white">N/A</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-background rounded-lg p-12"
            >
              <h2 className="text-2xl font-semibold text-white mb-2">No Invite Code Found</h2>
              <p className="text-neutral-400 mb-6">Generate your unique invite code to get started.</p>
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate My Code'}
              </button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AmbassadorDashboard;