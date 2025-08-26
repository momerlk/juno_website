import React, { useEffect, useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Users, CheckCircle, Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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

const CEOOverview: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchAllPerformance, fetchAllEmployees } = useWorkAuth();
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [perfData, empData] = await Promise.all([
        fetchAllPerformance(),
        fetchAllEmployees()
      ]);
      setPerformanceData(perfData);
      setEmployeeCount(empData.length);
      setLoading(false);
    };
    loadData();
  }, [fetchAllPerformance, fetchAllEmployees]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalCompleted = performanceData.reduce((acc, curr) => acc + curr.tasks_completed, 0);
  const totalProcessing = performanceData.reduce((acc, curr) => acc + curr.tasks_processing, 0);
  const totalPending = performanceData.reduce((acc, curr) => acc + curr.tasks_pending, 0);

  const topPerformer = [...performanceData].sort((a, b) => b.tasks_completed - a.tasks_completed)[0];
  const needsAttention = [...performanceData].sort((a, b) => a.average_rating - b.average_rating)[0];

  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-background-light p-6 rounded-lg flex items-center border border-neutral-800">
                <Users className="text-primary mr-4" size={32}/>
                <div>
                    <div className="text-3xl font-bold">{employeeCount}</div>
                    <div className="text-neutral-400">Total Employees</div>
                </div>
            </div>
            <div className="bg-background-light p-6 rounded-lg flex items-center border border-neutral-800">
                <CheckCircle className="text-success mr-4" size={32}/>
                <div>
                    <div className="text-3xl font-bold">{totalCompleted}</div>
                    <div className="text-neutral-400">Tasks Completed</div>
                </div>
            </div>
            <div className="bg-background-light p-6 rounded-lg flex items-center border border-neutral-800">
                <Zap className="text-secondary mr-4" size={32}/>
                <div>
                    <div className="text-3xl font-bold">{totalProcessing}</div>
                    <div className="text-neutral-400">Tasks In Progress</div>
                </div>
            </div>
            <div className="bg-background-light p-6 rounded-lg flex items-center border border-neutral-800">
                <Clock className="text-warning mr-4" size={32}/>
                <div>
                    <div className="text-3xl font-bold">{totalPending}</div>
                    <div className="text-neutral-400">Tasks Pending</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background-light p-6 rounded-lg border border-neutral-800">
                <h3 className="text-xl font-bold text-white mb-4">Team Performance Snapshot</h3>
                <PerformanceTable data={performanceData} />
            </div>
            <div className="space-y-6">
                <div className="bg-background-light p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center"><TrendingUp className="mr-2 text-success"/>Top Performer</h3>
                    {topPerformer ? (
                        <div>
                            <p className="text-lg text-white">{topPerformer.employee_name}</p>
                            <p className="text-sm text-neutral-400">{topPerformer.employee_role}</p>
                            <p className="text-sm mt-2"><span className="text-success">{topPerformer.tasks_completed}</span> tasks completed</p>
                        </div>
                    ) : <p className="text-neutral-400">No data</p>}
                </div>
                <div className="bg-background-light p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center"><AlertCircle className="mr-2 text-warning"/>Needs Attention</h3>
                     {needsAttention ? (
                        <div>
                            <p className="text-lg text-white">{needsAttention.employee_name}</p>
                            <p className="text-sm text-neutral-400">{needsAttention.employee_role}</p>
                            <p className="text-sm mt-2">Avg. rating: <span className="text-warning">{needsAttention.average_rating.toFixed(1)}%</span></p>
                        </div>
                    ) : <p className="text-neutral-400">No data</p>}
                </div>
            </div>
        </div>
    </div>
  );
};

const PerformanceTable = ({ data }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-neutral-300">
            <thead className="text-xs text-neutral-400 uppercase bg-neutral-800">
                <tr>
                    <th scope="col" className="px-6 py-3">Employee</th>
                    <th scope="col" className="px-6 py-3 text-center">Completed</th>
                    <th scope="col" className="px-6 py-3 text-center">In Progress</th>
                    <th scope="col" className="px-6 py-3 text-center">Pending</th>
                    <th scope="col" className="px-6 py-3 text-center">Avg. Rating</th>
                </tr>
            </thead>
            <tbody>
                {data.map(emp => (
                    <tr key={emp.employee_id} className="bg-background-light border-b border-neutral-800 hover:bg-neutral-800/50">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{emp.employee_name}</td>
                        <td className="px-6 py-4 text-center text-success">{emp.tasks_completed}</td>
                        <td className="px-6 py-4 text-center text-secondary">{emp.tasks_processing}</td>
                        <td className="px-6 py-4 text-center text-warning">{emp.tasks_pending}</td>
                        <td className="px-6 py-4 text-center">{emp.average_rating.toFixed(1)}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
