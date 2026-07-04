import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseType extends Document {
  name: string;
  active: boolean;
}

const CourseTypeSchema = new Schema<ICourseType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseType>('CourseType', CourseTypeSchema);
