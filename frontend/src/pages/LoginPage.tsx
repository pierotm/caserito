import { FormEvent, useState } from 'react';
import { api } from '../services/api';

type LoginResponse = {
  token: string;
  user: {
    email: string;
    requirePasswordReset: boolean;
  };
};

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', data.token);
      onLoggedIn();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="screen">
      <h1>Caserito</h1>
      <p>Ingresa con tu cuenta (registro cerrado).</p>
      <form className="card" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Contraseña
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
