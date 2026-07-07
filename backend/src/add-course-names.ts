import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CourseName from './models/CourseName';

dotenv.config();

const COURSE_NAMES = [
  'השקעות ושוק ההון',
  'הכשרת דירקטור בכיר',
  'התמודדות עם לחץ, עומס ושחיקה – מיינדפולנס',
  'גמר המונדיאל הגדול',
  'מסליחה לזריחה',
  'זורחת מבפנים',
  'הכשרת ועדים',
  'מוכנות לכיתה א',
  'בינה מלאכותית וחדשנות בעולם העבודה',
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursemanager');
  console.log('Connected');

  let added = 0;
  let skipped = 0;

  for (const name of COURSE_NAMES) {
    const existing = await CourseName.findOne({ name });
    if (existing) {
      console.log(`  ⚠ כבר קיים: ${name}`);
      skipped++;
    } else {
      await CourseName.create({ name });
      console.log(`  ✓ נוסף: ${name}`);
      added++;
    }
  }

  console.log(`\nסיום: ${added} נוספו, ${skipped} דולגו`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
