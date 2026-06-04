import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loading, error } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') login(username, password);
    else register(username, password);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-1 tracking-tight">Prode Mundial</h1>
        <p className="text-secondary text-sm mb-10">
          {mode === 'login' ? 'Ingresá con tu usuario' : 'Creá tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
          />

          {error && <p className="text-red text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-base font-semibold py-3 text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? '...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-secondary text-xs">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary underline"
          >
            {mode === 'login' ? 'Registrate' : 'Ingresá'}
          </button>
        </p>
      </div>
    </div>
  );
}
