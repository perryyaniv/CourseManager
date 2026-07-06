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
    sortBy: 'startDate',
    sortDir: 'desc',
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
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{t('courses.noResults')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} קורסים</p>

          {view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => <CourseCard key={c._id} course={c} />)}
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
