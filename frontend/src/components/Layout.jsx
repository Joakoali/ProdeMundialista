import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? 'text-primary' : 'text-secondary hover:text-primary'}`;

  return (
    <div className="min-h-screen bg-base text-primary font-sans">
      <nav className="border-b border-elevated px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="text-base font-bold tracking-tight">
          Prode Mundial 2026
        </NavLink>
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Partidos</NavLink>
          <NavLink to="/leaderboard" className={linkClass}>Ranking</NavLink>
          <NavLink to="/profile" className={linkClass}>Mi Perfil</NavLink>
          <button onClick={handleLogout} className="text-sm text-secondary hover:text-primary transition-colors">
            Salir
          </button>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
