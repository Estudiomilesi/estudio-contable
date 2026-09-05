import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-development-only-12345');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  // Exclude static files, API auth routes, and Next internals
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // If trying to access login while authenticated, redirect to home
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/sueldos') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (request.nextUrl.pathname.startsWith('/api/sueldos') && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const requestHeaders = new Headers(request.headers);
    if (payload.email === 'juanmartin@estudiomilesi.com') {
      requestHeaders.set('x-is-juanma', 'true');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  } catch (error) {
    // Token is invalid/expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
