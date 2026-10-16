import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  const user = await verifyJWT(token);
  return user && user.role === 'ADMIN';
}

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        tasks: true
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const data = await request.json();

    // Check if email already exists in User or Employee records
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    const existingEmployee = await prisma.employee.findFirst({ where: { email: data.email } });
    
    if (existingUser || existingEmployee) {
      return NextResponse.json({ error: 'This email is already in use by another employee. Please put a different email.' }, { status: 400 });
    }

    // Generate random 12-char temp password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create both User and Employee within a transaction
    const [employee] = await prisma.$transaction([
      prisma.employee.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          designation: data.designation,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : null,
        }
      }),
      prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'USER',
          mustChangePassword: true, // Force password reset on first login
        }
      })
    ]);

    return NextResponse.json({ employee, tempPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.employee.delete({ where: { id } });
      const user = await tx.user.findUnique({ where: { email: employee.email } });
      if (user) {
        await tx.user.delete({ where: { id: user.id } });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
