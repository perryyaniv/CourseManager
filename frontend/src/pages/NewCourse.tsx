import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api/courses';
import CourseForm from '../components/courses/CourseForm';

export default function NewCourse() {
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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CourseForm onSubmit={handleSubmit} onCancel={() => navigate('/courses')} loading={loading} wizard />
      </div>
    </div>
  );
}
