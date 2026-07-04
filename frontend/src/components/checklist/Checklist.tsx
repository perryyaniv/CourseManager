import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChecklistEntry } from '../../types';
import { getCourseChecklist, toggleChecklistItem } from '../../api/checklist';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

interface Props {
  courseId: string;
}

export default function Checklist({ courseId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'coordinator';

  useEffect(() => {
    getCourseChecklist(courseId)
      .then(setItems)
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

  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#16A34A' : 'linear-gradient(to left, #8C1C13, #D45A1B)',
            }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 w-20 text-left">
          {done} / {total} ({pct}%)
        </span>
        {done === total && total > 0 && (
          <span className="text-sm text-green-600 font-semibold">{t('checklist.allDone')} ✓</span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item._id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              item.checked
                ? 'bg-green-50 border-green-100'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <button
              type="button"
              disabled={!canEdit || toggling === item._id}
              onClick={() => handleToggle(item._id, !item.checked)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                item.checked
                  ? 'bg-primary border-primary'
                  : 'border-gray-300 hover:border-primary bg-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {item.label}
              </span>
              {item.checked && item.checkedByName && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('checklist.checkedBy')}: {item.checkedByName}
                  {item.checkedAt && ` · ${new Date(item.checkedAt).toLocaleDateString('he-IL')}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
