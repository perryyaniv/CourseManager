import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createCourse } from '../api/courses';
import CourseForm from '../components/courses/CourseForm';

export default function NewCourse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-dark">{t('nav.addCourse')}</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CourseForm onSubmit={handleSubmit} onCancel={() => navigate('/courses')} loading={loading} wizard />
      </div>
    </div>
  );
}
