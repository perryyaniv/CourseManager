import { CourseStatus } from '../../types';

const statusConfig: Record<CourseStatus, { label: string; dot: string }> = {
  'בתכנון': { label: 'בתכנון', dot: 'bg-blue-400' },
  'פעיל':   { label: 'פעיל',   dot: 'bg-green-500' },
  'הושלם':  { label: 'הושלם',  dot: 'bg-gray-400' },
  'בוטל':   { label: 'בוטל',   dot: 'bg-red-400' },
};

interface StatusBadgeProps { status: CourseStatus }

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, dot: 'bg-gray-300' };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className="text-xs text-gray-600 font-medium">{cfg.label}</span>
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
