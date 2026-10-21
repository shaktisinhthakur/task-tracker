import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendUserCredentialsEmail } from '@/lib/email';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  const user = await verifyJWT(token);
  return user && user.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const data = await request.json();
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role || 'USER',
        mustChangePassword: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const url = new URL(request.url);
    const loginUrl = `${url.origin}/login`;

    // Send credentials to user's email address
    const emailResult = await sendUserCredentialsEmail({
      to: data.email,
      name: data.name,
      password: data.password,
      role: data.role || 'USER',
      loginUrl,
    });
    
    return NextResponse.json({
      ...user,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
