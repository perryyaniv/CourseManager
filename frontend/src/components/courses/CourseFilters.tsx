import { useTranslation } from 'react-i18next';
import type { CourseFilters } from '../../types';
import { type CourseStatus, type Lecturer } from '../../types';
import Button from '../ui/Button';

interface Props {
  filters: CourseFilters;
  onFilterChange: (filters: Partial<CourseFilters>) => void;
  lecturers: Lecturer[];
  academicYears: string[];
}

const STATUSES: CourseStatus[] = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];

export default function CourseFilters({ filters, onFilterChange, lecturers, academicYears }: Props) {
  const { t } = useTranslation();

  const hasActive = !!(filters.academicYear || filters.status || filters.lecturer || filters.startDateFrom || filters.startDateTo);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('courses.academicYear')}</label>
          <select
            value={filters.academicYear ?? ''}
            onChange={(e) => onFilterChange({ academicYear: e.target.value || undefined, page: 1 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="">הכל</option>
            {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('courses.status')}</label>
          <select
            value={filters.status ?? ''}
            onChange={(e) => onFilterChange({ status: (e.target.value as CourseStatus) || undefined, page: 1 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="">הכל</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('courses.lecturers')}</label>
          <select
            value={filters.lecturer ?? ''}
            onChange={(e) => onFilterChange({ lecturer: e.target.value || undefined, page: 1 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="">הכל</option>
            {lecturers.map((l) => <option key={l._id} value={l._id}>{l.firstName} {l.lastName}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('courses.startDate')} מ</label>
          <input
            type="date"
            value={filters.startDateFrom ?? ''}
            onChange={(e) => onFilterChange({ startDateFrom: e.target.value || undefined, page: 1 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('courses.startDate')} עד</label>
          <input
            type="date"
            value={filters.startDateTo ?? ''}
            onChange={(e) => onFilterChange({ startDateTo: e.target.value || undefined, page: 1 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {hasActive && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({ academicYear: undefined, status: undefined, lecturer: undefined, startDateFrom: undefined, startDateTo: undefined, page: 1 })}
          >
            {t('courses.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
}
