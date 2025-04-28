import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, QrCode } from 'lucide-react';
import { useJunoStudio } from '../../contexts/JunoStudioContext';

const JunoStudioAccounts: React.FC = () => {
  const { accounts, createAccount, deleteAccount } = useJunoStudio();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    try {
      setIsCreating(true);
      await createAccount();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccount(id);
      if (selectedAccount === id) {
        setSelectedAccount(null);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <QrCode size={24} className="text-primary mr-2" />
          <h2 className="text-xl font-semibold">Juno Studio Accounts</h2>
        </div>
        <button
          onClick={handleCreateAccount}
          disabled={isCreating}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} className="mr-2" />
          {isCreating ? 'Creating...' : 'Create Account'}
        </button>
      </div>

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">
            No Juno Studio accounts created yet. Click the button above to create one.
          </p>
        ) : (
          accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-background-light rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{account.username}</h3>
                  <p className="text-sm text-neutral-400">
                    Created: {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)}
                    className="text-neutral-400 hover:text-white focus:outline-none"
                  >
                    <QrCode size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-red-500 hover:text-red-400 focus:outline-none"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {selectedAccount === account.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 p-4 bg-background rounded-lg border border-neutral-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-400 mb-1">Username:</p>
                        <p className="font-mono bg-background-light p-2 rounded">{account.username}</p>
                        <p className="text-sm text-neutral-400 mb-1 mt-3">Password:</p>
                        <p className="font-mono bg-background-light p-2 rounded">{account.password}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <img
                          src={account.qrCode}
                          alt="QR Code"
                          className="max-w-[200px] w-full"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 mt-4">
                      Scan this QR code with the Juno Studio app to log in automatically
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default JunoStudioAccounts;