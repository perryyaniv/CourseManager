import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createCourse, importFromUrl, ImportedCourse } from '../api/courses';
import CourseForm from '../components/courses/CourseForm';
import Button from '../components/ui/Button';
import { Course } from '../types';

export default function NewCourse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [imported, setImported] = useState<ImportedCourse | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setImportError('');
    setImporting(true);
    try {
      const data = await importFromUrl(urlInput.trim());
      setImported(data);
      setFormKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setImportError(msg || 'לא ניתן לייבא מהכתובת');
    } finally {
      setImporting(false);
    }
  };

  const importedToInitial = (data: ImportedCourse): Partial<Course> => ({
    sessionsCount: data.sessionsCount,
    totalHours: data.totalHours,
    timeOfDay: data.timeOfDay as Course['timeOfDay'],
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.locationId ? { _id: data.locationId, name: '', active: true } : undefined,
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const course = await createCourse(data);
      navigate(`/courses/${course._id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.addCourse')}</h1>
      </div>

      {/* URL import */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">ייבוא פרטים מאתר הקורס</p>
        <form onSubmit={handleImport} className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.peoples.org.il/product/..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            dir="ltr"
          />
          <Button type="submit" variant="secondary" size="sm" loading={importing}>
            ייבא פרטים
          </Button>
        </form>
        {importError && <p className="text-sm text-red-500 mt-2">{importError}</p>}
        {imported && (
          <div className="mt-2 flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm text-green-700">
              <span className="font-medium">פרטים יובאו בהצלחה</span>
              {imported.suggestedName && <span className="text-green-600"> — {imported.suggestedName}</span>}
              <span className="text-green-500 text-xs block mt-0.5">בדוק ועדכן את השדות לפי הצורך לפני השמירה</span>
            </div>
          </div>
        )}
      </div>

      {/* Course form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CourseForm
          key={formKey}
          initial={imported ? importedToInitial(imported) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/courses')}
          loading={loading}
        />
      </div>
    </div>
  );
}
