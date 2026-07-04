import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourse, updateCourse, deleteCourse, cloneCourse, addNote } from '../api/courses';
import { Course } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import CourseForm from '../components/courses/CourseForm';
import Checklist from '../components/checklist/Checklist';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getAuditLog } from '../api/auditLog';
import { AuditLogEntry } from '../types';
import { io } from 'socket.io-client';

type Tab = 'details' | 'checklist' | 'history';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium flex-1">{value ?? '—'}</span>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteType, setNoteType] = useState<'regular' | 'important'>('regular');
  const [noteContent, setNoteContent] = useState('');
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [liveAlert, setLiveAlert] = useState('');

  const canEdit = user?.role === 'admin' || user?.role === 'coordinator';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    getCourse(id).then(setCourse).finally(() => setLoading(false));

    const socket = io('', { path: '/socket.io' });
    socket.emit('join-course', id);
    socket.on('course-updated', (updated: Course) => {
      setCourse(updated);
      setLiveAlert('הקורס עודכן על ידי משתמש אחר');
      setTimeout(() => setLiveAlert(''), 5000);
    });
    return () => { socket.emit('leave-course', id); socket.disconnect(); };
  }, [id]);

  useEffect(() => {
    if (tab === 'history' && id) {
      getAuditLog({ courseId: id, limit: 100 }).then((r) => setHistory(r.data));
    }
  }, [tab, id]);

  const handleSave = async (data: Record<string, unknown>) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateCourse(id, data);
      setCourse(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCourse(id);
    navigate('/courses');
  };

  const handleClone = async () => {
    if (!id) return;
    const cloned = await cloneCourse(id);
    navigate(`/courses/${cloned._id}`);
  };

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    const updated = await addNote(id, noteType, noteContent.trim());
    setCourse(updated);
    setNoteModal(false);
    setNoteContent('');
    setNoteType('regular');
  };

  if (loading) return <Spinner />;
  if (!course) return <div className="text-center py-16 text-gray-400">קורס לא נמצא</div>;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details', label: t('courses.details') },
    { key: 'checklist', label: t('courses.checklist') },
    { key: 'history', label: t('courses.history') },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {liveAlert && (
        <div className="bg-accent/20 border border-accent/40 text-yellow-800 text-sm px-4 py-2.5 rounded-lg">
          {liveAlert}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{course.name?.name}</h1>
            <StatusBadge status={course.status} />
          </div>
          {course.catalogueId && <p className="text-sm text-gray-400 mr-8">{course.catalogueId}</p>}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={handleClone}>{t('courses.clone')}</Button>
            {!editing && <Button size="sm" onClick={() => setEditing(true)}>{t('courses.edit')}</Button>}
            {course.status === 'בתכנון' && isAdmin && (
              <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>{t('courses.delete')}</Button>
            )}
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        {TABS.map((tab_) => (
          <button
            key={tab_.key}
            onClick={() => { setTab(tab_.key); setEditing(false); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tab_.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === 'details' && (
          editing ? (
            <CourseForm initial={course} onSubmit={handleSave} onCancel={() => setEditing(false)} loading={saving} />
          ) : (
            <div className="space-y-1">
              <DetailRow label={t('courses.courseName')} value={course.name?.name} />
              <DetailRow label={t('courses.catalogueId')} value={course.catalogueId} />
              <DetailRow label={t('courses.type')} value={course.type?.name} />
              <DetailRow label={t('courses.status')} value={<StatusBadge status={course.status} />} />
              <DetailRow label={t('courses.academicYear')} value={course.academicYear} />
              <DetailRow label={t('courses.totalHours')} value={course.totalHours} />
              <DetailRow label={t('courses.sessionsCount')} value={course.sessionsCount} />
              <DetailRow label={t('courses.startDate')} value={formatDate(course.startDate)} />
              <DetailRow label={t('courses.endDate')} value={formatDate(course.endDate)} />
              <DetailRow label={t('courses.timeOfDay')} value={course.timeOfDay} />
              <DetailRow label={t('courses.startTime')} value={course.startTime} />
              <DetailRow label={t('courses.endTime')} value={course.endTime} />
              <DetailRow label={t('courses.location')} value={course.location?.name} />
              <DetailRow label={t('courses.numberOfStudents')} value={course.numberOfStudents} />
              <DetailRow label={t('courses.isRecognizedForCredit')} value={course.isRecognizedForCredit ? 'כן' : 'לא'} />
              <DetailRow
                label={t('courses.lecturers')}
                value={course.lecturers?.map((l) => `${l.firstName} ${l.lastName}`).join(', ') || undefined}
              />

              {course.notes?.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('courses.notes')}</p>
                  <div className="space-y-2">
                    {course.notes.map((n) => (
                      <div key={n._id} className={`p-3 rounded-lg text-sm ${n.type === 'important' ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
                        <p className="text-gray-800">{n.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.authorName} · {formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="pt-4">
                  <Button variant="secondary" size="sm" onClick={() => setNoteModal(true)}>
                    + {t('courses.addNote')}
                  </Button>
                </div>
              )}
            </div>
          )
        )}

        {tab === 'checklist' && id && <Checklist courseId={id} />}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>
            ) : history.map((entry) => (
              <div key={entry._id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{entry.userName}</span> — {entry.action}
                    {entry.fieldChanged && (
                      <span className="text-gray-500"> ({entry.fieldChanged}: {entry.oldValue} → {entry.newValue})</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('he-IL')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title={t('common.areYouSure')} size="sm">
        <p className="text-sm text-gray-600 mb-4">{t('courses.deleteConfirm')}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('courses.delete')}</Button>
        </div>
      </Modal>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title={t('courses.addNote')} size="sm">
        <div className="space-y-4">
          <div className="flex gap-3">
            {(['regular', 'important'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNoteType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${noteType === type ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {t(`courses.${type}`)}
              </button>
            ))}
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder={t('courses.noteContent')}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNoteModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddNote} disabled={!noteContent.trim()}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
