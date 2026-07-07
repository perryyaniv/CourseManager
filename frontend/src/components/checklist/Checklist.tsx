import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChecklistEntry, CourseStatus } from '../../types';
import { getCourseChecklist, toggleChecklistItem } from '../../api/checklist';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';
import { formatDate } from '../../utils/date';

interface Props {
  courseId: string;
}

const STATUS_ORDER: CourseStatus[] = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];

const STATUS_LABELS: Record<CourseStatus, string> = {
  'בתכנון': 'בתכנון',
  'פעיל': 'פעיל',
  'הושלם': 'הושלם',
  'בוטל': 'בוטל',
};

const STATUS_COLORS: Record<CourseStatus, { header: string; border: string; badge: string }> = {
  'בתכנון': { header: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  'פעיל':   { header: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700 border-green-200' },
  'הושלם':  { header: 'text-gray-600', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  'בוטל':   { header: 'text-red-600', border: 'border-red-200', badge: 'bg-red-100 text-red-600 border-red-200' },
};

export default function Checklist({ courseId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistEntry[]>([]);
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('בתכנון');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'coordinator';

  useEffect(() => {
    getCourseChecklist(courseId)
      .then((res) => {
        setItems(res.items);
        setCourseStatus(res.courseStatus as CourseStatus);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleToggle = async (itemId: string, checked: boolean) => {
    if (!canEdit) return;
    setToggling(itemId);
    try {
      await toggleChecklistItem(courseId, itemId, checked);
      setItems((prev) => prev.map((i) => i._id === itemId ? { ...i, checked } : i));
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <Spinner />;

  const currentStatusIndex = STATUS_ORDER.indexOf(courseStatus);

  // Group items by their primary applicable status (first in STATUS_ORDER)
  const grouped: Partial<Record<CourseStatus, ChecklistEntry[]>> = {};
  for (const item of items) {
    const primaryStatus = STATUS_ORDER.find((s) => item.applicableStatuses?.includes(s));
    if (!primaryStatus) continue;
    if (!grouped[primaryStatus]) grouped[primaryStatus] = [];
    grouped[primaryStatus]!.push(item);
  }

  const totalApplicable = items.filter((i) => i.applicableStatuses?.includes(courseStatus)).length;
  const totalChecked = items.filter((i) => i.applicableStatuses?.includes(courseStatus) && i.checked).length;
  const pct = totalApplicable > 0 ? Math.round((totalChecked / totalApplicable) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Overall progress for current status */}
      {totalApplicable > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#324DB7' }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
            {totalChecked} / {totalApplicable} ({pct}%)
          </span>
          {pct === 100 && (
            <span className="text-sm text-green-600 font-semibold">{t('checklist.allDone')} ✓</span>
          )}
        </div>
      )}

      {/* Status sections */}
      {STATUS_ORDER.map((status) => {
        const sectionItems = grouped[status];
        if (!sectionItems || sectionItems.length === 0) return null;

        const statusIndex = STATUS_ORDER.indexOf(status);
        const isCurrent = status === courseStatus;
        const isFuture = statusIndex > currentStatusIndex;
        const colors = STATUS_COLORS[status];

        const sectionChecked = sectionItems.filter((i) => i.checked).length;

        return (
          <div key={status} className={`rounded-lg border ${isFuture ? 'border-gray-100 opacity-50' : colors.border}`}>
            {/* Section header */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-lg ${isFuture ? 'bg-gray-50' : 'bg-white border-b ' + colors.border}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${isFuture ? 'text-gray-400' : colors.header}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {sectionChecked}/{sectionItems.length}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {sectionItems.map((item) => {
                const isCheckable = isCurrent && canEdit;

                return (
                  <div
                    key={item._id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${isFuture ? 'bg-gray-50/50' : 'bg-white'}`}
                  >
                    <button
                      type="button"
                      disabled={!isCheckable || toggling === item._id}
                      onClick={() => isCheckable && handleToggle(item._id, !item.checked)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.checked
                          ? 'bg-primary border-primary'
                          : isCheckable
                          ? 'border-gray-300 hover:border-primary bg-white'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      {item.checked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : isFuture ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
                        {item.label}
                      </span>
                      {item.checked && item.checkedByName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('checklist.checkedBy')}: {item.checkedByName}
                          {item.checkedAt && ` · ${formatDate(item.checkedAt)}`}
                        </p>
                      )}
                    </div>

                    {isFuture && (
                      <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>
      )}
    </div>
  );
}
