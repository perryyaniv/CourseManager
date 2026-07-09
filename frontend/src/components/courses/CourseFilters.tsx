import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseFilters } from '../../types';
import { type CourseStatus, type Lecturer } from '../../types';

interface Props {
  filters: CourseFilters;
  onFilterChange: (filters: Partial<CourseFilters>) => void;
  lecturers: Lecturer[];
  academicYears: string[];
}

const STATUSES: CourseStatus[] = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];
const selectCls = 'input py-1.5 text-sm';

export default function CourseFilters({ filters, onFilterChange, lecturers, academicYears }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.academicYear,
    filters.status,
    filters.lecturer,
    filters.startDateFrom,
    filters.startDateTo,
  ].filter(Boolean).length;

  const clearAll = () => onFilterChange({
    academicYear: undefined, status: undefined, lecturer: undefined,
    startDateFrom: undefined, startDateTo: undefined, page: 1,
  });

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
          open || activeCount > 0
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        {t('courses.filters')}
        {activeCount > 0 && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white text-primary">
            {activeCount}
          </span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 card p-4 bg-white min-w-[320px] shadow-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('courses.academicYear')}</label>
                <select value={filters.academicYear ?? ''} onChange={(e) => onFilterChange({ academicYear: e.target.value || undefined, page: 1 })} className={selectCls}>
                  <option value="">הכל</option>
                  {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('courses.status')}</label>
                <select value={filters.status ?? ''} onChange={(e) => onFilterChange({ status: (e.target.value as CourseStatus) || undefined, page: 1 })} className={selectCls}>
                  <option value="">הכל</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">{t('courses.lecturers')}</label>
                <select value={filters.lecturer ?? ''} onChange={(e) => onFilterChange({ lecturer: e.target.value || undefined, page: 1 })} className={selectCls}>
                  <option value="">הכל</option>
                  {lecturers.map((l) => <option key={l._id} value={l._id}>{l.firstName} {l.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('courses.startDate')} מ</label>
                <input type="date" value={filters.startDateFrom ?? ''} onChange={(e) => onFilterChange({ startDateFrom: e.target.value || undefined, page: 1 })} className={selectCls} />
              </div>
              <div>
                <label className="label">{t('courses.startDate')} עד</label>
                <input type="date" value={filters.startDateTo ?? ''} onChange={(e) => onFilterChange({ startDateTo: e.target.value || undefined, page: 1 })} className={selectCls} />
              </div>
            </div>
            {activeCount > 0 && (
              <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  נקה הכל
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Active chips (when closed) */}
      {!open && activeCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {filters.status && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {filters.status}
              <button onClick={() => onFilterChange({ status: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.academicYear && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {filters.academicYear}
              <button onClick={() => onFilterChange({ academicYear: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.lecturer && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {lecturers.find(l => l._id === filters.lecturer)?.firstName ?? 'מרצה'}
              <button onClick={() => onFilterChange({ lecturer: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          {(filters.startDateFrom || filters.startDateTo) && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              תאריך
              <button onClick={() => onFilterChange({ startDateFrom: undefined, startDateTo: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">נקה הכל</button>
        </div>
      )}
    </div>
  );
}
