# Employee Task Tracker - Next.js

A modern, full-featured Employee Task Tracker built with **Next.js**, featuring role-based access, dynamic UI, and comprehensive task management.

## Features

### 🔐 Authentication & Access Control
- **Admin Login** - Secure admin access with email/password
- **User Roles** - Admin and regular user roles
- **User Management** - Admin can add new users with email and password
- **Role-Based Views** - Admin sees all data, users see their assigned tasks only

### 📊 Dashboard
- **Summary Cards** - Total Employees, Total Tasks, Completed, In Progress, Overdue
- **Status Chart** - Visual breakdown of task statuses
- **Per-Employee Progress** - Average completion percentage for each employee
- **Task Table** - Complete task overview with progress bars

### 👥 Employee Management
- Add, edit, and delete employees
- Fields: Full Name, Designation, Contact, Email, Joined Date
- Role assignment (Admin/User)
- Search and filter capabilities

### ✅ Task Management
- Add, edit, delete tasks
- Fields: Task Title, Description, Assigned Employee, Assigned Date, Deadline, Priority, Status, Progress %, Remarks
- **Auto-complete status** (sets to Completed when progress = 100%)
- **Quick status and progress updates**
- Update history tracking
- Overdue tasks highlighted in red
- Due within 3 days highlighted in orange

### 🤖 RAG-Powered AI Copilot & Multi-Model Studio
- **Grounded Task Intelligence**: Connects directly to live task tracker database via RAG (Retrieval-Augmented Generation) to analyze tasks, deadlines, assignee workloads, and update histories.
- **Multi-Model Provider Gateway**:
  - **Groq (Primary / Default)**: Lightning-fast inference with Llama 3.3 70B, Llama 3.1 8B, and Mixtral 8x7B.
  - **OpenAI (ChatGPT)**: GPT-4o, GPT-4o Mini, and GPT-3.5 Turbo.
  - **Anthropic (Claude)**: Claude 3.5 Sonnet and Claude 3.5 Haiku.
  - **Google Gemini**: Gemini 1.5 Flash, Gemini 1.5 Pro, and Gemini 2.0 Flash.
- **Multimodal Vision**: Attach screenshots, project wireframes, or error logs for instant AI visual inspection.
- **Universal Floating Widget**: Dockable copilot in bottom-right corner of all dashboard pages with quick prompt pills.
- **Dedicated AI Studio**: Full-screen workspace (`/dashboard/ai-assistant`) with custom document ingestion.
- **Flexible Key Management (BYOK)**: In-app interactive key settings with live connection test and `.env` fallback.

### 🎨 Dynamic UI Features
- **Dark/Light mode** toggle
- **Responsive design** - Works on desktop and mobile
- **Animated charts** - Doughnut and bar charts
- **Glass morphism** effects
- **Smooth animations** and transitions
- **Toast notifications** for actions
- **Confirmation dialogs** for deletions

### 📱 Additional Features
- **Print-friendly report** for employees
- **Export to CSV** (admin only)
- **Search and filter** tasks
- **Sort by** deadline, priority, or progress
- **Filter by** employee, status, priority, deadline range

## Directory Structure

```
task-tracker/
├── src/
│   ├── pages/
│   │   └── index.tsx      # Main dashboard page
│   ├── components/        # Reusable React components
│   ├── context/           # State management context
│   └── styles/
│       └── globals.css    # Global styles with Tailwind
├── public/                # Static files
├── package.json           # Dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Navigate to the project directory**
   ```bash
   cd task-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional for AI Copilot)**
   ```bash
   cp .env.example .env
   # Add your GROQ_API_KEY (Primary - free at https://console.groq.com/keys)
   # Or configure keys interactively in the UI Settings modal
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Default Admin Credentials

- **Email:** admin@example.com
- **Password:** admin123

## User Management (Admin Only)

The admin can:
- View all employees and tasks
- Add new users with email and password
- Assign roles (Admin/User)
- Manage all tasks
- Export data to CSV
- Print reports

Regular users can:
- View their own assigned tasks
- Update task status and progress
- View their per-employee progress

## Data Storage

All data is stored in **localStorage** (in-memory for this demo). In a production environment, you would connect to a database.

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React** - UI library
- **localStorage** - Data persistence

## License

MIT
