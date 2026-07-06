import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses } from '../api/courses';
import { Course } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { formatDate } from '../utils/date';

function StatCard({ label, value, icon, accent = false }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? 'bg-accent/10' : 'bg-primary/10'}`}>
          <div className={accent ? 'text-accent' : 'text-primary'}>{icon}</div>
        </div>
        <div>
          <p className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-primary'}`}>{value}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses({ page: 1, limit: 100 }).then((r) => setCourses(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const active = courses.filter((c) => c.status === 'פעיל');
  const upcoming = courses.filter((c) => c.startDate && new Date(c.startDate) > new Date() && c.status === 'בתכנון');
  const incomplete = courses.filter((c) => c.checklistIncomplete);
  const recent = [...courses].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);
  const statusCounts: Record<string, number> = {};
  courses.forEach((c) => { statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1; });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark">{t('dashboard.title')}</h1>
        <Link to="/courses" className="text-sm text-primary font-semibold hover:underline">כל הקורסים ←</Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('dashboard.activeCourses')} value={active.length}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard label={t('dashboard.upcomingCourses')} value={upcoming.length}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard label={t('dashboard.incompleteCourses')} value={incomplete.length} accent
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="card">
          <div className="section-title">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {t('dashboard.coursesByStatus')}
          </div>
          {Object.keys(statusCounts).length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">{t('common.noData')}</p>
            : <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status as Course['status']} />
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2.5 bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(count / courses.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-5 text-left">{count}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent courses */}
        <div className="card">
          <div className="section-title">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('dashboard.recentCourses')}
            <Link to="/courses" className="mr-auto text-xs font-normal normal-case tracking-normal text-primary hover:underline">הצג הכל</Link>
          </div>
          <div className="space-y-1">
            {recent.map((c) => (
              <Link key={c._id} to={`/courses/${c._id}`}
                className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-primary/5 transition-colors group">
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
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="section-title text-amber-700 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            {t('dashboard.incompleteCourses')} ({incomplete.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {incomplete.map((c) => (
              <Link key={c._id} to={`/courses/${c._id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-amber-100 transition-colors">
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
