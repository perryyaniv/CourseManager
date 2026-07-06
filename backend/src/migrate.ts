import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ChecklistItem from './models/ChecklistItem';

dotenv.config();

const ALL_STATUSES = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursemanager');
  console.log('Connected');

  // Set applicableStatuses on all existing items that don't have it
  const result = await ChecklistItem.updateMany(
    { applicableStatuses: { $exists: false } },
    { $set: { applicableStatuses: ALL_STATUSES } }
  );
  console.log(`Updated ${result.modifiedCount} checklist items with applicableStatuses`);

  await mongoose.disconnect();
  console.log('Done');
}

migrate().catch((err) => { console.error(err); process.exit(1); });
