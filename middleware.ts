import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyJWT(token);
  
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  if (isLoginPage) {
    if ((payload as any).mustChangePassword) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isChangePasswordPage = request.nextUrl.pathname.startsWith('/change-password');
  
  if ((payload as any).mustChangePassword && !isChangePasswordPage) {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  if (!(payload as any).mustChangePassword && isChangePasswordPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/change-password'],
};
