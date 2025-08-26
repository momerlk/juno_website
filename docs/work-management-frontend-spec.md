# Work Management System Frontend Specification

Create a comprehensive work management system frontend in React.js with employee authentication, role-based dashboards, task management interface for CEOs and employees, performance tracking displays, weekly report submission forms, and notification systems, structured as a /work portal following the ambassador portal pattern with routes registered in App.tsx and organized with contexts, components, and protected routes.

## Overview

This specification outlines the React.js frontend for the work management system, following the same architectural pattern as the ambassador portal. The system provides role-based interfaces for employee management, task assignment, performance tracking, and weekly reporting.

## Project Structure

```
./contexts/WorkAuthContext.tsx           # Authentication context
./components/work/
├── WorkAuth.tsx                         # Login/Register component
├── WorkDashboard.tsx                    # Main dashboard (role-based)
├── ProtectedRoute.tsx                   # Route protection
├── TaskManagement.tsx                   # Task CRUD for CEO
├── TaskList.tsx                         # Task list for employees
├── TaskCard.tsx                         # Individual task component
├── PerformanceStats.tsx                 # Performance display
├── WeeklyReportForm.tsx                 # Report submission
├── WeeklyReportHistory.tsx              # Report history
├── EmployeeList.tsx                     # Employee directory
└── NotificationCenter.tsx               # Notification management
```

## Context Layer

### WorkAuthContext (`./contexts/WorkAuthContext.tsx`)

```tsx
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

interface WorkAuthContextType {
  // Auth state
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
  
  // Task methods
  fetchTasks: (filters?: TaskFilters) => Promise<Task[]>;
  createTask: (task: CreateTaskRequest) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: string) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  
  // Performance methods
  fetchAllPerformance: () => Promise<PerformanceStats[]>;
  fetchEmployeePerformance: (employeeId: string) => Promise<PerformanceStats | null>;
  
  // Report methods
  submitWeeklyReport: (content: string) => Promise<WeeklyReport | null>;
  fetchReports: (employeeId?: string) => Promise<WeeklyReport[]>;
  
  // Employee methods
  fetchAllEmployees: () => Promise<Employee[]>;
  
  // Notification methods
  sendDailySummary: () => Promise<boolean>;
  sendWeeklyReminder: () => Promise<boolean>;
}
```

## Authentication Components

### WorkAuth Component (`./components/work/WorkAuth.tsx`)

```tsx
interface WorkAuthProps {}

const WorkAuth: React.FC<WorkAuthProps> = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Growth team',
    password: '',
    phone: ''
  });
  
  const { login, register } = useWorkAuth();
  const navigate = useNavigate();

  // Form submission logic
  // Role dropdown: CEO, COO, CGO, Growth team
  // Toggle between login/register forms
  // Handle form validation and submission
  // Navigate to dashboard on success
}
```

### Protected Route (`./components/work/ProtectedRoute.tsx`)

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, employee } = useWorkAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/work/auth" replace />;
  }

  if (requiredRole && employee?.role !== requiredRole) {
    return <Navigate to="/work/dashboard" replace />;
  }

  return <>{children}</>;
};
```

## Dashboard Components

### WorkDashboard (`./components/work/WorkDashboard.tsx`)

Main dashboard with role-based content rendering:

```tsx
const WorkDashboard: React.FC = () => {
  const { employee, logout } = useWorkAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Role-based tab rendering
  const renderContent = () => {
    if (employee?.role === 'CEO') {
      return (
        <>
          <OverviewTab />
          <TaskManagement />
          <PerformanceStats />
          <EmployeeList />
          <NotificationCenter />
        </>
      );
    } else {
      return (
        <>
          <MyTasksTab />
          <WeeklyReportForm />
          <ReportHistory />
          <TeamPerformance />
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background-light">
      <Header employee={employee} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TabNavigation 
          tabs={getTabsForRole(employee?.role)} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {renderContent()}
      </div>
    </div>
  );
};
```

## Task Management Components

### TaskManagement (`./components/work/TaskManagement.tsx`)

CEO-only task creation and management interface:

```tsx
const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: '',
    priority: ''
  });

  const {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchAllEmployees
  } = useWorkAuth();

  // Task creation form
  // Task list with edit/delete options
  // Filtering and search functionality
  // Bulk operations for multiple tasks
};
```

### TaskList (`./components/work/TaskList.tsx`)

Employee task view with status updates:

```tsx
const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  
  const { employee, fetchTasks, updateTaskStatus } = useWorkAuth();

  // Display tasks assigned to current employee
  // Status filter buttons
  // Task status update functionality
  // Progress indicators and due date warnings
};
```

### TaskCard (`./components/work/TaskCard.tsx`)

Individual task display component:

```tsx
interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  readonly?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  readonly = false
}) => {
  // Task information display
  // Status badge with color coding
  // Priority indicator
  // Due date with overdue highlighting
  // Action buttons based on user role
};
```

## Performance Components

### PerformanceStats (`./components/work/PerformanceStats.tsx`)

Team performance overview:

```tsx
const PerformanceStats: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceStats[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'completed' | 'rating'>('name');
  
  const { fetchAllPerformance } = useWorkAuth();

  // Performance metrics cards
  // Employee performance table
  // Sorting and filtering options
  // Visual charts for task distribution
  // Report submission status indicators
};
```

## Report Components

### WeeklyReportForm (`./components/work/WeeklyReportForm.tsx`)

Weekly report submission interface:

```tsx
const WeeklyReportForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedThisWeek, setHasSubmittedThisWeek] = useState(false);
  
  const { submitWeeklyReport, fetchReports } = useWorkAuth();

  // Check if already submitted this week
  // Rich text editor for report content
  // Character count and guidelines
  // Submission confirmation
  // AI rating display after submission
};
```

### WeeklyReportHistory (`./components/work/WeeklyReportHistory.tsx`)

Report history and AI feedback display:

```tsx
const WeeklyReportHistory: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  
  const { fetchReports } = useWorkAuth();

  // Report list with ratings
  // Date range filtering
  // Detailed report view modal
  // AI feedback display
  // Performance trend visualization
};
```

## Employee Management Components

### EmployeeList (`./components/work/EmployeeList.tsx`)

Employee directory and management:

```tsx
const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  const { fetchAllEmployees, employee: currentEmployee } = useWorkAuth();

  // Employee cards with photos and contact info
  // Role-based filtering
  // Search functionality
  // Quick task assignment (CEO only)
  // Performance quick view
};
```

## Notification Components

### NotificationCenter (`./components/work/NotificationCenter.tsx`)

Notification management (CEO only):

```tsx
const NotificationCenter: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSummaryTime, setLastSummaryTime] = useState<string | null>(null);
  const [lastReminderTime, setLastReminderTime] = useState<string | null>(null);
  
  const { sendDailySummary, sendWeeklyReminder } = useWorkAuth();

  // Manual notification triggers
  // Notification history
  // Scheduled notification status
  // WhatsApp integration status
};
```

## App.tsx Integration

```tsx
// Add to App.tsx imports
import WorkAuth from "./components/work/WorkAuth";
import WorkDashboard from "./components/work/WorkDashboard";
import WorkProtectedRoute from "./components/work/ProtectedRoute";
import { WorkAuthProvider } from './contexts/WorkAuthContext';

// Add WorkAuthProvider to providers
<WorkAuthProvider>
  <AmbassadorAuthProvider>
    {/* ... other providers */}
  </AmbassadorAuthProvider>
</WorkAuthProvider>

// Add routes in Routes component
<Route path="/work" element={
  <WorkProtectedRoute>
    <Navigate to="/work/dashboard" replace />
  </WorkProtectedRoute>
} />
<Route path="/work/auth" element={<WorkAuth />} />
<Route
  path="/work/dashboard"
  element={
    <WorkProtectedRoute>
      <WorkDashboard />
    </WorkProtectedRoute>
  }
/>

// Update navbar condition
{!window.location.pathname.startsWith('/seller') && 
 !window.location.pathname.startsWith('/admin') && 
 !window.location.pathname.startsWith('/ambassador') &&
 !window.location.pathname.startsWith('/work') && 
 <Navbar />}

// Update footer condition  
{!window.location.pathname.startsWith('/seller') && 
 !window.location.pathname.startsWith('/admin') && 
 !window.location.pathname.startsWith('/ambassador') &&
 !window.location.pathname.startsWith('/work') && 
 <Footer />}
```

## Styling and UI Components

### Design System
- Follow existing Juno design patterns
- Use Tailwind CSS utility classes
- Consistent color scheme with ambassador portal
- Responsive design for mobile and desktop
- Motion animations using framer-motion
- Lucide React icons for consistency

### Color Coding System
- **Pending Tasks**: `text-yellow-400 bg-yellow-400/10`
- **Processing Tasks**: `text-blue-400 bg-blue-400/10`
- **Completed Tasks**: `text-green-400 bg-green-400/10`
- **High Priority**: `border-red-500 bg-red-500/10`
- **Medium Priority**: `border-orange-500 bg-orange-500/10`
- **Low Priority**: `border-green-500 bg-green-500/10`
- **CEO Role**: `text-purple-400 bg-purple-400/10`
- **AI Rating**: `text-blue-300` (0-60), `text-green-300` (61-100)

### Shared Components

#### FormInput Component
```tsx
interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

// Reuse existing FormInput from seller portal
```

#### StatusBadge Component
```tsx
interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: { color: 'text-yellow-400 bg-yellow-400/10', text: 'Pending' },
    processing: { color: 'text-blue-400 bg-blue-400/10', text: 'In Progress' },
    completed: { color: 'text-green-400 bg-green-400/10', text: 'Completed' }
  };
};
```

#### PriorityIndicator Component
```tsx
interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high';
  showText?: boolean;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ 
  priority, 
  showText = true 
}) => {
  // Visual priority indicator with optional text
};
```

#### LoadingSpinner Component
```tsx
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${sizeClasses[size]}`} />
  );
};
```

## State Management Patterns

### Context State Structure
```tsx
interface WorkAuthState {
  // Auth state
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Cache state
  tasks: Task[];
  employees: Employee[];
  performanceStats: PerformanceStats[];
  reports: WeeklyReport[];
  
  // UI state
  activeFilters: TaskFilters;
  selectedTask: Task | null;
  showCreateForm: boolean;
}
```

### API Integration Patterns
```tsx
// Base API configuration
const API_BASE = "https://junoapi-710509977105.asia-south2.run.app/api/v1";

// Request helper with auth
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('work_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};
```

## Role-Based UI Logic

### Dashboard Content Rendering
```tsx
const getDashboardTabs = (role: string) => {
  const baseTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

  if (role === 'CEO') {
    return [
      ...baseTabs,
      { id: 'manage-tasks', label: 'Manage Tasks', icon: Settings },
      { id: 'employees', label: 'Employees', icon: Users },
      { id: 'notifications', label: 'Notifications', icon: Bell }
    ];
  }

  return baseTabs;
};
```

### Permission-Based Component Rendering
```tsx
const usePermissions = () => {
  const { employee } = useWorkAuth();
  
  return {
    canCreateTasks: employee?.role === 'CEO',
    canEditAllTasks: employee?.role === 'CEO',
    canDeleteTasks: employee?.role === 'CEO',
    canViewAllPerformance: true,
    canSendNotifications: employee?.role === 'CEO',
    canViewAllReports: employee?.role === 'CEO'
  };
};
```

## Form Validation

### Task Creation Form Validation
```tsx
interface TaskFormData {
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  due_date: string;
}

const validateTaskForm = (data: TaskFormData) => {
  const errors: Partial<TaskFormData> = {};
  
  if (!data.title.trim()) errors.title = 'Title is required';
  if (!data.description.trim()) errors.description = 'Description is required';
  if (!data.assigned_to) errors.assigned_to = 'Assignee is required';
  if (!data.due_date) errors.due_date = 'Due date is required';
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### Weekly Report Form Validation
```tsx
const validateReportForm = (content: string) => {
  const minLength = 100;
  const maxLength = 5000;
  
  if (!content.trim()) {
    return { isValid: false, error: 'Report content is required' };
  }
  
  if (content.length < minLength) {
    return { 
      isValid: false, 
      error: `Report must be at least ${minLength} characters` 
    };
  }
  
  if (content.length > maxLength) {
    return { 
      isValid: false, 
      error: `Report must not exceed ${maxLength} characters` 
    };
  }
  
  return { isValid: true, error: null };
};
```

## Real-time Updates

### WebSocket Integration (Optional)
```tsx
const useWorkWebSocket = () => {
  const { employee } = useWorkAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    if (employee) {
      const ws = new WebSocket(`wss://api.juno.com/work/ws?employee_id=${employee.id}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle real-time updates for tasks, reports, etc.
      };
      
      setSocket(ws);
      
      return () => ws.close();
    }
  }, [employee]);
  
  return socket;
};
```

## Error Handling

### Global Error Boundary
```tsx
const WorkErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center bg-background-light">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-neutral-400 mb-6">
              {error.message}
            </p>
            <button 
              onClick={resetErrorBoundary}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### API Error Handling
```tsx
const useWorkAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAPICall = async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await apiCall();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, handleAPICall };
};
```

## Performance Optimizations

### Memoization
```tsx
const TaskCard = React.memo<TaskCardProps>(({ task, onStatusChange }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.status === nextProps.task.status;
});
```

### Virtual Scrolling (for large lists)
```tsx
const VirtualTaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  // Implement virtual scrolling for performance with large task lists
  // Use react-window or react-virtualized
};
```

## Accessibility Features

### Keyboard Navigation
```tsx
const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Handle task selection or status change
    }
  };
  
  return (
    <div 
      tabIndex={0}
      onKeyPress={handleKeyPress}
      role="button"
      aria-label={`Task: ${task.title}, Status: ${task.status}`}
    >
      {/* Task content */}
    </div>
  );
};
```

### Screen Reader Support
```tsx
// Proper ARIA labels and roles
<div 
  role="tabpanel" 
  aria-labelledby="tasks-tab"
  aria-hidden={activeTab !== 'tasks'}
>
  <h2 id="tasks-heading" className="sr-only">Task List</h2>
  {/* Task content */}
</div>
```

## Testing Considerations

### Component Testing Setup
```tsx
// Test utilities
const renderWithWorkAuth = (component: React.ReactElement, employee?: Employee) => {
  const mockContextValue = {
    employee: employee || mockEmployee,
    isAuthenticated: true,
    isLoading: false,
    // ... other mock methods
  };
  
  return render(
    <WorkAuthContext.Provider value={mockContextValue}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </WorkAuthContext.Provider>
  );
};
```

### Mock Data
```tsx
const mockEmployee: Employee = {
  id: 'emp-123',
  name: 'John Doe',
  email: 'john@juno.com',
  role: 'CEO',
  phone: '+1234567890',
  created_at: new Date().toISOString()
};

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the new feature',
    assigned_to: 'emp-123',
    assigned_by: 'emp-123',
    status: 'pending',
    priority: 'high',
    due_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];
```

## Mobile Responsiveness

### Responsive Design Patterns
```tsx
const WorkDashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="min-h-screen bg-background-light">
      {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
    </div>
  );
};
```

### Mobile Task Management
```tsx
const MobileTaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div 
      className="bg-background rounded-lg p-4 mb-4"
      initial={false}
      animate={{ height: expanded ? 'auto' : '80px' }}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center"
      >
        <h3 className="text-white font-medium truncate">{task.title}</h3>
        <StatusBadge status={task.status} size="sm" />
      </div>
      {expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-neutral-400 text-sm">{task.description}</p>
          <div className="flex justify-between items-center">
            <PriorityIndicator priority={task.priority} />
            <span className="text-xs text-neutral-500">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
```

This comprehensive specification provides a complete blueprint for implementing the work management system frontend, following the established patterns from the ambassador portal while adding the specific functionality needed for employee management, task tracking, and performance monitoring.