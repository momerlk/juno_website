import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { TrendingUp, CheckCircle, Zap, Clock } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';

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

const PerformanceStats: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchAllPerformance } = useWorkAuth();

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      const data = await fetchAllPerformance();
      setPerformanceData(data);
      setLoading(false);
    };
    loadPerformance();
  }, [fetchAllPerformance]);

  const totalCompleted = performanceData.reduce((acc, curr) => acc + curr.tasks_completed, 0);
  const totalPending = performanceData.reduce((acc, curr) => acc + curr.tasks_pending, 0);
  const totalProcessing = performanceData.reduce((acc, curr) => acc + curr.tasks_processing, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Team Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <CheckCircle className="text-success mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{totalCompleted}</div>
                <div className="text-neutral-400">Tasks Completed</div>
            </div>
        </div>
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <Zap className="text-secondary mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{totalProcessing}</div>
                <div className="text-neutral-400">Tasks In Progress</div>
            </div>
        </div>
        <div className="bg-background-light p-4 rounded-lg flex items-center border border-neutral-700">
            <Clock className="text-warning mr-4" size={32}/>
            <div>
                <div className="text-3xl font-bold">{totalPending}</div>
                <div className="text-neutral-400">Tasks Pending</div>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-neutral-300">
          <thead className="text-xs text-neutral-400 uppercase bg-background-light">
            <tr>
              <th scope="col" className="px-6 py-3">Employee</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3 text-center">Completed</th>
              <th scope="col" className="px-6 py-3 text-center">In Progress</th>
              <th scope="col" className="px-6 py-3 text-center">Pending</th>
              <th scope="col" className="px-6 py-3 text-center">Avg. Rating</th>
              <th scope="col" className="px-6 py-3">Last Report</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map(emp => (
              <tr key={emp.employee_id} className="bg-background border-b border-neutral-800 hover:bg-background-light">
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{emp.employee_name}</td>
                <td className="px-6 py-4">{emp.employee_role}</td>
                <td className="px-6 py-4 text-center text-success">{emp.tasks_completed}</td>
                <td className="px-6 py-4 text-center text-secondary">{emp.tasks_processing}</td>
                <td className="px-6 py-4 text-center text-warning">{emp.tasks_pending}</td>
                <td className="px-6 py-4 text-center">{emp.average_rating.toFixed(1)}%</td>
                <td className="px-6 py-4">{emp.last_report_date ? new Date(emp.last_report_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceStats;
