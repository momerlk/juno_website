
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '../api/workApi';

// Type definitions from the spec
interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'CEO' | 'COO' | 'CGO' | 'Growth team';
  phone: string;
  created_at: string;
}

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

interface PerformanceStats {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  tasks_pending: number;
  tasks_processing: number;
  tasks_completed: number;
  average_rating: number;
  last_report_date?: string;
}

interface WeeklyReport {
  id: string;
  employee_id: string;
  week_start: string;
  week_end: string;
  content: string;
  ai_rating: number;
  ai_feedback: string;
  submitted_at: string;
}

interface TaskFilters {
    assigned_to?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface CreateTaskRequest {
    title: string;
    description: string;
    assigned_to: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
}

interface WorkAuthContextType {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
  fetchTasks: (filters?: TaskFilters) => Promise<Task[]>;
  createTask: (task: CreateTaskRequest) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: string) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  fetchAllPerformance: () => Promise<PerformanceStats[]>;
  fetchEmployeePerformance: (employeeId: string) => Promise<PerformanceStats | null>;
  submitWeeklyReport: (content: string) => Promise<WeeklyReport | null>;
  fetchReports: (employeeId?: string) => Promise<WeeklyReport[]>;
  fetchAllEmployees: () => Promise<Employee[]>;
  sendDailySummary: () => Promise<boolean>;
  sendWeeklyReminder: () => Promise<boolean>;
}

const WorkAuthContext = createContext<WorkAuthContextType | undefined>(undefined);

export const WorkAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('work_token');
      if (token) {
        try {
          const data = await apiRequest('/work/auth/me');
          setEmployee(data);
        } catch (error) {
          console.error('Token validation failed', error);
          localStorage.removeItem('work_token');
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest('/work/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('work_token', data.token);
      setEmployee(data.employee);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const register = async (name: string, email: string, role: string, password: string, phone: string) => {
    try {
      await apiRequest('/work/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, role, password, phone }),
      });
      return true;
    } catch (error) {
      console.error('Registration failed', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('work_token');
    setEmployee(null);
  };

  const fetchTasks = async (filters: TaskFilters = {}) => {
    const query = new URLSearchParams(filters as any).toString();
    try {
      const data = await apiRequest(`/work/tasks?${query}`);
      return data.tasks || [];
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      return [];
    }
  };

  const createTask = async (task: CreateTaskRequest) => {
    try {
      const data = await apiRequest('/work/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return data;
    } catch (error) {
      console.error('Failed to create task', error);
      return null;
    }
  };

    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            await apiRequest(`/work/tasks/${taskId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            return true;
        } catch (error) {
            console.error('Failed to update task status', error);
            return false;
        }
    };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await apiRequest(`/work/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('Failed to update task', error);
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/work/tasks/${taskId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Failed to delete task', error);
      return false;
    }
  };

  const fetchAllPerformance = async () => {
    try {
      const data = await apiRequest('/work/performance');
      return data || [];
    } catch (error) {
      console.error('Failed to fetch all performance', error);
      return [];
    }
  };

  const fetchEmployeePerformance = async (employeeId: string) => {
    try {
      const data = await apiRequest(`/work/performance/${employeeId}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch employee performance', error);
      return null;
    }
  };

  const submitWeeklyReport = async (content: string) => {
    try {
      const data = await apiRequest('/work/reports', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return data;
    } catch (error) {
      console.error('Failed to submit weekly report', error);
      return null;
    }
  };

  const fetchReports = async (employeeId?: string) => {
    const query = employeeId ? `?employee_id=${employeeId}` : '';
    try {
      const data = await apiRequest(`/work/reports${query}`);
      return data.reports || [];
    } catch (error) {
      console.error('Failed to fetch reports', error);
      return [];
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const data = await apiRequest('/work/employees');
      return data || [];
    } catch (error) {
      console.error('Failed to fetch employees', error);
      return [];
    }
  };

  const sendDailySummary = async () => {
    try {
      await apiRequest('/work/notifications/daily-summary', { method: 'POST' });
      return true;
    } catch (error) {
      console.error('Failed to send daily summary', error);
      return false;
    }
  };

  const sendWeeklyReminder = async () => {
    try {
      await apiRequest('/work/notifications/weekly-reminder', { method: 'POST' });
      return true;
    } catch (error) {
      console.error('Failed to send weekly reminder', error);
      return false;
    }
  };

  const value = {
    employee,
    isAuthenticated: !!employee,
    isLoading,
    login,
    register,
    logout,
    fetchTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    fetchAllPerformance,
    fetchEmployeePerformance,
    submitWeeklyReport,
    fetchReports,
    fetchAllEmployees,
    sendDailySummary,
    sendWeeklyReminder,
  };

  return <WorkAuthContext.Provider value={value}>{children}</WorkAuthContext.Provider>;
};

export const useWorkAuth = () => {
  const context = useContext(WorkAuthContext);
  if (context === undefined) {
    throw new Error('useWorkAuth must be used within a WorkAuthProvider');
  }
  return context;
};
