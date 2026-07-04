import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, createUser, updateUser, resetPassword } from '../api/users';
import { User, UserRole } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const ROLES: UserRole[] = ['admin', 'coordinator', 'viewer'];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'מנהל',
  coordinator: 'עורך',
  viewer: 'צופה',
};

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'coordinator' as UserRole });
  const [tempPassword, setTempPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const user = await createUser(newUser);
      setUsers((prev) => [user, ...prev]);
      setAddModal(false);
      setNewUser({ username: '', password: '', role: 'coordinator' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    const updated = await updateUser(u._id, { active: !u.active });
    setUsers((prev) => prev.map((x) => x._id === u._id ? updated : x));
  };

  const handleRoleChange = async (u: User, role: UserRole) => {
    const updated = await updateUser(u._id, { role });
    setUsers((prev) => prev.map((x) => x._id === u._id ? updated : x));
  };

  const handleResetPassword = async () => {
    if (!resetModal || !tempPassword.trim()) return;
    await resetPassword(resetModal._id, tempPassword.trim());
    setResetModal(null);
    setTempPassword('');
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <Button size="sm" onClick={() => setAddModal(true)}>+ {t('users.addUser')}</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('users.username')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('users.role')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('users.active')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('users.createdAt')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('he-IL')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setResetModal(u)}>
                      {t('users.resetPassword')}
                    </Button>
                    <Button
                      size="sm"
                      variant={u.active ? 'danger' : 'secondary'}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.active ? t('users.deactivate') : t('users.activate')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title={t('users.addUser')} size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.username')}</label>
            <input required value={newUser.username} onChange={(e) => setNewUser((f) => ({ ...f, username: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')} (זמנית)</label>
            <input required type="password" value={newUser.password} onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.role')}</label>
            <select value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value as UserRole }))} className={inputCls}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setAddModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>{t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title={t('users.resetPassword')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">הזן סיסמה זמנית למשתמש <strong>{resetModal?.username}</strong></p>
          <input
            type="text"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder={t('users.tempPassword')}
            className={inputCls}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setResetModal(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleResetPassword} disabled={!tempPassword.trim()}>{t('common.confirm')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
