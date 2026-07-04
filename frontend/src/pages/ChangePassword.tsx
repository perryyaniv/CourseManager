import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changePassword } from '../api/auth';
import Button from '../components/ui/Button';

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError(t('auth.passwordTooShort')); return; }
    if (newPassword !== confirm) { setError(t('auth.passwordsNoMatch')); return; }
    setLoading(true);
    try {
      await changePassword(newPassword);
      navigate('/');
    } catch {
      setError('שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img src="/logo.png" alt="לוגו" className="h-20 w-auto mx-auto" />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        <div className="h-1 -mx-8 -mt-8 mb-6 rounded-t-2xl bg-gradient-to-l from-primary via-accent to-brand-blue" />

        <h1 className="text-xl font-bold text-gray-800 mb-1">{t('auth.changePasswordTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('auth.changePasswordSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.newPassword')}</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-lg text-center">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.changePassword')}
          </Button>
        </form>
      </div>
    </div>
  );
}
