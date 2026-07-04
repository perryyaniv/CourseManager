export type UserRole = 'admin' | 'coordinator' | 'viewer';
export type CourseStatus = 'בתכנון' | 'פעיל' | 'הושלם' | 'בוטל';
export type TimeOfDay = 'בוקר' | 'אחר הצהריים' | 'ערב';
export type NoteType = 'regular' | 'important';

export interface User {
  _id: string;
  username: string;
  role: UserRole;
  active: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
}

export interface ManagedListItem {
  _id: string;
  name: string;
  active: boolean;
}

export interface Lecturer {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Note {
  _id: string;
  type: NoteType;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
}

export interface Course {
  _id: string;
  name: ManagedListItem;
  catalogueId?: string;
  type: ManagedListItem;
  lecturers: Lecturer[];
  totalHours?: number;
  sessionsCount?: number;
  startDate?: string;
  endDate?: string;
  timeOfDay?: TimeOfDay;
  startTime?: string;
  endTime?: string;
  location?: ManagedListItem;
  region?: ManagedListItem;
  academicYear?: string;
  numberOfStudents?: number;
  isRecognizedForCredit: boolean;
  status: CourseStatus;
  fundingSource?: string;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  checklistIncomplete?: boolean;
}

export interface ChecklistEntry {
  _id: string;
  label: string;
  order: number;
  checked: boolean;
  checkedByName?: string;
  checkedAt?: string;
}

export interface ChecklistItem {
  _id: string;
  label: string;
  order: number;
  active: boolean;
}

export interface AuditLogEntry {
  _id: string;
  userId: string;
  userName: string;
  courseId?: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CourseFilters {
  academicYear?: string;
  status?: CourseStatus;
  lecturer?: string;
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
