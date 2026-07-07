import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Course, CourseStatus, TimeOfDay, ManagedListItem, Lecturer } from '../../types';
import { getList, getLecturers } from '../../api/managedLists';
import Button from '../ui/Button';
import DateInput from '../ui/DateInput';

type FormData = {
  name: string;
  catalogueId: string;
  type: string;
  lecturers: string[];
  totalHours: string;
  sessionsCount: string;
  startDate: string;
  endDate: string;
  timeOfDay: TimeOfDay | '';
  startTime: string;
  endTime: string;
  location: string;
  academicYear: string;
  numberOfStudents: string;
  isRecognizedForCredit: boolean;
  status: CourseStatus;
};

const STATUSES: CourseStatus[] = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];
const TIMES_OF_DAY: TimeOfDay[] = ['בוקר', 'אחר הצהריים', 'ערב'];

interface Props {
  initial?: Partial<Course>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  checklistIncomplete?: boolean;
}

function toForm(course?: Partial<Course>): FormData {
  return {
    name: (course?.name as ManagedListItem)?._id ?? (course?.name as unknown as string) ?? '',
    catalogueId: course?.catalogueId ?? '',
    type: (course?.type as ManagedListItem)?._id ?? (course?.type as unknown as string) ?? '',
    lecturers: course?.lecturers?.map((l) => (l as Lecturer)._id) ?? [],
    totalHours: course?.totalHours?.toString() ?? '',
    sessionsCount: course?.sessionsCount?.toString() ?? '',
    startDate: course?.startDate ? course.startDate.slice(0, 10) : '',
    endDate: course?.endDate ? course.endDate.slice(0, 10) : '',
    timeOfDay: course?.timeOfDay ?? '',
    startTime: course?.startTime ?? '',
    endTime: course?.endTime ?? '',
    location: (course?.location as ManagedListItem)?._id ?? (course?.location as unknown as string) ?? '',
    academicYear: course?.academicYear ?? '',
    numberOfStudents: course?.numberOfStudents?.toString() ?? '',
    isRecognizedForCredit: course?.isRecognizedForCredit ?? false,
    status: course?.status ?? 'בתכנון',
  };
}

export default function CourseForm({ initial, onSubmit, onCancel, loading, checklistIncomplete }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>(toForm(initial));
  const [courseNames, setCourseNames] = useState<ManagedListItem[]>([]);
  const [courseTypes, setCourseTypes] = useState<ManagedListItem[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [locations, setLocations] = useState<ManagedListItem[]>([]);

  useEffect(() => {
    Promise.all([
      getList('course-names'),
      getList('course-types'),
      getLecturers(),
      getList('locations'),
    ]).then(([names, types, lecs, locs]) => {
      setCourseNames(names.filter((i) => i.active));
      setCourseTypes(types.filter((i) => i.active));
      setLecturers((lecs as Lecturer[]).filter((l) => l.active));
      setLocations(locs.filter((i) => i.active));
    });
  }, []);

  const set = (field: keyof FormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleLecturer = (id: string) =>
    set('lecturers', form.lecturers.includes(id) ? form.lecturers.filter((l) => l !== id) : [...form.lecturers, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...form,
      totalHours: form.totalHours ? Number(form.totalHours) : undefined,
      sessionsCount: form.sessionsCount ? Number(form.sessionsCount) : undefined,
      numberOfStudents: form.numberOfStudents ? Number(form.numberOfStudents) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      timeOfDay: form.timeOfDay || undefined,
      location: form.location || undefined,
    };
    Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
    await onSubmit(payload);
  };

  const inputCls = 'input';
  const field = (label: string, children: React.ReactNode) => (
    <div><label className="label">{label}</label>{children}</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field(t('courses.courseName') + ' *', (
          <select required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls}>
            <option value="">בחר...</option>
            {courseNames.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
          </select>
        ))}

        {field(t('courses.catalogueId'), (
          <input value={form.catalogueId} onChange={(e) => set('catalogueId', e.target.value)} className={inputCls} />
        ))}

        {field(t('courses.type') + ' *', (
          <select required value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
            <option value="">בחר...</option>
            {courseTypes.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        ))}

        <div>
          <label className="label">{t('courses.status')}</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as CourseStatus)}
            className={inputCls}
          >
            {STATUSES.map((s) => {
              const isCurrentStatus = s === initial?.status;
              const isCancellation = s === 'בוטל';
              const blocked = checklistIncomplete && !isCurrentStatus && !isCancellation;
              return (
                <option key={s} value={s} disabled={blocked}>
                  {s}{blocked ? ' (השלם צ\'קליסט תחילה)' : ''}
                </option>
              );
            })}
          </select>
          {checklistIncomplete && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              שינוי סטטוס חסום — יש לסיים את הצ'קליסט של הסטטוס הנוכחי תחילה
            </p>
          )}
        </div>

        {field(t('courses.totalHours'), (
          <input type="number" min="0" value={form.totalHours} onChange={(e) => set('totalHours', e.target.value)} className={inputCls} />
        ))}

        {field(t('courses.sessionsCount'), (
          <input type="number" min="0" value={form.sessionsCount} onChange={(e) => set('sessionsCount', e.target.value)} className={inputCls} />
        ))}

        {field(t('courses.startDate'), (
          <DateInput value={form.startDate} onChange={(v) => set('startDate', v)} className={inputCls + ' pl-9'} />
        ))}

        {field(t('courses.endDate'), (
          <DateInput value={form.endDate} onChange={(v) => set('endDate', v)} className={inputCls + ' pl-9'} />
        ))}

        {field(t('courses.timeOfDay'), (
          <select value={form.timeOfDay} onChange={(e) => set('timeOfDay', e.target.value as TimeOfDay | '')} className={inputCls}>
            <option value="">בחר...</option>
            {TIMES_OF_DAY.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}

        {field(t('courses.startTime'), (
          <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
        ))}

        {field(t('courses.endTime'), (
          <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
        ))}

        {field(t('courses.location'), (
          <select value={form.location} onChange={(e) => set('location', e.target.value)} className={inputCls}>
            <option value="">בחר...</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        ))}

        {field(t('courses.academicYear'), (
          <input value={form.academicYear} onChange={(e) => set('academicYear', e.target.value)} placeholder='2024-2025' className={inputCls} />
        ))}

        {field(t('courses.numberOfStudents'), (
          <input type="number" min="0" value={form.numberOfStudents} onChange={(e) => set('numberOfStudents', e.target.value)} className={inputCls} />
        ))}

      </div>

      <div>
        <label className="label">{t('courses.lecturers')}</label>
        <div className="flex flex-wrap gap-2 border border-gray-300 rounded-md p-3 bg-white min-h-[2.5rem]">
          {lecturers.map((l) => (
            <button
              type="button"
              key={l._id}
              onClick={() => toggleLecturer(l._id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${form.lecturers.includes(l._id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {l.firstName} {l.lastName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="credit"
          type="checkbox"
          checked={form.isRecognizedForCredit}
          onChange={(e) => set('isRecognizedForCredit', e.target.checked)}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="credit" className="text-sm text-gray-700">{t('courses.isRecognizedForCredit')}</label>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading}>{t('common.save')}</Button>
      </div>
    </form>
  );
}
