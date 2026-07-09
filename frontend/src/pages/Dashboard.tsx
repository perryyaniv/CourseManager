import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourses } from '../api/courses';
import { getLecturers } from '../api/managedLists';
import { Course, CourseFilters, Lecturer } from '../types';
import CourseCard from '../components/courses/CourseCard';
import CourseTable from '../components/courses/CourseTable';
import CourseFiltersPanel from '../components/courses/CourseFilters';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';

type CardColor = 'blue' | 'teal' | 'red';

const colorMap: Record<CardColor, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-primary/10',   text: 'text-primary',   border: 'border-primary/20' },
  teal: { bg: 'bg-green-50',     text: 'text-green-600', border: 'border-green-200' },
  red:  { bg: 'bg-red-50',       text: 'text-red-600',   border: 'border-red-200' },
};

function StatCard({ label, value, icon, color = 'blue' }: { label: string; value: number; icon: React.ReactNode; color?: CardColor }) {
  const { bg, text, border } = colorMap[color];
  return (
    <div className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border ${border} ${bg} text-center`}>
      <div className={`${text} opacity-80`}>{icon}</div>
      <p className={`text-2xl font-bold leading-none ${text}`}>{value}</p>
      <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  const [view, setView] = useState<'cards' | 'table'>('table');
  const [displayOpen, setDisplayOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // for KPI
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 25,
    sortBy: 'checklistPriority',
    sortDir: 'asc',
    activeOnly: true,
    search: searchParams.get('search') ?? undefined,
  });

  useEffect(() => {
    getLecturers().then(setLecturers);
    // Load all for KPI (no pagination)
    getCourses({ page: 1, limit: 200, sortBy: 'statusPriority', sortDir: 'asc', activeOnly: false })
      .then((r) => setAllCourses(r.data));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCourses(filters);
      setCourses(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      const years = [...new Set(result.data.map((c) => c.academicYear).filter(Boolean))].sort().reverse();
      setAcademicYears((prev) => [...new Set([...prev, ...(years as string[])])]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (updates: Partial<CourseFilters>) =>
    setFilters((f) => ({ ...f, ...updates }));

  const handleSort = (field: string) =>
    setFilters((f) => ({
      ...f,
      sortBy: field,
      sortDir: f.sortBy === field && f.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));

  const handleStatusChanged = (updated: Course) => {
    setCourses((prev) => prev.map((x) => x._id === updated._id ? { ...x, ...updated } : x));
    setAllCourses((prev) => prev.map((x) => x._id === updated._id ? { ...x, ...updated } : x));
  };

  // KPI from all courses
  const active = allCourses.filter((c) => c.status === 'פעיל').length;
  const upcoming = allCourses.filter((c) => c.startDate && new Date(c.startDate) > new Date() && c.status === 'בתכנון').length;
  const incomplete = allCourses.filter((c) => c.checklistIncomplete).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-dark">{t('dashboard.title')}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label={t('dashboard.activeCourses')} value={active} color="teal"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard label={t('dashboard.upcomingCourses')} value={upcoming} color="blue"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard label={t('dashboard.incompleteCourses')} value={incomplete} color="red"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      {/* Toolbar: filter + display (collapsed) */}
      <div className="flex items-center gap-2 flex-wrap">
        <CourseFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          lecturers={lecturers}
          academicYears={academicYears}
        />

        {/* Display collapsed button */}
        <div>
          <button
            onClick={() => setDisplayOpen((o) => !o)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
              displayOpen
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            תצוגה
            {!filters.activeOnly && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${displayOpen ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                הכל
              </span>
            )}
            <svg className={`w-3.5 h-3.5 transition-transform ${displayOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {displayOpen && (
            <div className="mt-2 card p-4 space-y-3 absolute z-10 bg-white min-w-[200px]">
              <div>
                <p className="label mb-2">סוג תצוגה</p>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                  <button onClick={() => setView('table')} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {t('courses.tableView')}
                  </button>
                  <button onClick={() => setView('cards')} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${view === 'cards' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {t('courses.cardsView')}
                  </button>
                </div>
              </div>
              <div>
                <p className="label mb-2">סינון לפי סיום</p>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => handleFilterChange({ activeOnly: true, page: 1 })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${filters.activeOnly ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    פעילים בלבד
                  </button>
                  <button
                    onClick={() => handleFilterChange({ activeOnly: false, page: 1 })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${!filters.activeOnly ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    הצג הכל
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course list */}
      {loading ? (
        <Spinner />
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl mx-auto mb-3 flex items-center justify-center">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            {filters.search || filters.status || filters.academicYear ? t('courses.noResults') : 'אין קורסים עדיין'}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            {filters.search || filters.status || filters.academicYear ? 'נסה לשנות את הסינון' : 'הוסף את הקורס הראשון כדי להתחיל'}
          </p>
          {isCoordinator && !filters.search && !filters.status && !filters.academicYear && (
            <Button onClick={() => navigate('/courses/new')} size="lg">+ הוספת קורס ראשון</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{total} קורסים</p>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => (
                <CourseCard key={c._id} course={c} onStatusChanged={handleStatusChanged} />
              ))}
            </div>
          ) : (
            <CourseTable
              courses={courses}
              sortBy={filters.sortBy ?? 'statusPriority'}
              sortDir={filters.sortDir ?? 'asc'}
              onSort={handleSort}
            />
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="secondary" size="sm" disabled={filters.page <= 1} onClick={() => handleFilterChange({ page: filters.page - 1 })}>הקודם</Button>
              <span className="text-sm text-gray-600">{filters.page} / {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={filters.page >= totalPages} onClick={() => handleFilterChange({ page: filters.page + 1 })}>הבא</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
