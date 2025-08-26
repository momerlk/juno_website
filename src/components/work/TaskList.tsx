import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import TaskCard from './TaskCard';
import LoadingSpinner from '../shared/LoadingSpinner';

// Define Task type locally, assuming it's also defined in the context
interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string;
    assigned_by: string;
    status: 'pending' | 'processing' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    created_at: string;
    completed_at?: string;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const { employee, fetchTasks, updateTaskStatus } = useWorkAuth();

  useEffect(() => {
    const loadTasks = async () => {
      if (employee) {
        setLoading(true);
        const filters = {
            assigned_to: employee.id,
            ...(filter !== 'all' && { status: filter })
        };
        const fetchedTasks = await fetchTasks(filters);
        setTasks(fetchedTasks);
        setLoading(false);
      }
    };
    loadTasks();
  }, [employee, fetchTasks, filter]);

  const handleStatusChange = async (taskId: string, status: string) => {
    const success = await updateTaskStatus(taskId, status);
    if (success) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: status as any } : t));
    }
  };

  const filterOptions: ('all' | 'pending' | 'processing' | 'completed')[] = ['all', 'pending', 'processing', 'completed'];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">My Tasks</h2>
      <div className="flex space-x-2 mb-4 border-b border-neutral-700 pb-4">
        {filterOptions.map(f => (
            <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
        ))}
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
            ))
          ) : (
            <p className="text-neutral-400 col-span-full text-center py-8">No tasks found for the current filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
