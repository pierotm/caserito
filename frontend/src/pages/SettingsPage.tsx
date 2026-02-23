import { FormEvent, useState } from 'react';
import { api } from '../services/api';

export function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    await api('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    setMessage('Contraseña actualizada');
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <main className="screen">
      <h2>Ajustes</h2>
      <form className="card" onSubmit={changePassword}>
        <label>
          Contraseña actual
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label>
          Nueva contraseña
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </label>
        <button type="submit">Cambiar contraseña</button>
        {message ? <p>{message}</p> : null}
      </form>

      <button className="danger" onClick={onLogout}>Cerrar sesión</button>
    </main>
  );
}
