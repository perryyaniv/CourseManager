import mongoose, { Schema, Document } from 'mongoose';

export interface ILecturer extends Document {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  active: boolean;
}

const LecturerSchema = new Schema<ILecturer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILecturer>('Lecturer', LecturerSchema);
