import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Course } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';

interface Props { course: Course }

export default function CourseCard({ course }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      onClick={() => navigate(`/courses/${course._id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-r-primary-dark transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {course.name?.name ?? '—'}
          </h3>
          {course.catalogueId && (
            <p className="text-xs text-gray-400 mt-0.5">{course.catalogueId}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {course.checklistIncomplete && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full flex-shrink-0">
              {t('courses.incompleteChecklist')}
            </span>
          )}
          <StatusBadge status={course.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <span className="label mb-0">{t('courses.type')}</span>
        <span className="text-xs text-gray-700 font-medium">{course.type?.name ?? '—'}</span>

        <span className="label mb-0">{t('courses.startDate')}</span>
        <span className="text-xs text-gray-700">{formatDate(course.startDate)}</span>

        <span className="label mb-0">{t('courses.location')}</span>
        <span className="text-xs text-gray-700 truncate">{course.location?.name ?? '—'}</span>
      </div>

      {course.lecturers?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
          {course.lecturers.map((l) => (
            <span key={l._id} className="text-xs bg-primary/8 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {l.firstName} {l.lastName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
