import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  courseId?: mongoose.Types.ObjectId;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  action: { type: String, required: true },
  fieldChanged: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ courseId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
