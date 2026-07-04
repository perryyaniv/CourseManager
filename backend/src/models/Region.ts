import mongoose, { Schema, Document } from 'mongoose';

export interface IRegion extends Document {
  name: string;
  active: boolean;
}

const RegionSchema = new Schema<IRegion>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRegion>('Region', RegionSchema);
