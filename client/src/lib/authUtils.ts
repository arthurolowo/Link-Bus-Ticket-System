export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface AuthResponse {
  status: 'success';
  data: {
    token: string;
    expiresIn: number;
    user: User;
  };
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  errors?: Array<{ message: string }>;
}

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const API_BASE_URL = 'http://localhost:5000';

export function setToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + expiresIn * 1000).toString());
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token is expired
  if (Date.now() > parseInt(expiry, 10)) {
    removeToken();
    return null;
  }

  return token;
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    const error = data as ErrorResponse;
    
    // Handle validation errors with detailed messages
    if (error.errors && Array.isArray(error.errors)) {
      const validationMessages = error.errors.map(err => err.message).join(', ');
      throw new Error(validationMessages);
    }
    
    throw new Error(error.message || 'An error occurred');
  }
  
  return data as T;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('API request failed');
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setToken(response.data.token, response.data.expiresIn);
  return response;
}

export async function register(
  name: string, 
  email: string, 
  password: string, 
  phone?: string
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone }),
  });

  setToken(response.data.token, response.data.expiresIn);
  return response;
}

export async function logout(): Promise<void> {
  removeToken();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await apiRequest<{ status: 'success'; data: { user: User } }>('/api/auth/me');
    return response.data.user;
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      removeToken();
    }
    return null;
  }
}

export function parseAuthError(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific error codes
    if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
      return 'Too many attempts. Please try again later.';
    }
    if (error.message.includes('INVALID_CREDENTIALS')) {
      return 'Invalid email or password.';
    }
    if (error.message.includes('EMAIL_EXISTS')) {
      return 'This email is already registered.';
    }
    if (error.message.includes('TOKEN_EXPIRED')) {
      removeToken();
      return 'Your session has expired. Please login again.';
    }
    
    // Handle validation errors (fallback - should be handled by handleResponse now)
    if (error.message.includes('Validation failed')) {
      return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
    }
    
    return error.message;
  }
  return 'An unexpected error occurred';
}