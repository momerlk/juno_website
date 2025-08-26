import React, { useState } from 'react';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import TaskManagement from './TaskManagement';
import TaskList from './TaskList';
import PerformanceStats from './PerformanceStats';
import WeeklyReportForm from './WeeklyReportForm';
import WeeklyReportHistory from './WeeklyReportHistory';
import EmployeeList from './EmployeeList';
import NotificationCenter from './NotificationCenter';
import { BarChart3, CheckSquare, FileText, TrendingUp, Settings, Users, Bell, LogOut } from 'lucide-react';
import MyPerformance from './MyPerformance';
import CEOOverview from './CEOOverview';

const Header = ({ employee, onLogout } : any ) => (
    <header className="bg-background-light text-white p-4 flex justify-between items-center shadow-md border-b border-neutral-800">
        <div className="text-xl font-bold">Juno Work Management</div>
        <div className="flex items-center">
            <span className="mr-4 text-neutral-300">Welcome, <span className='text-white font-semibold'>{employee?.name}</span> ({employee?.role})</span>
            <button onClick={onLogout} className="flex items-center text-neutral-400 hover:text-white transition-colors">
                <LogOut size={18} className="mr-1" /> 
                Logout
            </button>
        </div>
    </header>
);

const TabNavigation = ({ tabs, activeTab, onTabChange } : any) => (
    <nav className="flex border-b border-neutral-700">
        {tabs.map((tab : any) => (
            <button 
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === tab.id ? 'border-b-2 border-primary text-white' : 'text-neutral-400 hover:text-white border-b-2 border-transparent'}`}>
                <tab.icon className="mr-2" size={16} />
                {tab.label}
            </button>
        ))}
    </nav>
);

const getTabsForRole = (role : any) => {
    const baseTabs = [
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'performance', label: 'My Performance', icon: TrendingUp }
    ];

    if (role === 'CEO') {
        return [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'manage-tasks', label: 'Manage Tasks', icon: Settings },
            { id: 'team-performance', label: 'Team Performance', icon: TrendingUp },
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'notifications', label: 'Notifications', icon: Bell }
        ];
    }

    return baseTabs;
};

const WorkDashboard: React.FC = () => {
  const { employee, logout } = useWorkAuth();
  const [activeTab, setActiveTab] = useState(employee?.role === 'CEO' ? 'overview' : 'tasks');

  const tabs = getTabsForRole(employee?.role);

  const renderContent = () => {
    if (employee?.role === 'CEO') {
      switch (activeTab) {
        case 'overview': return <CEOOverview />;
        case 'manage-tasks': return <TaskManagement />;
        case 'team-performance': return <PerformanceStats />;
        case 'employees': return <EmployeeList />;
        case 'notifications': return <NotificationCenter />;
        default: return <CEOOverview />;
      }
    } else {
      switch (activeTab) {
        case 'tasks': return <TaskList />;
        case 'reports': return <div className="space-y-6"><WeeklyReportForm /><WeeklyReportHistory /></div>;
        case 'performance': return <MyPerformance />;
        default: return <TaskList />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background-light">
      <Header employee={employee} onLogout={logout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-background rounded-lg border border-neutral-800">
            <TabNavigation 
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div className="p-6">
                {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDashboard;
