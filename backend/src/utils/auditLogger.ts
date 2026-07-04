import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

export async function logAudit(params: {
  userId: string | mongoose.Types.ObjectId;
  userName: string;
  courseId?: string | mongoose.Types.ObjectId;
  action: string;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    await AuditLog.create({
      userId: params.userId,
      userName: params.userName,
      courseId: params.courseId,
      action: params.action,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue !== undefined ? String(params.oldValue) : undefined,
      newValue: params.newValue !== undefined ? String(params.newValue) : undefined,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
