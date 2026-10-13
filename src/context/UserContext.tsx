import '../styles/globals.css'

// Mock data for demonstration
const mockData = {
  employees: [
    { id: 'emp_1', name: 'Alice Johnson', email: 'alice@example.com', designation: 'Software Engineer', phone: '555-0101', joined: '2024-01-15', role: 'admin' },
    { id: 'emp_2', name: 'Bob Smith', email: 'bob@example.com', designation: 'Product Manager', phone: '555-0102', joined: '2024-02-01', role: 'user' },
    { id: 'emp_3', name: 'Carol Davis', email: 'carol@example.com', designation: 'Designer', phone: '555-0103', joined: '2024-03-10', role: 'user' },
    { id: 'emp_4', name: 'David Wilson', email: 'david@example.com', designation: 'Developer', phone: '555-0104', joined: '2024-03-15', role: 'user' },
  ],
  tasks: [
    { id: 'task_1', title: 'User Dashboard Redesign', description: 'Redesign the main dashboard with a modern UI', employeeId: 'emp_3', assignedDate: '2024-03-01', deadline: '2024-04-15', priority: 'High', status: 'In Progress', progress: 65, remarks: 'Needs more polish on mobile', history: [{ date: '2024-03-05', oldProgress: 0, newProgress: 65, note: 'Started work' }] },
    { id: 'task_2', title: 'API Integration', description: 'Integrate third-party payment API', employeeId: 'emp_1', assignedDate: '2024-03-05', deadline: '2024-04-01', priority: 'High', status: 'In Progress', progress: 40, remarks: '', history: [{ date: '2024-03-06', oldProgress: 0, newProgress: 40, note: 'API keys configured' }] },
    { id: 'task_3', title: 'Project Proposal', description: 'Write Q2 project proposal document', employeeId: 'emp_2', assignedDate: '2024-03-10', deadline: '2024-03-20', priority: 'Medium', status: 'Completed', progress: 100, remarks: 'Submitted to management', history: [{ date: '2024-03-15', oldProgress: 0, newProgress: 100, note: 'Proposal approved' }] },
    { id: 'task_4', title: 'Email Marketing Campaign', description: 'Create Q2 email marketing campaign', employeeId: 'emp_4', assignedDate: '2024-03-12', deadline: '2024-03-30', priority: 'Medium', status: 'Not Started', progress: 0, remarks: '', history: [] },
    { id: 'task_5', title: 'Database Optimization', description: 'Optimize database queries for better performance', employeeId: 'emp_1', assignedDate: '2024-03-15', deadline: '2024-04-10', priority: 'High', status: 'On Hold', progress: 45, remarks: 'Waiting for DB team', history: [{ date: '2024-03-15', oldProgress: 0, newProgress: 45, note: 'Started' }] },
    { id: 'task_6', title: 'Mobile App UI', description: 'Create mobile app interface design', employeeId: 'emp_3', assignedDate: '2024-03-18', deadline: '2024-04-20', priority: 'Low', status: 'Not Started', progress: 0, remarks: '', history: [] },
  ],
  settings: {
    admin: { email: 'admin@example.com', password: 'admin123' },
    users: [
      { email: 'alice@example.com', password: 'alicepass', name: 'Alice Johnson', designation: 'Software Engineer', phone: '555-0101', joined: '2024-01-15', role: 'admin' },
      { email: 'bob@example.com', password: 'bobpass', name: 'Bob Smith', designation: 'Product Manager', phone: '555-0102', joined: '2024-02-01', role: 'user' },
      { email: 'carol@example.com', password: 'carolpass', name: 'Carol Davis', designation: 'Designer', phone: '555-0103', joined: '2024-03-10', role: 'user' },
      { email: 'david@example.com', password: 'davidpass', name: 'David Wilson', designation: 'Developer', phone: '555-0104', joined: '2024-03-15', role: 'user' },
    ]
  }
};

// Type definitions
// export interface UserProfile {
//   id: string;
//   email: string;
//   password: string;
//   name: string;
//   designation: string;
//   phone: string;
//   joined: string;
//   role: 'admin' | 'user';
// }

// export interface TaskItem {
//   id: string;
//   title: string;
//   description: string;
//   employeeId: string;
//   assignedDate: string;
//   deadline: string;
//   priority: 'Low' | 'Medium' | 'High';
//   status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
//   progress: number;
//   remarks: string;
//   history: { date: string; oldProgress: number; newProgress: number; note: string }[];
// }

// export interface Employee {
//   id: string;
//   email: string;
//   password: string;
//   name: string;
//   designation: string;
//   phone: string;
//   joined: string;
//   role: 'admin' | 'user';
// }

// export interface UserContextType {
//   login: (email: string, password: string) => boolean;
//   logout: () => void;
//   signup: (user: Omit<UserProfile, 'id'>) => boolean;
//   currentUser: UserProfile | null;
//   employees: Employee[];
//   tasks: TaskItem[];
//   addEmployee: (employee: Omit<Employee, 'id'>) => void;
//   addTask: (task: Omit<TaskItem, 'id'>) => void;
//   updateTask: (id: string, updates: Partial<TaskItem>) => void;
//   deleteTask: (id: string) => void;
//   updateProgress: (id: string, progress: number, note: string) => void;
// }

// Create a mock context provider
const UserContext = React.createContext<UserContextType | null>(null);

export { UserContext, mockData };
