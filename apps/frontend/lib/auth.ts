// ── Auth client lib ────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'client';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string; name: string; role: string };
}

// Storage keys
const AT_KEY = 'ailab_at';
const RT_KEY = 'ailab_rt';
const USER_KEY = 'ailab_user';

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(AT_KEY, tokens.accessToken);
  localStorage.setItem(RT_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
}

export function clearTokens(): void {
  [AT_KEY, RT_KEY, USER_KEY].forEach((k) => localStorage.removeItem(k));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AT_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// API calls
export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Invalid credentials');
  }
  return res.json() as Promise<AuthTokens>;
}

export async function signup(name: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? 'Signup failed'));
  }
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json() as Promise<AuthUser>;
}

export function getDashboardPath(role: string): string {
  if (role === 'superadmin' || role === 'admin') return '/admin';
  return '/client';
}
