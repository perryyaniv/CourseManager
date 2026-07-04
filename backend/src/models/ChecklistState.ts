import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistState extends Document {
  courseId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  checked: boolean;
  checkedBy?: mongoose.Types.ObjectId;
  checkedByName?: string;
  checkedAt?: Date;
}

const ChecklistStateSchema = new Schema<IChecklistState>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'ChecklistItem', required: true },
    checked: { type: Boolean, default: false },
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkedByName: { type: String },
    checkedAt: { type: Date },
  },
  { timestamps: true }
);

ChecklistStateSchema.index({ courseId: 1, itemId: 1 }, { unique: true });

export default mongoose.model<IChecklistState>('ChecklistState', ChecklistStateSchema);
