import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20">
        <Outlet />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-primary/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <img src="/logo.png" alt="לוגו" className="h-6 w-auto bg-white rounded p-0.5 opacity-80" />
          <p className="text-xs text-white/60">© {new Date().getFullYear()} המכון הבינלאומי למנהיגות</p>
        </div>
      </footer>
    </div>
  );
}
