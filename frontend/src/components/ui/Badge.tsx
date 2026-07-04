import { CourseStatus } from '../../types';

const statusConfig: Record<CourseStatus, { label: string; className: string }> = {
  'בתכנון': { label: 'בתכנון', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  'פעיל': { label: 'פעיל', className: 'bg-green-100 text-green-700 border border-green-200' },
  'הושלם': { label: 'הושלם', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  'בוטל': { label: 'בוטל', className: 'bg-red-100 text-red-600 border border-red-200' },
};

interface StatusBadgeProps { status: CourseStatus }

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
