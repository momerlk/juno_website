import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { Users, Search } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

const EmployeeList: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const { fetchAllEmployees } = useWorkAuth();

    useEffect(() => {
        const loadEmployees = async () => {
            setLoading(true);
            const data = await fetchAllEmployees();
            setEmployees(data);
            setLoading(false);
        };
        loadEmployees();
    }, [fetchAllEmployees]);

    const filteredEmployees = employees
        .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(emp => roleFilter ? emp.role === roleFilter : true);

    const roles = [...new Set(employees.map(e => e.role))];

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Employee Directory</h2>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20}/>
                    <input 
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-background-light text-white pl-10 pr-4 py-2 rounded-md border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <select 
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-background-light text-white px-4 py-2 rounded-md border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Roles</option>
                    {roles.map(role => <option key={role} value={role}>{role}</option>)} 
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map(emp => (
                    <div key={emp.id} className="bg-background-light p-4 rounded-lg border border-neutral-800">
                        <h3 className="font-bold text-lg text-white">{emp.name}</h3>
                        <p className="text-sm text-secondary">{emp.role}</p>
                        <p className="text-sm text-neutral-400 mt-2">{emp.email}</p>
                        <p className="text-xs text-neutral-500 mt-2">Joined: {new Date(emp.created_at).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
