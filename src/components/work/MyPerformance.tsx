import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import { TrendingUp, CheckCircle, Zap, Clock, Star, Calendar } from 'lucide-react';

interface PerformanceStatsData {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  tasks_pending: number;
  tasks_processing: number;
  tasks_completed: number;
  average_rating: number;
  last_report_date?: string;
}

const MyPerformance: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { employee, fetchEmployeePerformance } = useWorkAuth();

  useEffect(() => {
    const loadPerformance = async () => {
      if (employee) {
        setLoading(true);
        const data = await fetchEmployeePerformance(employee.id);
        setStats(data);
        setLoading(false);
      }
    };
    loadPerformance();
  }, [employee, fetchEmployeePerformance]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <div className="text-center text-neutral-400 p-8">Could not load your performance data.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">My Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <CheckCircle className="text-success mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{stats.tasks_completed}</div>
                <div className="text-neutral-400">Tasks Completed</div>
            </div>
        </div>
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <Zap className="text-secondary mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{stats.tasks_processing}</div>
                <div className="text-neutral-400">Tasks In Progress</div>
            </div>
        </div>
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <Clock className="text-warning mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{stats.tasks_pending}</div>
                <div className="text-neutral-400">Tasks Pending</div>
            </div>
        </div>
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <Star className="text-primary mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{stats.average_rating.toFixed(1)}%</div>
                <div className="text-neutral-400">Avg. Report Rating</div>
            </div>
        </div>
      </div>

      <div className="bg-background-light p-4 rounded-lg border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-2">Summary</h3>
        <p className="text-neutral-400">Last weekly report submitted on: {stats.last_report_date ? new Date(stats.last_report_date).toLocaleDateString() : 'N/A'}</p>
      </div>

    </div>
  );
};

export default MyPerformance;
