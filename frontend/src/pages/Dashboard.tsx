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

type CardColor = 'gray' | 'green' | 'blue' | 'red';

const colorMap: Record<CardColor, { border: string; num: string; icon: string }> = {
  gray:  { border: 'border-r-gray-300',   num: 'text-gray-700',   icon: 'text-gray-400' },
  green: { border: 'border-r-green-400',  num: 'text-green-700',  icon: 'text-green-400' },
  blue:  { border: 'border-r-primary',    num: 'text-primary',    icon: 'text-primary/50' },
  red:   { border: 'border-r-red-400',    num: 'text-red-600',    icon: 'text-red-300' },
};

function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: CardColor }) {
  const { border, num } = colorMap[color];
  return (
    <div className={`bg-white border border-gray-100 border-r-4 ${border} rounded-lg shadow-card px-3 py-3 flex flex-col items-center justify-center text-center`}>
      <p className={`text-lg font-bold leading-none ${num}`}>{value}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
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
  const [_total, setTotal] = useState(0);
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
    getCourses({ page: 1, limit: 500, sortBy: 'statusPriority', sortDir: 'asc' })
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

  // KPI from all courses (unfiltered)
  const active = allCourses.filter((c) => c.status === 'פעיל').length;
  const upcoming = allCourses.filter((c) => c.status === 'בתכנון').length;
  const totalAll = active + upcoming;
  const incomplete = allCourses.filter((c) => c.checklistIncomplete).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-dark">{t('nav.courses')}</h1>

      {/* KPI cards — always single row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="סה״כ" value={totalAll} color="gray" />
        <StatCard label="פעילים" value={active} color="green" />
        <StatCard label="בתכנון" value={upcoming} color="blue" />
        <StatCard label="צ'קליסט חסר" value={incomplete} color="red" />
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
        <div className="relative">
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
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDisplayOpen(false)} />
              <div className="absolute top-full mt-2 right-0 z-20 card p-4 space-y-3 bg-white min-w-[200px] shadow-lg">
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
                <p className="label mb-2">קורסים מוצגים</p>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                  <button onClick={() => handleFilterChange({ activeOnly: true, page: 1 })} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${filters.activeOnly ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    פעילים בלבד
                  </button>
                  <button onClick={() => handleFilterChange({ activeOnly: false, page: 1 })} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${!filters.activeOnly ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    הצג הכל
                  </button>
                </div>
              </div>
            </div>
            </>
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
