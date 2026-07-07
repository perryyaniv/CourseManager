import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Course from './models/Course';
import CourseName from './models/CourseName';
import CourseType from './models/CourseType';
import Location from './models/Location';

dotenv.config();

function date(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursemanager');
  console.log('Connected');

  const names    = await CourseName.find();
  const types    = await CourseType.find();
  const locations = await Location.find();

  const nameMap = Object.fromEntries(names.map(n => [n.name, n._id]));
  const typeMap = Object.fromEntries(types.map(t => [t.name, t._id]));
  const locMap  = Object.fromEntries(locations.map(l => [l.name, l._id]));

  const courses = [
    // ── הושלמו ─────────────────────────────────────────────────
    {
      name: nameMap['השקעות ושוק ההון'],
      type: typeMap['קורס'],
      status: 'הושלם',
      startDate: date(2025, 9, 3),
      endDate:   date(2025, 11, 19),
      totalHours: 40, sessionsCount: 10,
      timeOfDay: 'אחר הצהריים', startTime: '17:00', endTime: '20:15',
      location: locMap['זום'],
      academicYear: '2025-2026',
      numberOfStudents: 24,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['הכשרת דירקטור בכיר'],
      type: typeMap['השתלמות'],
      status: 'הושלם',
      startDate: date(2025, 10, 7),
      endDate:   date(2025, 12, 16),
      totalHours: 32, sessionsCount: 8,
      timeOfDay: 'ערב', startTime: '18:00', endTime: '21:00',
      location: locMap['ת"א - מרכז'],
      academicYear: '2025-2026',
      numberOfStudents: 18,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['הכשרת ועדים'],
      type: typeMap['קורס'],
      status: 'הושלם',
      startDate: date(2025, 11, 4),
      endDate:   date(2026, 1, 27),
      totalHours: 24, sessionsCount: 6,
      timeOfDay: 'אחר הצהריים', startTime: '16:00', endTime: '20:00',
      location: locMap['זום'],
      academicYear: '2025-2026',
      numberOfStudents: 31,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['מנהיגות חינוכית'],
      type: typeMap['השתלמות'],
      status: 'הושלם',
      startDate: date(2025, 9, 15),
      endDate:   date(2026, 2, 10),
      totalHours: 60, sessionsCount: 15,
      timeOfDay: 'בוקר', startTime: '08:30', endTime: '13:00',
      location: locMap['ירושלים'],
      academicYear: '2025-2026',
      numberOfStudents: 22,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['הערכה ומדידה'],
      type: typeMap['יום עיון'],
      status: 'הושלם',
      startDate: date(2026, 2, 17),
      endDate:   date(2026, 2, 17),
      totalHours: 8, sessionsCount: 1,
      timeOfDay: 'בוקר', startTime: '09:00', endTime: '17:00',
      location: locMap['חיפה - צפון'],
      academicYear: '2025-2026',
      numberOfStudents: 45,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['פיתוח מקצועי'],
      type: typeMap['השתלמות'],
      status: 'הושלם',
      startDate: date(2025, 12, 2),
      endDate:   date(2026, 3, 24),
      totalHours: 30, sessionsCount: 10,
      timeOfDay: 'אחר הצהריים', startTime: '15:30', endTime: '18:30',
      location: locMap['באר שבע - דרום'],
      academicYear: '2025-2026',
      numberOfStudents: 16,
      isRecognizedForCredit: true,
    },

    // ── פעילים כרגע ─────────────────────────────────────────────
    {
      name: nameMap['בינה מלאכותית וחדשנות בעולם העבודה'],
      type: typeMap['קורס'],
      status: 'פעיל',
      startDate: date(2026, 5, 6),
      endDate:   date(2026, 8, 26),
      totalHours: 40, sessionsCount: 10,
      timeOfDay: 'ערב', startTime: '18:30', endTime: '21:30',
      location: locMap['זום'],
      academicYear: '2025-2026',
      numberOfStudents: 28,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['התמודדות עם לחץ, עומס ושחיקה – מיינדפולנס'],
      type: typeMap['קורס'],
      status: 'פעיל',
      startDate: date(2026, 4, 14),
      endDate:   date(2026, 9, 15),
      totalHours: 24, sessionsCount: 8,
      timeOfDay: 'בוקר', startTime: '09:00', endTime: '12:00',
      location: locMap['ת"א - מרכז'],
      academicYear: '2025-2026',
      numberOfStudents: 20,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['טכנולוגיה בחינוך'],
      type: typeMap['השתלמות'],
      status: 'פעיל',
      startDate: date(2026, 5, 18),
      endDate:   date(2026, 10, 19),
      totalHours: 36, sessionsCount: 9,
      timeOfDay: 'אחר הצהריים', startTime: '16:00', endTime: '20:00',
      location: locMap['חיפה - צפון'],
      academicYear: '2025-2026',
      numberOfStudents: 19,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['הוראה מתקדמת'],
      type: typeMap['קורס'],
      status: 'פעיל',
      startDate: date(2026, 6, 2),
      endDate:   date(2026, 11, 10),
      totalHours: 48, sessionsCount: 12,
      timeOfDay: 'בוקר', startTime: '08:00', endTime: '12:00',
      location: locMap['ירושלים'],
      academicYear: '2026-2027',
      numberOfStudents: 25,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['מסליחה לזריחה'],
      type: typeMap['קורס'],
      status: 'פעיל',
      startDate: date(2026, 6, 10),
      endDate:   date(2026, 9, 30),
      totalHours: 20, sessionsCount: 5,
      timeOfDay: 'ערב', startTime: '19:00', endTime: '23:00',
      location: locMap['זום'],
      academicYear: '2025-2026',
      numberOfStudents: 33,
      isRecognizedForCredit: false,
    },

    // ── בתכנון (עתיד) ────────────────────────────────────────────
    {
      name: nameMap['השקעות ושוק ההון'],
      type: typeMap['קורס'],
      status: 'בתכנון',
      startDate: date(2026, 9, 9),
      endDate:   date(2026, 11, 18),
      totalHours: 40, sessionsCount: 10,
      timeOfDay: 'אחר הצהריים', startTime: '17:00', endTime: '20:15',
      location: locMap['זום'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['הכשרת דירקטור בכיר'],
      type: typeMap['השתלמות'],
      status: 'בתכנון',
      startDate: date(2026, 10, 5),
      endDate:   date(2027, 1, 25),
      totalHours: 32, sessionsCount: 8,
      timeOfDay: 'ערב', startTime: '18:00', endTime: '21:00',
      location: locMap['ת"א - מרכז'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['זורחת מבפנים'],
      type: typeMap['קורס'],
      status: 'בתכנון',
      startDate: date(2026, 8, 20),
      endDate:   date(2026, 11, 5),
      totalHours: 30, sessionsCount: 10,
      timeOfDay: 'בוקר', startTime: '09:00', endTime: '12:00',
      location: locMap['ת"א - מרכז'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['מוכנות לכיתה א'],
      type: typeMap['יום עיון'],
      status: 'בתכנון',
      startDate: date(2026, 8, 25),
      endDate:   date(2026, 8, 25),
      totalHours: 8, sessionsCount: 1,
      timeOfDay: 'בוקר', startTime: '08:30', endTime: '16:30',
      location: locMap['ירושלים'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['בינה מלאכותית וחדשנות בעולם העבודה'],
      type: typeMap['השתלמות'],
      status: 'בתכנון',
      startDate: date(2026, 11, 3),
      endDate:   date(2027, 2, 23),
      totalHours: 40, sessionsCount: 10,
      timeOfDay: 'אחר הצהריים', startTime: '16:30', endTime: '20:30',
      location: locMap['חיפה - צפון'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: true,
    },
    {
      name: nameMap['הכשרת ועדים'],
      type: typeMap['קורס'],
      status: 'בתכנון',
      startDate: date(2026, 12, 1),
      endDate:   date(2027, 3, 16),
      totalHours: 24, sessionsCount: 6,
      timeOfDay: 'ערב', startTime: '18:00', endTime: '22:00',
      location: locMap['זום'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },

    // ── בוטל ─────────────────────────────────────────────────────
    {
      name: nameMap['גמר המונדיאל הגדול'],
      type: typeMap['יום עיון'],
      status: 'בוטל',
      startDate: date(2026, 3, 10),
      endDate:   date(2026, 3, 10),
      totalHours: 8, sessionsCount: 1,
      timeOfDay: 'ערב', startTime: '19:00', endTime: '23:00',
      location: locMap['ת"א - מרכז'],
      academicYear: '2025-2026',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['מנהיגות חינוכית'],
      type: typeMap['קורס'],
      status: 'בוטל',
      startDate: date(2026, 4, 1),
      endDate:   date(2026, 7, 1),
      totalHours: 36, sessionsCount: 9,
      timeOfDay: 'בוקר', startTime: '09:00', endTime: '13:00',
      location: locMap['באר שבע - דרום'],
      academicYear: '2025-2026',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
    {
      name: nameMap['פיתוח מקצועי'],
      type: typeMap['השתלמות'],
      status: 'בוטל',
      startDate: date(2026, 8, 5),
      endDate:   date(2026, 10, 28),
      totalHours: 30, sessionsCount: 10,
      timeOfDay: 'אחר הצהריים', startTime: '15:30', endTime: '18:30',
      location: locMap['חיפה - צפון'],
      academicYear: '2026-2027',
      numberOfStudents: 0,
      isRecognizedForCredit: false,
    },
  ];

  let added = 0;
  for (const c of courses) {
    if (!c.name || !c.type) { console.log('  ⚠ שם קורס או סוג לא נמצאו — מדלג'); continue; }
    await Course.create(c);
    console.log(`  ✓ ${(c as unknown as Record<string,unknown>).status} — טוען...`);
    added++;
  }

  console.log(`\nסיום: ${added} קורסים נוספו`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
