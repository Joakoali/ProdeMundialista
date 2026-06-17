import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { login, register, resetPassword, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      login(username, password);
    } else if (mode === 'register') {
      register(username, password);
    } else {
      if (newPassword !== confirmPassword) return;
      const ok = await resetPassword(username, newPassword);
      if (ok) setResetSuccess(true);
    }
  };

  const switchMode = (next) => {
    setUsername('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetSuccess(false);
    setMode(next);
  };

  const passwordMismatch =
    mode === 'reset' && confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-1 tracking-tight">Prode Mundial</h1>
        <p className="text-secondary text-sm mb-10">
          {mode === 'login' && 'Ingresá con tu usuario'}
          {mode === 'register' && 'Creá tu cuenta'}
          {mode === 'reset' && 'Restablecé tu contraseña'}
        </p>

        {mode === 'reset' && resetSuccess ? (
          <div className="space-y-4">
            <p className="text-green text-sm">Contraseña restablecida correctamente.</p>
            <button
              onClick={() => switchMode('login')}
              className="w-full bg-green text-base font-semibold py-3 text-sm hover:opacity-90 transition-opacity"
            >
              Ir al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
            />

            {mode !== 'reset' && (
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
              />
            )}

            {mode === 'reset' && (
              <>
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-surface border border-elevated text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
                />
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full bg-surface border text-primary placeholder:text-secondary px-4 py-3 text-sm focus:outline-none transition-colors ${
                    passwordMismatch ? 'border-red' : 'border-elevated focus:border-secondary'
                  }`}
                />
                {passwordMismatch && (
                  <p className="text-red text-xs">Las contraseñas no coinciden</p>
                )}
              </>
            )}

            {error && <p className="text-red text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full bg-green text-base font-semibold py-3 text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading
                ? '...'
                : mode === 'login'
                ? 'Ingresar'
                : mode === 'register'
                ? 'Registrarse'
                : 'Restablecer contraseña'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <p className="text-secondary text-xs">
                ¿No tenés cuenta?{' '}
                <button onClick={() => switchMode('register')} className="text-primary underline">
                  Registrate
                </button>
              </p>
              <p className="text-secondary text-xs">
                <button onClick={() => switchMode('reset')} className="text-primary underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p className="text-secondary text-xs">
              ¿Ya tenés cuenta?{' '}
              <button onClick={() => switchMode('login')} className="text-primary underline">
                Ingresá
              </button>
            </p>
          )}
          {mode === 'reset' && !resetSuccess && (
            <p className="text-secondary text-xs">
              <button onClick={() => switchMode('login')} className="text-primary underline">
                Volver al login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
