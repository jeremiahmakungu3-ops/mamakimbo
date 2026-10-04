/**
 * NetPulse Production API Client
 * Uses relative URL paths to guarantee zero hardcoded localhost references.
 * Automatically handles JWT Bearer tokens and JSON parsing.
 */

let authToken: string | null = localStorage.getItem('netpulse_token') || null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('netpulse_token', token);
  } else {
    localStorage.removeItem('netpulse_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
