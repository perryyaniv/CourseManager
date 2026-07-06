import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { t } = useTranslation();
  const { user, clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isCoordinator = user?.role === 'coordinator' || isAdmin;

  const navItems = [
    { to: '/', label: t('nav.dashboard'), show: true },
    { to: '/courses', label: t('nav.courses'), show: true },
    { to: '/courses/new', label: t('nav.addCourse'), show: isCoordinator },
    { to: '/audit-log', label: t('nav.auditLog'), show: isAdmin },
    { to: '/users', label: t('nav.userManagement'), show: isAdmin },
    { to: '/settings', label: t('nav.settings'), show: isAdmin },
  ].filter((i) => i.show);

  const isActive = (to: string) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to ||
        (location.pathname.startsWith(to + '/') &&
          !navItems.some(
            (i) => i.to !== to && i.to.startsWith(to) && location.pathname.startsWith(i.to)
          ));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 shadow-nav">
      {/* Blue header bar */}
      <div className="bg-primary px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="bg-white rounded-md px-2 py-1">
              <img src="/logo.png" alt="לוגו" className="h-8 w-auto" />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search + user */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-40 bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
              />
              <button type="submit" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="flex items-center gap-2 border-r border-white/20 pr-3 mr-1">
              <span className="text-xs text-white/70">{user?.username}</span>
              <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded font-medium">
                {{ admin: 'מנהל', coordinator: 'עורך', viewer: 'צופה' }[user?.role ?? 'viewer']}
              </span>
              <button
                onClick={clearAuth}
                title={t('nav.logout')}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-1 bg-accent" />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive(item.to) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10">
            <form onSubmit={handleSearch} className="flex gap-2 mb-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש..."
                className="flex-1 bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" className="px-3 py-2 bg-white/20 text-white rounded-md text-sm">חפש</button>
            </form>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs text-white/60">{user?.username}</span>
              <button onClick={() => { clearAuth(); setMobileOpen(false); }} className="text-xs text-white/70 hover:text-white">
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
