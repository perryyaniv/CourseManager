import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Course } from '../../types';
import { StatusBadge } from '../ui/Badge';

interface Props {
  course: Course;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CourseCard({ course }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      onClick={() => navigate(`/courses/${course._id}`)}
      className="bg-white rounded-xl border border-gray-200 shadow-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
    >
      {/* Top accent bar */}
      <div className="h-0.5 -mx-5 -mt-5 mb-4 rounded-t-xl bg-gradient-to-l from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-primary transition-colors truncate">
            {course.name?.name ?? '—'}
          </h3>
          {course.catalogueId && (
            <p className="text-xs text-gray-400 mt-0.5">{course.catalogueId}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {course.checklistIncomplete && (
            <span title={t('courses.incompleteChecklist')} className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
          )}
          <StatusBadge status={course.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div className="text-gray-400 text-xs font-medium">{t('courses.type')}</div>
        <div className="text-gray-700 text-xs">{course.type?.name ?? '—'}</div>

        <div className="text-gray-400 text-xs font-medium">{t('courses.startDate')}</div>
        <div className="text-gray-700 text-xs">{formatDate(course.startDate)}</div>

        <div className="text-gray-400 text-xs font-medium">{t('courses.location')}</div>
        <div className="text-gray-700 text-xs truncate">{course.location?.name ?? '—'}</div>
      </div>

      {course.lecturers?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex flex-wrap gap-1">
            {course.lecturers.map((l) => (
              <span key={l._id} className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full">
                {l.firstName} {l.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
