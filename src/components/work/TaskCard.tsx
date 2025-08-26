import React from 'react';
import { Calendar, Flag, CheckCircle, Zap, Clock, Trash2 } from 'lucide-react';

// Define Task type locally
interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  readonly?: boolean;
}

const statusConfig = {
    pending: { color: 'text-warning bg-warning/10', text: 'Pending', icon: Clock },
    processing: { color: 'text-secondary bg-secondary/10', text: 'In Progress', icon: Zap },
    completed: { color: 'text-success bg-success/10', text: 'Completed', icon: CheckCircle },
};

const priorityConfig = {
    low: { color: 'border-success/50', text: 'Low' },
    medium: { color: 'border-warning/50', text: 'Medium' },
    high: { color: 'border-error/50', text: 'High' },
};

const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            <Icon size={12} className="mr-1.5" />
            {config.text}
        </span>
    );
};

const PriorityIndicator: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
    const config = priorityConfig[priority];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-700 text-neutral-300`}>
             <Flag size={12} className="mr-1.5" />
            {config.text}
        </span>
    );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onEdit, onDelete, readonly = false }) => {
    const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';

    return (
        <div className={`bg-background-light rounded-lg shadow-md p-4 border-l-4 ${priorityConfig[task.priority].color}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white pr-2">{task.title}</h3>
                <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-neutral-400 mb-4 h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800">{task.description}</p>
            
            <div className="flex justify-between items-center mb-4 text-sm text-neutral-400">
                <div className={`flex items-center ${isOverdue ? 'text-error' : ''}`}>
                    <Calendar size={14} className="mr-2" />
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <PriorityIndicator priority={task.priority} />
            </div>

            <div className="pt-4 border-t border-neutral-700 flex items-center justify-between">
                {onStatusChange && !readonly ? (
                    <div className="flex items-center space-x-1">
                        {Object.keys(statusConfig).map(status => (
                            <button 
                                key={status}
                                disabled={task.status === status}
                                onClick={() => onStatusChange(task.id, status)}
                                className={`px-2 py-1 text-xs rounded-full disabled:opacity-40 disabled:cursor-not-allowed ${statusConfig[status].color} hover:opacity-80 transition-opacity`}>
                                {statusConfig[status].text}
                            </button>
                        ))}
                    </div>
                ) : <div/>}
                {onDelete && !readonly && (
                     <button onClick={() => onDelete(task.id)} className="text-neutral-500 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10">
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
