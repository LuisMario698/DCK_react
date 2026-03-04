import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface SessionUser {
  id: number;
  nombre_usuario: string;
  email: string;
  rol: string;
}

const COOKIE_NAME = 'dck_session';
const EXPIRY = 30 * 60; // 30 minutes in seconds

function getSecret() {
  const secret = process.env.SESSION_SECRET || 'dck-fallback-secret-32-chars-minimum!!';
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${EXPIRY}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // HTTP localhost (sin HTTPS)
    maxAge: EXPIRY,
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// For middleware: read session from request without cookies() API
export async function getSessionFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
