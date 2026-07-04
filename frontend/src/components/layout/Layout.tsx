import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="לוגו" className="h-8 w-auto opacity-60" />
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} המכון הבינלאומי למנהיגות</p>
        </div>
      </footer>
    </div>
  );
}
