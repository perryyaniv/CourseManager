import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseName extends Document {
  name: string;
  active: boolean;
}

const CourseNameSchema = new Schema<ICourseName>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseName>('CourseName', CourseNameSchema);
