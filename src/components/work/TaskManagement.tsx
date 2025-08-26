import React, { useState, useEffect, useMemo } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import TaskCard from './TaskCard';
import { PlusCircle, Filter } from 'lucide-react';
import FormInput from '../seller/FormInput'; // Reusing for consistent styling

// Assuming these types are defined in your context or a types file
interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string;
    status: 'pending' | 'processing' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
}

interface Employee {
    id: string;
    name: string;
}

const CreateTaskForm = ({ employees, onCreate }) => {
    const [formData, setFormData] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(formData);
        setFormData({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background-light rounded-md mb-4 space-y-4 border border-neutral-700">
            <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 rounded bg-background border-neutral-600 text-white focus:ring-primary focus:border-primary" required/>
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 rounded bg-background border-neutral-600 text-white focus:ring-primary focus:border-primary" required/>
            <div className="flex space-x-4">
                <select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} className="w-full p-2 rounded bg-background border-neutral-600 text-white focus:ring-primary focus:border-primary" required>
                    <option value="">Assign to...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)} 
                </select>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2 rounded bg-background border-neutral-600 text-white focus:ring-primary focus:border-primary" required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-2 rounded bg-background border-neutral-600 text-white focus:ring-primary focus:border-primary" required/>
            </div>
            <button type="submit" className="w-full bg-success text-white p-2 rounded hover:bg-success/90">Create Task</button>
        </form>
    );
}

const TaskManagement: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filters, setFilters] = useState({ status: '', assigned_to: '', priority: '' });
    const [loading, setLoading] = useState(true);

    const { fetchTasks, createTask, deleteTask, fetchAllEmployees } = useWorkAuth();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [fetchedTasks, fetchedEmployees] = await Promise.all([fetchTasks(), fetchAllEmployees()]);
            setTasks(fetchedTasks);
            setEmployees(fetchedEmployees);
            setLoading(false);
        };
        loadData();
    }, [fetchTasks, fetchAllEmployees]);

    const handleCreateTask = async (taskData) => {
        const newTask = await createTask(taskData);
        if (newTask) {
            setTasks([newTask, ...tasks]);
            setShowCreateForm(false);
        }
    };
    
    const handleDeleteTask = async (taskId: string) => {
        const success = await deleteTask(taskId);
        if(success) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    }

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            return (filters.status ? task.status === filters.status : true) &&
                   (filters.assigned_to ? task.assigned_to === filters.assigned_to : true) &&
                   (filters.priority ? task.priority === filters.priority : true);
        });
    }, [tasks, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Manage Tasks</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                    <PlusCircle size={16} className="mr-2"/>
                    {showCreateForm ? 'Cancel' : 'New Task'}
                </button>
            </div>

            {showCreateForm && <CreateTaskForm employees={employees} onCreate={handleCreateTask} />}

            <div className="p-4 bg-background-light rounded-md my-4 border border-neutral-700">
                <div className="flex items-center text-white mb-2"><Filter size={16} className="mr-2"/> Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 rounded bg-background border border-neutral-600 text-white focus:ring-primary focus:border-primary">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select name="assigned_to" value={filters.assigned_to} onChange={handleFilterChange} className="w-full p-2 rounded bg-background border border-neutral-600 text-white focus:ring-primary focus:border-primary">
                        <option value="">All Employees</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)} 
                    </select>
                    <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full p-2 rounded bg-background border border-neutral-600 text-white focus:ring-primary focus:border-primary">
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-neutral-400">Loading tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} readonly={false} />
                        ))
                    ) : (
                        <p className="text-neutral-400 col-span-full text-center">No tasks found for the current filters.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskManagement;
