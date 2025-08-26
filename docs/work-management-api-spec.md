# Work Management System API Specification

Create a comprehensive work/employee management system API for Juno with authentication, task management, performance tracking, weekly reporting with AI evaluation, and WhatsApp notifications for daily task summaries and weekly report reminders, structured with /work prefix routes using Go net/http, MongoDB with Google UUID strings, organized in handlers/services/repositories/models directories with Swagger documentation.

## Overview

This specification outlines the API endpoints for a work management system that allows employee registration, task assignment (CEO-only), performance tracking, weekly reporting with AI evaluation, and WhatsApp integration for notifications.

## Project Structure

```
./handlers/work_*.go       # HTTP handlers
./services/work_*.go       # Business logic
./repositories/work_*.go   # Database operations
./models/work_*.go         # Data models
```

## Data Models

### Employee Model (`./models/work_employee.go`)

```go
type Employee struct {
    ID          string    `json:"id" bson:"id"`
    ObjectID    primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
    Name        string    `json:"name" bson:"name"`
    Email       string    `json:"email" bson:"email"`
    Role        string    `json:"role" bson:"role"` // "CEO", "COO", "CGO", "Growth team"
    Password    string    `json:"-" bson:"password"` // bcrypt hashed
    Phone       string    `json:"phone" bson:"phone"` // for WhatsApp notifications
    CreatedAt   time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
}
```

### Task Model (`./models/work_task.go`)

```go
type Task struct {
    ID          string    `json:"id" bson:"id"`
    ObjectID    primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
    Title       string    `json:"title" bson:"title"`
    Description string    `json:"description" bson:"description"`
    AssignedTo  string    `json:"assigned_to" bson:"assigned_to"` // Employee ID
    AssignedBy  string    `json:"assigned_by" bson:"assigned_by"` // CEO ID
    Status      string    `json:"status" bson:"status"` // "pending", "processing", "completed"
    Priority    string    `json:"priority" bson:"priority"` // "low", "medium", "high"
    DueDate     time.Time `json:"due_date" bson:"due_date"`
    CreatedAt   time.Time `json:"created_at" bson:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
    CompletedAt *time.Time `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
}
```

### Weekly Report Model (`./models/work_report.go`)

```go
type WeeklyReport struct {
    ID          string    `json:"id" bson:"id"`
    ObjectID    primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
    EmployeeID  string    `json:"employee_id" bson:"employee_id"`
    WeekStart   time.Time `json:"week_start" bson:"week_start"`
    WeekEnd     time.Time `json:"week_end" bson:"week_end"`
    Content     string    `json:"content" bson:"content"`
    AIRating    int       `json:"ai_rating" bson:"ai_rating"` // 0-100
    AIFeedback  string    `json:"ai_feedback" bson:"ai_feedback"`
    SubmittedAt time.Time `json:"submitted_at" bson:"submitted_at"`
    CreatedAt   time.Time `json:"created_at" bson:"created_at"`
}
```

### Performance Stats Model (`./models/work_performance.go`)

```go
type PerformanceStats struct {
    EmployeeID      string `json:"employee_id" bson:"employee_id"`
    EmployeeName    string `json:"employee_name" bson:"employee_name"`
    EmployeeRole    string `json:"employee_role" bson:"employee_role"`
    TasksPending    int    `json:"tasks_pending" bson:"tasks_pending"`
    TasksProcessing int    `json:"tasks_processing" bson:"tasks_processing"`
    TasksCompleted  int    `json:"tasks_completed" bson:"tasks_completed"`
    AverageRating   float64 `json:"average_rating" bson:"average_rating"`
    LastReportDate  *time.Time `json:"last_report_date,omitempty" bson:"last_report_date,omitempty"`
}
```

## API Endpoints

### Authentication Endpoints

#### Register Employee
- **POST** `/work/auth/register`
- **Description**: Register a new employee
- **Request Body**:
```json
{
    "name": "string",
    "email": "string",
    "role": "CEO|COO|CGO|Growth team",
    "password": "string",
    "phone": "string"
}
```
- **Response**: `201 Created`
```json
{
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "string",
    "created_at": "timestamp"
}
```

#### Login Employee
- **POST** `/work/auth/login`
- **Description**: Authenticate employee
- **Request Body**:
```json
{
    "email": "string",
    "password": "string"
}
```
- **Response**: `200 OK`
```json
{
    "token": "jwt_token",
    "employee": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "string"
    }
}
```

#### Get Current Employee
- **GET** `/work/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "string",
    "phone": "string"
}
```

### Task Management Endpoints

#### Create Task (CEO Only)
- **POST** `/work/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create a new task (CEO only)
- **Request Body**:
```json
{
    "title": "string",
    "description": "string",
    "assigned_to": "employee_id",
    "priority": "low|medium|high",
    "due_date": "timestamp"
}
```
- **Response**: `201 Created`

#### Get Tasks
- **GET** `/work/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `assigned_to` (optional): Filter by employee ID
  - `status` (optional): Filter by status
  - `page` (default: 1)
  - `limit` (default: 20)
- **Response**: `200 OK`
```json
{
    "tasks": [Task],
    "total": "int",
    "page": "int",
    "limit": "int"
}
```

#### Get Task by ID
- **GET** `/work/tasks/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - Task object

#### Update Task Status
- **PUT** `/work/tasks/{id}/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
    "status": "pending|processing|completed"
}
```
- **Response**: `200 OK`

#### Update Task (CEO Only)
- **PUT** `/work/tasks/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Task fields to update
- **Response**: `200 OK`

#### Delete Task (CEO Only)
- **DELETE** `/work/tasks/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `204 No Content`

### Performance Endpoints

#### Get All Employee Performance
- **GET** `/work/performance`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Get performance stats for all employees
- **Response**: `200 OK`
```json
[
    {
        "employee_id": "uuid",
        "employee_name": "string",
        "employee_role": "string",
        "tasks_pending": "int",
        "tasks_processing": "int",
        "tasks_completed": "int",
        "average_rating": "float64",
        "last_report_date": "timestamp"
    }
]
```

#### Get Employee Performance
- **GET** `/work/performance/{employee_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - PerformanceStats object

### Weekly Report Endpoints

#### Submit Weekly Report
- **POST** `/work/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
    "content": "string"
}
```
- **Response**: `201 Created`
```json
{
    "id": "uuid",
    "ai_rating": "int",
    "ai_feedback": "string",
    "submitted_at": "timestamp"
}
```

#### Get Weekly Reports
- **GET** `/work/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `employee_id` (optional): Filter by employee
  - `week_start` (optional): Filter by week
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response**: `200 OK`

#### Get Weekly Report by ID
- **GET** `/work/reports/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - WeeklyReport object

### Employee Management Endpoints

#### Get All Employees
- **GET** `/work/employees`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
[
    {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "role": "string",
        "created_at": "timestamp"
    }
]
```

#### Get Employee by ID
- **GET** `/work/employees/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - Employee object (without password)

### Notification Endpoints

#### Send Daily Task Summary
- **POST** `/work/notifications/daily-summary`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Manually trigger daily task summary (CEO only)
- **Response**: `200 OK`

#### Send Weekly Report Reminder
- **POST** `/work/notifications/weekly-reminder`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Manually trigger weekly report reminder (CEO only)
- **Response**: `200 OK`

## Repository Layer (`./repositories/work_*.go`)

### EmployeeRepository
- `Create(employee *Employee) error`
- `GetByEmail(email string) (*Employee, error)`
- `GetByID(id string) (*Employee, error)`
- `GetAll() ([]*Employee, error)`
- `Update(id string, updates map[string]interface{}) error`
- `Delete(id string) error`

### TaskRepository
- `Create(task *Task) error`
- `GetByID(id string) (*Task, error)`
- `GetByEmployeeID(employeeID string, status string, page, limit int) ([]*Task, int, error)`
- `GetAll(page, limit int) ([]*Task, int, error)`
- `Update(id string, updates map[string]interface{}) error`
- `Delete(id string) error`
- `GetTaskCountsByEmployeeAndStatus(employeeID, status string) (int, error)`

### ReportRepository
- `Create(report *WeeklyReport) error`
- `GetByID(id string) (*WeeklyReport, error)`
- `GetByEmployeeAndWeek(employeeID string, weekStart time.Time) (*WeeklyReport, error)`
- `GetByEmployee(employeeID string, page, limit int) ([]*WeeklyReport, int, error)`
- `GetAll(page, limit int) ([]*WeeklyReport, int, error)`
- `Update(id string, updates map[string]interface{}) error`

## Service Layer (`./services/work_*.go`)

### AuthService
- `Register(name, email, role, password, phone string) (*Employee, error)`
- `Login(email, password string) (string, *Employee, error)`
- `ValidateToken(token string) (*Employee, error)`
- `GenerateToken(employee *Employee) (string, error)`

### TaskService
- `CreateTask(title, description, assignedTo, assignedBy, priority string, dueDate time.Time) (*Task, error)`
- `GetTasksByEmployee(employeeID string, status string, page, limit int) ([]*Task, int, error)`
- `UpdateTaskStatus(taskID, status string, employeeID string) error`
- `GetTaskByID(taskID string) (*Task, error)`
- `UpdateTask(taskID string, updates map[string]interface{}, requesterID string) error`
- `DeleteTask(taskID, requesterID string) error`

### PerformanceService
- `GetAllPerformance() ([]*PerformanceStats, error)`
- `GetEmployeePerformance(employeeID string) (*PerformanceStats, error)`
- `CalculatePerformanceStats(employeeID string) (*PerformanceStats, error)`

### ReportService
- `SubmitReport(employeeID, content string) (*WeeklyReport, error)`
- `EvaluateReportWithAI(content string) (int, string, error)`
- `GetReportsByEmployee(employeeID string, page, limit int) ([]*WeeklyReport, int, error)`
- `GetReportByID(reportID string) (*WeeklyReport, error)`
- `CheckReportSubmission(employeeID string, weekStart time.Time) (bool, error)`

### NotificationService
- `SendDailyTaskSummary() error`
- `SendWeeklyReportReminder() error`

## OTPService (already implemented)
- `sendWhatsapp(phone, message string) error`

## Handler Layer (`./handlers/work_*.go`)

All handlers should include proper Swagger documentation using go-swag comments:

```go
// @Summary Register employee
// @Description Register a new employee in the work management system
// @Tags work-auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} Employee
// @Failure 400 {object} ErrorResponse
// @Router /work/auth/register [post]
```

## Main.go Registration

```go
// Work Management System routes
http.HandleFunc("/work/auth/register", workHandlers.Register)
http.HandleFunc("/work/auth/login", workHandlers.Login)
http.HandleFunc("/work/auth/me", workHandlers.GetCurrentEmployee)

http.HandleFunc("/work/tasks", workHandlers.HandleTasks)
http.HandleFunc("/work/tasks/", workHandlers.HandleTaskByID)

http.HandleFunc("/work/performance", workHandlers.HandlePerformance)
http.HandleFunc("/work/performance/", workHandlers.HandleEmployeePerformance)

http.HandleFunc("/work/reports", workHandlers.HandleReports)
http.HandleFunc("/work/reports/", workHandlers.HandleReportByID)

http.HandleFunc("/work/employees", workHandlers.HandleEmployees)
http.HandleFunc("/work/employees/", workHandlers.HandleEmployeeByID)

http.HandleFunc("/work/notifications/daily-summary", workHandlers.SendDailySummary)
http.HandleFunc("/work/notifications/weekly-reminder", workHandlers.SendWeeklyReminder)
```

## Background Jobs

### Daily Task Summary (End of each day)
- Cron job to run at 6 PM daily
- Collect task counts for each employee
- Send WhatsApp messages with task summaries

### Weekly Report Reminder (Every Friday)
- Cron job to run at 9 AM every Friday
- Check which employees haven't submitted reports
- Send WhatsApp reminders

## External Integrations

### Gemini 2.5 Flash API
- Endpoint for evaluating weekly reports
- Rate reports on a scale of 0-100
- Provide constructive feedback

### WhatsApp Business API
- Send daily task summaries
- Send weekly report reminders
- Format messages professionally
- sendWhatsapp already implemented in otp_service.go

## Security & Middleware

### JWT Authentication
- All protected endpoints require valid JWT token
- Token contains employee ID and role
- CEO role required for task creation/management endpoints

### Role-based Access Control
- CEO: Full access to all endpoints
- Other roles: Limited access based on permissions

### Input Validation
- Validate all request bodies
- Sanitize inputs to prevent injection attacks
- Rate limiting on authentication endpoints

## Error Handling

Standard HTTP status codes with JSON error responses:

```json
{
    "error": "string",
    "message": "string",
    "code": "int"
}
```

## Database Indexes

### MongoDB Indexes
- `employees`: email (unique), role
- `tasks`: assigned_to, status, due_date, assigned_by
- `reports`: employee_id, week_start (compound unique)

## Configuration

Environment variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`