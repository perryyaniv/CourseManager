import mongoose, { Schema, Document } from 'mongoose';

export type CourseStatus = 'בתכנון' | 'פעיל' | 'הושלם' | 'בוטל';
export type TimeOfDay = 'בוקר' | 'אחר הצהריים' | 'ערב';

export interface INote {
  _id: mongoose.Types.ObjectId;
  type: 'regular' | 'important';
  content: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  createdAt: Date;
}

export interface ICourse extends Document {
  name: mongoose.Types.ObjectId;
  catalogueId?: string;
  type: mongoose.Types.ObjectId;
  lecturers: mongoose.Types.ObjectId[];
  totalHours?: number;
  sessionsCount?: number;
  startDate?: Date;
  endDate?: Date;
  timeOfDay?: TimeOfDay;
  startTime?: string;
  endTime?: string;
  location?: mongoose.Types.ObjectId;
  region?: mongoose.Types.ObjectId;
  academicYear?: string;
  numberOfStudents?: number;
  isRecognizedForCredit: boolean;
  status: CourseStatus;
  fundingSource?: string;
  notes: INote[];
}

const NoteSchema = new Schema<INote>(
  {
    type: { type: String, enum: ['regular', 'important'], required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: Schema.Types.ObjectId, ref: 'CourseName', required: true },
    catalogueId: { type: String },
    type: { type: Schema.Types.ObjectId, ref: 'CourseType', required: true },
    lecturers: [{ type: Schema.Types.ObjectId, ref: 'Lecturer' }],
    totalHours: { type: Number },
    sessionsCount: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    timeOfDay: { type: String, enum: ['בוקר', 'אחר הצהריים', 'ערב'] },
    startTime: { type: String },
    endTime: { type: String },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    region: { type: Schema.Types.ObjectId, ref: 'Region' },
    academicYear: { type: String },
    numberOfStudents: { type: Number },
    isRecognizedForCredit: { type: Boolean, default: false },
    status: { type: String, enum: ['בתכנון', 'פעיל', 'הושלם', 'בוטל'], default: 'בתכנון', required: true },
    fundingSource: { type: String },
    notes: [NoteSchema],
  },
  { timestamps: true }
);

CourseSchema.index({ status: 1 });
CourseSchema.index({ startDate: 1 });
CourseSchema.index({ academicYear: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
