import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Send, Calendar, Target, Award } from 'lucide-react';
import FormInput from '../seller/FormInput';
import { createAmbassadorTask } from '../../api/adminApi';

const AmbassadorTasks: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [targetInstitute, setTargetInstitute] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
        const payload = {
            title,
            description,
            deadline: new Date(deadline).toISOString(),
            target_institute: targetInstitute || 'All',
            reward_points: parseInt(rewardPoints),
        };

        const response = await createAmbassadorTask(payload);
        
        if (response.ok) {
            setSuccess('Task created successfully!');
            setTitle('');
            setDescription('');
            setDeadline('');
            setTargetInstitute('');
            setRewardPoints('');
        } else {
            setError(response.body?.message || 'Failed to create task.');
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center mb-6 border-b border-white/10 pb-4">
        <div className="p-3 bg-primary/20 rounded-xl mr-4">
            <CheckSquare size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">Create Ambassador Task</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="task-title"
          label="Task Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g., Share our latest post"
          required
        />

        <div>
          <label htmlFor="task-desc" className="block text-sm font-medium text-neutral-400 mb-1">
            Description
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions for the task..."
            required
            className="glass-input w-full min-h-[100px]"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-neutral-400 mb-1 flex items-center gap-2">
                    <Calendar size={16}/> Deadline
                </label>
                <input 
                    type="datetime-local" 
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="glass-input w-full"
                />
            </div>
            <FormInput
                id="reward"
                label="Reward Points"
                type="number"
                value={rewardPoints}
                onChange={setRewardPoints}
                placeholder="e.g. 50"
                required
                icon={<Award size={16}/>}
            />
        </div>

        <FormInput
            id="target"
            label="Target Institute (Optional)"
            value={targetInstitute}
            onChange={setTargetInstitute}
            placeholder="Leave empty for 'All' or enter institute name"
            icon={<Target size={16}/>}
        />

        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">{success}</div>}

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="glass-button bg-primary text-white hover:bg-primary-dark shadow-glow-primary border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2"
          >
            <Send size={18} className="mr-2 inline" />
            {isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AmbassadorTasks;
