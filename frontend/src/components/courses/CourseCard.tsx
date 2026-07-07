import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Course, CourseStatus } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';
import { changeStatus } from '../../api/courses';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface Props {
  course: Course;
  onStatusChanged?: (updated: Course) => void;
}

const NEXT_STATUS: Partial<Record<CourseStatus, CourseStatus>> = {
  'בתכנון': 'פעיל',
  'פעיל': 'הושלם',
};

export default function CourseCard({ course, onStatusChanged }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [changing, setChanging] = useState(false);
  const [_error, setError] = useState('');

  const { showToast } = useToast();
  const [confirmStatus, setConfirmStatus] = useState<CourseStatus | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'coordinator';
  const nextStatus = NEXT_STATUS[course.status];
  const done = course.checklistDone ?? 0;
  const total = course.checklistTotal ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  const checklistBlocked = course.checklistIncomplete && nextStatus;

  const doStatusChange = async (status: CourseStatus) => {
    setChanging(true);
    setError('');
    try {
      const updated = await changeStatus(course._id, status);
      onStatusChanged?.(updated);
      showToast(`הקורס הועבר לסטטוס "${status}"`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'שגיאה');
      showToast(msg ?? 'שגיאה בשינוי סטטוס', 'error');
      setTimeout(() => setError(''), 4000);
    } finally {
      setChanging(false);
      setConfirmStatus(null);
    }
  };

  const handleAdvanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextStatus || checklistBlocked) return;
    setConfirmStatus(nextStatus);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmStatus('בוטל');
  };

  return (
    <div
      onClick={() => navigate(`/courses/${course._id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-r-primary-dark transition-all group flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {course.name?.name ?? '—'}
          </h3>
          {course.catalogueId && (
            <p className="text-xs text-gray-400 mt-0.5">{course.catalogueId}</p>
          )}
        </div>
        <StatusBadge status={course.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 flex-1">
        <span className="label mb-0">{t('courses.type')}</span>
        <span className="text-xs text-gray-700 font-medium">{course.type?.name ?? '—'}</span>

        <span className="label mb-0">{t('courses.startDate')}</span>
        <span className="text-xs text-gray-700">{formatDate(course.startDate)}</span>

        <span className="label mb-0">{t('courses.location')}</span>
        <span className="text-xs text-gray-700 truncate">{course.location?.name ?? '—'}</span>
      </div>

      {/* Checklist progress */}
      {total > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">צ'קליסט</span>
            <span className={`text-xs font-semibold ${course.checklistIncomplete ? 'text-red-500' : 'text-green-600'}`}>
              {done}/{total}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : course.checklistIncomplete ? 'bg-red-400' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Lecturers */}
      {course.lecturers?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {course.lecturers.map((l) => (
            <span key={l._id} className="text-xs bg-primary/8 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {l.firstName} {l.lastName}
            </span>
          ))}
        </div>
      )}

      {/* Quick status change — coordinators/admins only, not on completed/cancelled */}
      {canEdit && (course.status === 'בתכנון' || course.status === 'פעיל') && (
        <div
          className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && (
            <button
              onClick={handleAdvanceClick}
              disabled={!!checklistBlocked || changing}
              title={checklistBlocked ? `יש לסיים את הצ'קליסט תחילה (${done}/${total})` : `שנה סטטוס ל-${nextStatus}`}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                ${checklistBlocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
                }`}
            >
              {checklistBlocked
                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              }
              {nextStatus}
            </button>
          )}
          <button
            onClick={handleCancelClick}
            disabled={changing}
            title="בטל קורס"
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300"
          >
            בוטל
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {confirmStatus && (
        <Modal open onClose={() => setConfirmStatus(null)} size="sm">
          <div className="text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-base">שינוי סטטוס קורס</p>
              <p className="text-sm text-gray-500 mt-1">
                להעביר את <span className="font-medium text-gray-700">"{course.name?.name}"</span> לסטטוס{' '}
                <span className="font-semibold text-primary">"{confirmStatus}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmStatus(null)}>ביטול</Button>
              <Button className="flex-1" loading={changing} onClick={() => doStatusChange(confirmStatus)}>אישור</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
