import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, Gift, CheckCircle, XCircle } from 'lucide-react';
import FormInput from '../seller/FormInput';
import { getInvitesByOwner, generateInviteForOwner } from '../../api/adminApi';

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const ManageInvites: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckEmail = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    setInviteData(null);
    setSearchedEmail(email);
    try {
      const invites = await getInvitesByOwner(email);
      if (invites && invites.length > 0) {
        setInviteData(invites[0]);
      } else {
        setInviteData(null);
      }
    } catch (err) {
      setError('An error occurred while checking the email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!searchedEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      const newInvite = await generateInviteForOwner(searchedEmail);
      setInviteData(newInvite);
    } catch (err) {
      setError('An error occurred while generating the invite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Manage Ambassador Invites</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <FormInput
            id="ambassador-email"
            label="Ambassador Email"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Mail size={20} />}
            placeholder="Enter email to check for invite code"
          />
        </div>
        <button
          onClick={handleCheckEmail}
          disabled={isLoading || !email}
          className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <Search size={20} className="mr-2" />
          {isLoading ? 'Checking...' : 'Check Email'}
        </button>
      </div>

      {searchedEmail && !isLoading && (
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Result for: <span className="font-mono text-primary">{searchedEmail}</span></h3>
          {error && <p className="text-red-500">{error}</p>}
          
          {inviteData ? (
            <div className="space-y-3">
              <div className="flex items-center text-green-400">
                <CheckCircle size={20} className="mr-2" />
                <span>An invite code already exists for this email.</span>
              </div>
              <p><span className="font-semibold text-neutral-400">Invite Code:</span> <span className="font-mono text-secondary">{inviteData.code}</span></p>
              <p><span className="font-semibold text-neutral-400">Signups:</span> <span className="font-mono">{inviteData.signups}</span></p>
            </div>
          ) : !error && (
            <div className="space-y-4">
               <div className="flex items-center text-yellow-400">
                <XCircle size={20} className="mr-2" />
                <span>No invite code found for this email.</span>
              </div>
              <button
                onClick={handleGenerateInvite}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
              >
                <Gift size={20} className="mr-2" />
                {isLoading ? 'Generating...' : 'Generate Invite Code'}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ManageInvites;
