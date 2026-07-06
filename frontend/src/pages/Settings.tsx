import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getList, createItem, updateItem, deleteItem, ListType } from '../api/managedLists';
import { getChecklistItems, createChecklistItem, updateChecklistItem, deleteChecklistItem, reorderChecklistItems } from '../api/checklist';
import { ManagedListItem, Lecturer, ChecklistItem, CourseStatus } from '../types';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

type ListSection = { type: ListType; label: string; hasDetails?: boolean };

const LIST_SECTIONS: ListSection[] = [
  { type: 'course-names', label: 'שמות קורסים' },
  { type: 'course-types', label: 'סוגי קורסים' },
  { type: 'lecturers', label: 'מרצים', hasDetails: true },
  { type: 'locations', label: 'מיקומים' },
];

function SimpleListEditor({ type }: { type: ListType; label: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ManagedListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getList(type).then((data) => setItems(data as ManagedListItem[])).finally(() => setLoading(false));
  }, [type]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const item = await createItem<ManagedListItem>(type, { name: newName.trim() });
    setItems((prev) => [...prev, item]);
    setNewName('');
    setAdding(false);
  };

  const handleToggleActive = async (item: ManagedListItem) => {
    const updated = await updateItem<ManagedListItem>(type, item._id, { active: !item.active });
    setItems((prev) => prev.map((i) => i._id === item._id ? updated : i));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(type, id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'שגיאה במחיקה');
    }
  };

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('settings.itemName')}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button size="sm" loading={adding} onClick={handleAdd}>{t('common.add')}</Button>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${item.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name}</span>
              {!item.active && <span className="text-xs text-gray-400">({t('settings.inactive')})</span>}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleToggleActive(item)}
                className="text-xs text-gray-500 hover:text-primary px-2 py-1 rounded hover:bg-gray-100"
              >
                {item.active ? t('settings.inactive') : t('settings.active')}
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>}
      </div>
    </div>
  );
}

function LecturerEditor() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getList<Lecturer>('lecturers').then(setItems).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setAdding(true);
    const item = await createItem<Lecturer>('lecturers', form);
    setItems((prev) => [...prev, item]);
    setForm({ firstName: '', lastName: '', phone: '', email: '' });
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem('lecturers', id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'שגיאה במחיקה');
    }
  };

  if (loading) return <Spinner size="sm" />;

  const inputCls = 'input';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder={t('settings.firstName')} className={inputCls} />
        <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder={t('settings.lastName')} className={inputCls} />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder={t('settings.phone')} className={inputCls} />
        <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder={t('settings.email')} className={inputCls} />
      </div>
      <Button size="sm" loading={adding} onClick={handleAdd}>{t('common.add')}</Button>
      <div className="space-y-1">
        {items.map((l) => (
          <div key={l._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
            <div>
              <span className={`text-sm font-medium ${l.active ? 'text-gray-800' : 'text-gray-400'}`}>{l.firstName} {l.lastName}</span>
              {(l.phone || l.email) && (
                <p className="text-xs text-gray-400">{[l.phone, l.email].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(l._id)}
              className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-red-50"
            >
              {t('common.delete')}
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>}
      </div>
    </div>
  );
}

function ChecklistEditor() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const dragIndex = { current: -1 };
  const dragOverIndex = { current: -1 };

  useEffect(() => {
    getChecklistItems().then(setItems).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    const item = await createChecklistItem({ label: newLabel.trim(), order: items.length + 1 });
    setItems((prev) => [...prev, item]);
    setNewLabel('');
    setAdding(false);
  };

  const handleToggle = async (item: ChecklistItem) => {
    const updated = await updateChecklistItem(item._id, { active: !item.active });
    setItems((prev) => prev.map((i) => i._id === item._id ? updated : i));
  };

  const handleDelete = async (id: string) => {
    await deleteChecklistItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const handleToggleStatus = async (item: ChecklistItem, status: CourseStatus) => {
    const current = item.applicableStatuses ?? [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    if (updated.length === 0) return; // must keep at least one
    const savedItem = await updateChecklistItem(item._id, { applicableStatuses: updated } as Partial<ChecklistItem>);
    setItems((prev) => prev.map((i) => i._id === item._id ? savedItem : i));
  };

  const handleDragStart = (index: number) => { dragIndex.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = async () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === -1 || to === -1 || from === to) return;

    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const withOrder = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    setItems(withOrder);
    dragIndex.current = -1;
    dragOverIndex.current = -1;

    await reorderChecklistItems(withOrder.map((i) => ({ id: i._id, order: i.order })));
  };

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('settings.itemName')}
          className="input flex-1"
        />
        <Button size="sm" loading={adding} onClick={handleAdd}>{t('common.add')}</Button>
      </div>

      <p className="text-xs text-gray-400">גרור פריטים לשינוי סדר</p>

      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item._id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 px-3 rounded-md border border-gray-100 bg-white hover:border-primary/20 hover:bg-primary/5 cursor-grab active:cursor-grabbing group transition-colors"
          >
            {/* Label row */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <svg className="w-4 h-4 text-gray-300 group-hover:text-primary/40 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="7" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/>
                <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
                <circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/>
              </svg>
              <span className="text-xs text-gray-300 w-5 text-center flex-shrink-0">{index + 1}</span>
              <span className={`text-sm font-medium truncate ${item.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {item.label}
              </span>
            </div>

            {/* Status chips + actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['בתכנון', 'פעיל', 'הושלם', 'בוטל'] as CourseStatus[]).map((status) => {
                const active = (item.applicableStatuses ?? []).includes(status);
                const colors: Record<CourseStatus, string> = {
                  'בתכנון': active ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-300 border-gray-200',
                  'פעיל':   active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-300 border-gray-200',
                  'הושלם':  active ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-gray-50 text-gray-300 border-gray-200',
                  'בוטל':   active ? 'bg-red-100 text-red-600 border-red-300' : 'bg-gray-50 text-gray-300 border-gray-200',
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(item, status); }}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${colors[status]}`}
                  >
                    {status}
                  </button>
                );
              })}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                <button onClick={() => handleToggle(item)} className="text-xs text-gray-500 hover:text-primary px-2 py-1 rounded hover:bg-gray-100">
                  {item.active ? 'השבת' : 'הפעל'}
                </button>
                <button onClick={() => handleDelete(item._id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('course-names');

  const tabs = [
    ...LIST_SECTIONS.map((s) => ({ key: s.type, label: s.label })),
    { key: 'checklist', label: t('settings.checklistItems') },
  ];

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-2 ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {activeTab === 'lecturers' ? (
          <LecturerEditor />
        ) : activeTab === 'checklist' ? (
          <ChecklistEditor />
        ) : (
          <SimpleListEditor type={activeTab as ListType} label={tabs.find((t) => t.key === activeTab)?.label ?? ''} />
        )}
      </div>
    </div>
  );
}
