import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses } from '../api/courses';
import { Course } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-card p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses({ page: 1, limit: 100 })
      .then((r) => setCourses(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const active = courses.filter((c) => c.status === 'פעיל');
  const now = new Date();
  const upcoming = courses.filter((c) => c.startDate && new Date(c.startDate) > now && c.status === 'בתכנון');
  const incomplete = courses.filter((c) => c.checklistIncomplete);
  const recent = [...courses].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);

  const statusCounts: Record<string, number> = {};
  courses.forEach((c) => { statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <Link to="/courses" className="text-sm text-primary hover:underline font-medium">
          כל הקורסים ←
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('dashboard.activeCourses')}
          value={active.length}
          color="bg-primary/10"
          icon={<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard
          label={t('dashboard.upcomingCourses')}
          value={upcoming.length}
          color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label={t('dashboard.incompleteCourses')}
          value={incomplete.length}
          color="bg-accent/10"
          icon={<svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">{t('dashboard.coursesByStatus')}</h2>
          {Object.keys(statusCounts).length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">{t('common.noData')}</p>
            : <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status as Course['status']} />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-l from-primary to-accent"
                        style={{ width: `${(count / courses.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-6 text-left">{count}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent courses */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">{t('dashboard.recentCourses')}</h2>
            <Link to="/courses" className="text-xs text-primary hover:underline">הצג הכל</Link>
          </div>
          <div className="space-y-1">
            {recent.map((c) => (
              <Link
                key={c._id}
                to={`/courses/${c._id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.checklistIncomplete && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                  <span className="text-sm font-medium text-gray-800 group-hover:text-primary truncate transition-colors">{c.name?.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">{formatDate(c.startDate)}</span>
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
            {recent.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{t('common.noData')}</p>}
          </div>
        </div>
      </div>

      {/* Incomplete checklist alert */}
      {incomplete.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            {t('dashboard.incompleteCourses')} ({incomplete.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {incomplete.map((c) => (
              <Link key={c._id} to={`/courses/${c._id}`} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/70 transition-colors">
                <span className="text-sm text-gray-700">{c.name?.name}</span>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
