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
    to === '/' ? location.pathname === '/' : location.pathname === to || (location.pathname.startsWith(to + '/') && !navItems.some(i => i.to !== to && i.to.startsWith(to) && location.pathname.startsWith(i.to)));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-nav border-b border-gray-100">
        {/* Top accent stripe */}
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-brand-blue" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">

            {/* Logo — right side (RTL = start) */}
            <Link to="/" className="flex-shrink-0">
              <img src="/logo.png" alt="המכון הבינלאומי למנהיגות" className="h-10 md:h-14 w-auto" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.to)
                      ? 'text-primary bg-red-50'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {isActive(item.to) && (
                    <span className="absolute bottom-0 right-2 left-2 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right cluster: search + user */}
            <div className="hidden md:flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש..."
                  className="w-44 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:w-56"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                <span className="text-xs text-gray-400">{user?.username}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                  {{ admin: 'מנהל', coordinator: 'עורך', viewer: 'צופה' }[user?.role ?? 'viewer']}
                </span>
                <button
                  onClick={clearAuth}
                  title={t('nav.logout')}
                  className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-50"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="תפריט"
            >
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to) ? 'bg-red-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm">חפש</button>
              </form>
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs text-gray-400">{user?.username}</span>
                <button onClick={() => { clearAuth(); setMobileOpen(false); }} className="text-xs text-primary hover:underline">
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
