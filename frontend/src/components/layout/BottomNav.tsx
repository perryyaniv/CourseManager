import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const tab = (to: string, label: string, icon: React.ReactNode) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
          active ? 'text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-white/20' : ''}`}>
          {icon}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-primary border-t border-white/10 flex items-stretch h-14 safe-area-pb">
      {tab('/', t('nav.dashboard'),
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )}
      {tab('/courses', t('nav.courses'),
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )}
      {isCoordinator && tab('/courses/new', t('nav.addCourse'),
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </nav>
  );
}
