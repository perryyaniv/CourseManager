import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistItem extends Document {
  label: string;
  order: number;
  active: boolean;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IChecklistItem>('ChecklistItem', ChecklistItemSchema);
