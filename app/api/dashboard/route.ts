import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const totalEmployees = await prisma.employee.count();
    const tasks = await prisma.task.findMany({
      include: {
        employee: true,
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter((t: any) => new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length;

    // Status split for Donut chart
    const statusSplit = {
      NOT_STARTED: tasks.filter((t: any) => t.status === 'NOT_STARTED').length,
      IN_PROGRESS: inProgressTasks,
      ON_HOLD: tasks.filter((t: any) => t.status === 'ON_HOLD').length,
      COMPLETED: completedTasks
    };

    // Employee progress
    const employees = await prisma.employee.findMany({
      include: { tasks: true }
    });

    const employeeProgress = employees.map((emp: any) => {
      const empTasks = emp.tasks;
      const totalEmpTasks = empTasks.length;
      const totalProgress = empTasks.reduce((acc: number, curr: any) => acc + curr.progress, 0);
      const avgProgress = totalEmpTasks > 0 ? Math.round(totalProgress / totalEmpTasks) : 0;
      return {
        id: emp.id,
        name: emp.name,
        avgProgress
      };
    });

    return NextResponse.json({
      totalEmployees,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      statusSplit,
      recentTasks: tasks.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 10),
      employeeProgress
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
