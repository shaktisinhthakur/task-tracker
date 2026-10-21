import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const loginUrl = `${url.origin}/login`;

    const result = await sendUserCredentialsEmail({
      to: email,
      name: name || 'User',
      password,
      role: role || 'USER',
      loginUrl,
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email. Check SMTP settings.' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Credentials sent to ${email}` });
  } catch (error: any) {
    console.error('Error in resend credentials endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
