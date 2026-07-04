import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import CourseName from './models/CourseName';
import CourseType from './models/CourseType';
import Location from './models/Location';
import ChecklistItem from './models/ChecklistItem';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursemanager');
  console.log('Connected');

  // Admin user
  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    await User.create({ username: 'admin', password: 'Admin123!', role: 'admin', forcePasswordChange: false });
    console.log('Created admin user (password: Admin123!)');
  }

  // Course types
  const types = ['קורס', 'השתלמות', 'יום עיון'];
  for (const name of types) {
    await CourseType.findOneAndUpdate({ name }, { name }, { upsert: true });
  }

  // Sample course names
  const courseNames = ['פיתוח מקצועי', 'מנהיגות חינוכית', 'הוראה מתקדמת', 'טכנולוגיה בחינוך', 'הערכה ומדידה'];
  for (const name of courseNames) {
    await CourseName.findOneAndUpdate({ name }, { name }, { upsert: true });
  }

  // Sample locations
  const locations = ['ת"א - מרכז', 'חיפה - צפון', 'באר שבע - דרום', 'ירושלים', 'זום'];
  for (const name of locations) {
    await Location.findOneAndUpdate({ name }, { name }, { upsert: true });
  }

  // Checklist items
  const checklistItems = [
    { label: 'אושר תקציב', order: 1 },
    { label: 'נשלחו הזמנות למרצים', order: 2 },
    { label: 'נשלחו הזמנות למשתתפים', order: 3 },
    { label: 'הוזמן מיקום/חדר', order: 4 },
    { label: 'הוכן חומר הלמידה', order: 5 },
    { label: 'נשלח אישור השתתפות', order: 6 },
    { label: 'נאסף משוב', order: 7 },
    { label: 'סוכם הקורס ונשמר', order: 8 },
  ];
  for (const item of checklistItems) {
    await ChecklistItem.findOneAndUpdate({ label: item.label }, item, { upsert: true });
  }

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
