import mongoose, { Schema, Document } from 'mongoose';

export type CourseStatus = 'בתכנון' | 'פעיל' | 'הושלם' | 'בוטל';
const ALL_STATUSES: CourseStatus[] = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];

export interface IChecklistItem extends Document {
  label: string;
  order: number;
  active: boolean;
  applicableStatuses: CourseStatus[];
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    applicableStatuses: {
      type: [String],
      enum: ALL_STATUSES,
      default: ALL_STATUSES,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IChecklistItem>('ChecklistItem', ChecklistItemSchema);
