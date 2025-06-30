import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { updateCurrentAdminProfile, updateSuperAdminCredentials } from '@/lib/auth-server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) throw new Error('No token');
  
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const { username, password, type } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (type === 'superadmin' && user.role === 'superadmin') {
      await updateSuperAdminCredentials(username, password);
    } else if (user.role === 'admin') {
      const success = await updateCurrentAdminProfile(user.userId as string, username, password);
      if (!success) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Clear the auth cookie to force re-login
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}