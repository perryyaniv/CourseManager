import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  active: boolean;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILocation>('Location', LocationSchema);
