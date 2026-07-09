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

export default function Courses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 25,
    sortBy: 'statusPriority',
    sortDir: 'asc',
    search: searchParams.get('search') ?? undefined,
  });

  useEffect(() => {
    getLecturers().then(setLecturers);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCourses(filters);
      setCourses(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      // Collect unique academic years for filter
      const years = [...new Set(result.data.map((c) => c.academicYear).filter(Boolean))].sort().reverse();
      setAcademicYears((prev) => [...new Set([...prev, ...years as string[]])]);
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

  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-dark">{t('courses.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-sm transition-colors ${view === 'cards' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('courses.cardsView')}
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('courses.tableView')}
            </button>
          </div>
          {isCoordinator && (
            <Button onClick={() => navigate('/courses/new')} size="sm">
              + {t('nav.addCourse')}
            </Button>
          )}
        </div>
      </div>

      <CourseFiltersPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        lecturers={lecturers}
        academicYears={academicYears}
      />

      {loading ? (
        <Spinner />
      ) : courses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {filters.search || filters.status || filters.academicYear ? t('courses.noResults') : 'אין קורסים עדיין'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {filters.search || filters.status || filters.academicYear
              ? 'נסה לשנות את הסינון'
              : 'הוסף את הקורס הראשון כדי להתחיל'}
          </p>
          {isCoordinator && !filters.search && !filters.status && !filters.academicYear && (
            <Button onClick={() => navigate('/courses/new')} size="lg">
              + הוספת קורס ראשון
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} קורסים</p>

          {view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => (
                <CourseCard
                  key={c._id}
                  course={c}
                  onStatusChanged={(updated) =>
                    setCourses((prev) => prev.map((x) => x._id === updated._id ? { ...updated, checklistDone: c.checklistDone, checklistTotal: c.checklistTotal } : x))
                  }
                />
              ))}
            </div>
          ) : (
            <CourseTable
              courses={courses}
              sortBy={filters.sortBy ?? 'startDate'}
              sortDir={filters.sortDir ?? 'desc'}
              onSort={handleSort}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange({ page: filters.page - 1 })}
              >
                הקודם
              </Button>
              <span className="text-sm text-gray-600">
                {t('courses.page')} {filters.page} {t('courses.of')} {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
              >
                הבא
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
