import prisma from '@/lib/prisma';

export interface RagSource {
  type: 'task' | 'employee' | 'document' | 'metric';
  id?: string;
  title: string;
  subtitle?: string;
  detail?: string;
}

export interface RagContextResult {
  systemPrompt: string;
  sources: RagSource[];
  metricsSummary: {
    totalEmployees: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
  };
}

export async function buildRagContext(
  userQuery: string,
  customDocs?: string[]
): Promise<RagContextResult> {
  const queryLower = userQuery.toLowerCase();

  // 1. Fetch live data from database with error handling
  let tasks: any[] = [];
  let employees: any[] = [];

  try {
    tasks = await prisma.task.findMany({
      include: {
        employee: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { deadline: 'asc' },
    });
  } catch (error) {
    console.warn('RAG: Could not load tasks from Prisma, using fallback if any', error);
  }

  try {
    employees = await prisma.employee.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            progress: true,
            deadline: true,
          },
        },
      },
    });
  } catch (error) {
    console.warn('RAG: Could not load employees from Prisma, using fallback if any', error);
  }

  // 2. Compute live aggregate analytics
  const now = new Date();
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueTasksList = tasks.filter(
    (t) => t.status !== 'COMPLETED' && new Date(t.deadline) < now
  );
  const overdueTasksCount = overdueTasksList.length;
  const highPriorityTasks = tasks.filter(
    (t) => t.priority === 'HIGH' && t.status !== 'COMPLETED'
  ).length;

  const metricsSummary = {
    totalEmployees: employees.length,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks: overdueTasksCount,
    highPriorityTasks,
  };

  // 3. Relevance scoring for RAG retrieval
  const queryTokens = queryLower
    .split(/[\s,?.!]+/)
    .filter((token) => token.length > 2);

  const matchedSources: RagSource[] = [];

  // Always include overall metric source
  matchedSources.push({
    type: 'metric',
    title: 'Workspace Metrics',
    subtitle: `${tasks.length} total tasks, ${employees.length} employees, ${overdueTasksCount} overdue`,
  });

  // Score tasks
  const scoredTasks = tasks.map((task) => {
    let score = 0;
    const taskTitle = (task.title || '').toLowerCase();
    const taskDesc = (task.description || '').toLowerCase();
    const empName = (task.employee?.name || '').toLowerCase();
    const status = (task.status || '').toLowerCase();
    const priority = (task.priority || '').toLowerCase();

    // Query intent matching
    if (queryLower.includes('overdue') && new Date(task.deadline) < now && task.status !== 'COMPLETED') {
      score += 15;
    }
    if ((queryLower.includes('urgent') || queryLower.includes('high priority')) && task.priority === 'HIGH') {
      score += 12;
    }
    if (queryLower.includes('completed') && task.status === 'COMPLETED') {
      score += 10;
    }
    if ((queryLower.includes('in progress') || queryLower.includes('working on')) && task.status === 'IN_PROGRESS') {
      score += 10;
    }

    // Token matching
    for (const token of queryTokens) {
      if (taskTitle.includes(token)) score += 8;
      if (empName.includes(token)) score += 10;
      if (taskDesc.includes(token)) score += 4;
      if (status.includes(token)) score += 5;
      if (priority.includes(token)) score += 5;
    }

    return { task, score };
  });

  // Sort and pick relevant tasks
  scoredTasks.sort((a, b) => b.score - a.score);
  // Pick tasks that scored > 0, or if none matched specific tokens, return top 12 by deadline
  const relevantTasks =
    scoredTasks.filter((item) => item.score > 0).length > 0
      ? scoredTasks.filter((item) => item.score > 0).slice(0, 15).map((i) => i.task)
      : tasks.slice(0, 12);

  relevantTasks.forEach((t) => {
    matchedSources.push({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: `${t.status} (${t.progress}%) - Assignee: ${t.employee?.name || 'Unassigned'}`,
      detail: `Deadline: ${new Date(t.deadline).toLocaleDateString()}, Priority: ${t.priority}`,
    });
  });

  // Score employees
  const scoredEmployees = employees.map((emp) => {
    let score = 0;
    const name = (emp.name || '').toLowerCase();
    const designation = (emp.designation || '').toLowerCase();

    if (queryLower.includes(name)) score += 15;
    for (const token of queryTokens) {
      if (name.includes(token)) score += 8;
      if (designation.includes(token)) score += 5;
    }

    // If query asks about employee workload
    if (queryLower.includes('employee') || queryLower.includes('workload') || queryLower.includes('team') || queryLower.includes('who')) {
      score += 4;
    }

    return { emp, score };
  });

  scoredEmployees.sort((a, b) => b.score - a.score);
  const relevantEmployees =
    scoredEmployees.filter((item) => item.score > 0).length > 0
      ? scoredEmployees.filter((item) => item.score > 0).slice(0, 8).map((i) => i.emp)
      : employees.slice(0, 8);

  relevantEmployees.forEach((emp) => {
    matchedSources.push({
      type: 'employee',
      id: emp.id,
      title: emp.name,
      subtitle: `${emp.designation} (${emp.tasks?.length || 0} tasks assigned)`,
      detail: `Email: ${emp.email || 'N/A'}, Phone: ${emp.phone || 'N/A'}`,
    });
  });

  // 4. Custom Document Context
  let customDocContext = '';
  if (customDocs && customDocs.length > 0) {
    customDocContext = `\n\n### ADDITIONAL UPLOADED DOCUMENTS / PROJECT KNOWLEDGE:\n` +
      customDocs.map((doc, idx) => `[Document ${idx + 1}]:\n${doc}`).join('\n\n');

    customDocs.forEach((_, idx) => {
      matchedSources.push({
        type: 'document',
        title: `Document ${idx + 1}`,
        subtitle: 'User Uploaded Context',
      });
    });
  }

  // 5. Build structured Markdown RAG Context for LLM
  const tasksFormatted = relevantTasks.map((t) => {
    const isOverdue = t.status !== 'COMPLETED' && new Date(t.deadline) < now;
    const historyText = t.history && t.history.length > 0
      ? t.history.map((h: any) => `  * [${new Date(h.createdAt).toLocaleDateString()}] progress: ${h.oldProgress}% -> ${h.newProgress}% ${h.note ? `("${h.note}")` : ''}`).join('\n')
      : '  * No update logs yet.';

    return `* Task ID: ${t.id}
  * Title: ${t.title}
  * Assignee: ${t.employee ? `${t.employee.name} (${t.employee.designation})` : 'Unassigned'}
  * Priority: ${t.priority}
  * Status: ${t.status} ${isOverdue ? '⚠️ [OVERDUE]' : ''}
  * Progress: ${t.progress}%
  * Deadline: ${new Date(t.deadline).toLocaleDateString()}
  * Description: ${t.description || 'N/A'}
  * Remarks: ${t.remarks || 'None'}
  * Recent Updates:
${historyText}`;
  }).join('\n\n');

  const employeesFormatted = relevantEmployees.map((e) => {
    const empTasks = e.tasks || [];
    const empOverdue = empTasks.filter((t: any) => t.status !== 'COMPLETED' && new Date(t.deadline) < now).length;
    const empCompleted = empTasks.filter((t: any) => t.status === 'COMPLETED').length;

    return `* Employee: ${e.name}
  * Designation: ${e.designation}
  * Email: ${e.email} | Phone: ${e.phone}
  * Assigned Tasks Count: ${empTasks.length} (Completed: ${empCompleted}, Overdue: ${empOverdue})
  * Tasks List: ${empTasks.map((t: any) => `"${t.title}" [${t.status}, ${t.progress}%]`).join(', ') || 'No tasks assigned'}`;
  }).join('\n\n');

  const systemPrompt = `You are the TaskTracker AI Assistant — an intelligent, highly perceptive project manager, operational co-pilot, and team analytics specialist.
You are embedded directly inside the company's Next.js Task Tracking software.

CURRENT SYSTEM TIME: ${now.toISOString()} (${now.toLocaleDateString()} ${now.toLocaleTimeString()})

### LIVE REPOSITORY METRICS & CONTEXT:
- Total Employees: ${metricsSummary.totalEmployees}
- Total Tasks: ${metricsSummary.totalTasks}
- Completed: ${metricsSummary.completedTasks}
- In Progress: ${metricsSummary.inProgressTasks}
- Overdue Tasks: ${metricsSummary.overdueTasks} ⚠️
- Urgent / High Priority: ${metricsSummary.highPriorityTasks}

### RETRIEVED TASKS (RELEVANT TO USER CONTEXT):
${tasksFormatted || 'No tasks found in database.'}

### RETRIEVED EMPLOYEES & WORKLOAD:
${employeesFormatted || 'No employees found in database.'}
${customDocContext}

### INSTRUCTIONS FOR YOUR RESPONSES:
1. Base your answers strictly and accurately on the live retrieved context above whenever relevant.
2. If asked about tasks, deadlines, overdue items, or employees, cite exact names, dates, progress percentages, and priorities.
3. Be proactive and helpful: offer recommendations, highlight bottlenecks or overdue tasks, suggest workload balancing, or outline actionable steps.
4. Format responses cleanly using GitHub-flavored Markdown:
   - Use bold titles, bullet points, clean comparison tables where appropriate, and status emojis (✅ Completed, ⏳ In Progress, 🚨 Overdue, 📌 Assigned).
5. If the user provides an image (multimodal query), inspect the image carefully (diagram, task screenshot, flowchart, error log, etc.) and relate it to the tasks and project workflow!
6. If the user asks general questions or asks to draft task descriptions, emails, or plans, provide thorough, executive-ready answers.`;

  return {
    systemPrompt,
    sources: matchedSources,
    metricsSummary,
  };
}
