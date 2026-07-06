import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Course } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';

interface Props {
  courses: Course[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3.5 h-3.5 inline mr-1 ${active ? 'text-primary' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {dir === 'asc' && active
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
    </svg>
  );
}

export default function CourseTable({ courses, sortBy, sortDir, onSort }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const th = (label: string, field?: string, extra = '') => (
    <th
      className={`px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide ${field ? 'cursor-pointer hover:text-gray-800 select-none' : ''} ${extra}`}
      onClick={field ? () => onSort(field) : undefined}
    >
      {field && <SortIcon active={sortBy === field} dir={sortDir} />}
      {label}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {th(t('courses.courseName'), 'courseName')}
            {th(t('courses.type'), undefined, 'hidden sm:table-cell')}
            {th(t('courses.status'), 'status')}
            {th(t('courses.startDate'), 'startDate', 'hidden sm:table-cell')}
            {th(t('courses.location'), undefined, 'hidden md:table-cell')}
            {th(t('courses.academicYear'), undefined, 'hidden md:table-cell')}
            {th(t('courses.lecturers'), undefined, 'hidden lg:table-cell')}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {courses.map((course) => (
            <tr
              key={course._id}
              onClick={() => navigate(`/courses/${course._id}`)}
              className="hover:bg-primary/5 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {course.checklistIncomplete && (
                    <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-900">{course.name?.name ?? '—'}</span>
                  {course.catalogueId && <span className="text-gray-400 text-xs">({course.catalogueId})</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{course.type?.name ?? '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={course.status} /></td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">{formatDate(course.startDate)}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{course.location?.name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{course.academicYear ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                {course.lecturers?.map((l) => `${l.firstName} ${l.lastName}`).join(', ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
