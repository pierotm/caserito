const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error inesperado' }));
    throw new Error(err.message);
  }

  return response.json();
}
