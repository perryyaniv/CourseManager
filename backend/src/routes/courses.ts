import { Router, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Course, { ICourse } from '../models/Course';
import ChecklistState from '../models/ChecklistState';
import Location from '../models/Location';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { Server } from 'socket.io';

const router = Router();
router.use(authenticate);

// Import course details from a peoples.org.il product URL
router.post('/import-url', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const { url } = req.body as { url: string };
  if (!url) { res.status(400).json({ message: 'URL required' }); return; }

  let html: string;
  try {
    const resp = await axios.get<string>(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    html = resp.data;
  } catch {
    res.status(422).json({ message: 'לא ניתן לגשת לכתובת URL' });
    return;
  }

  const $ = cheerio.load(html);
  // Collapse whitespace for easier regex matching
  const body = $('body').text().replace(/\s+/g, ' ').trim();

  // --- Title ---
  const rawTitle = $('h1').first().text().trim();
  // Strip location/date suffixes that peoples.org.il appends to titles
  const suggestedName = rawTitle
    .replace(/\s+(?:זום|מקוון|ת"א|תל אביב|ירושלים|חיפה|באר שבע|תאריך|פתיחה|\d{1,2}\.\d{1,2}).*$/u, '')
    .trim();

  // --- Sessions count: "10 מפגשים" ---
  const sessionsMatch = body.match(/(\d+)\s*מפגשים/);
  const sessionsCount = sessionsMatch ? parseInt(sessionsMatch[1]) : undefined;

  // --- Total hours: "40 שעות" or standalone "40" near שעות ---
  const hoursMatch = body.match(/(\d+)\s*שעות/);
  const totalHours = hoursMatch ? parseInt(hoursMatch[1]) : undefined;

  // --- Time of day ---
  let timeOfDay: string | undefined;
  if (body.includes('אחר הצהריים')) timeOfDay = 'אחר הצהריים';
  else if (body.includes('בוקר')) timeOfDay = 'בוקר';
  else if (body.includes('ערב')) timeOfDay = 'ערב';

  // --- Dates: DD/MM/YY or DD/MM/YYYY ---
  const dateRe = /(\d{2})\/(\d{2})\/(\d{2,4})/g;
  const isoDate = (m: RegExpMatchArray) => {
    const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yr}-${m[2]}-${m[1]}`;
  };
  const allDates = [...body.matchAll(dateRe)]
    .map(isoDate)
    .filter(d => !isNaN(new Date(d).getTime()));
  const startDate = allDates[0];
  const endDate = allDates.length > 1 ? allDates[allDates.length - 1] : undefined;

  // --- Times: "17:00 - 20:15" or "20:15-17:00" (RTL display) ---
  const timeRe = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/;
  const timeMatch = body.match(timeRe);
  let startTime: string | undefined;
  let endTime: string | undefined;
  if (timeMatch) {
    const [a, b] = [timeMatch[1], timeMatch[2]];
    [startTime, endTime] = a < b ? [a, b] : [b, a];
  }

  // --- Location: try to match a DB location by keyword ---
  let locationId: string | undefined;
  const locationKeywords = ['זום', 'מקוון', 'ת"א', 'תל אביב', 'ירושלים', 'חיפה', 'באר שבע'];
  const locations = await Location.find({ active: true });
  for (const kw of locationKeywords) {
    if (body.includes(kw)) {
      const match = locations.find(l => l.name.includes(kw) || kw.includes(l.name));
      if (match) { locationId = match._id.toString(); break; }
    }
  }

  res.json({ suggestedName, sessionsCount, totalHours, timeOfDay, startDate, endDate, startTime, endTime, locationId });
});

const POPULATE = [
  { path: 'name', select: 'name' },
  { path: 'type', select: 'name' },
  { path: 'lecturers', select: 'firstName lastName phone email' },
  { path: 'location', select: 'name' },
];

router.get('/', async (req: AuthRequest, res: Response) => {
  const { academicYear, status, lecturer, startDateFrom, startDateTo, search, page = '1', limit = '25', sortBy = 'startDate', sortDir = 'desc' } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};
  if (academicYear) query.academicYear = academicYear;
  if (status) query.status = status;
  if (lecturer) query.lecturers = lecturer;
  if (startDateFrom || startDateTo) {
    const dateRange: Record<string, Date> = {};
    if (startDateFrom) dateRange.$gte = new Date(startDateFrom);
    if (startDateTo) dateRange.$lte = new Date(startDateTo);
    query.startDate = dateRange;
  }

  let courseQuery = Course.find(query).populate(POPULATE);

  if (search) {
    const nameMatches = await import('../models/CourseName').then((m) =>
      m.default.find({ name: { $regex: search, $options: 'i' } }).select('_id')
    );
    const nameIds = nameMatches.map((n) => n._id);
    query.$or = [
      { name: { $in: nameIds } },
      { catalogueId: { $regex: search, $options: 'i' } },
      { academicYear: { $regex: search, $options: 'i' } },
    ];
    courseQuery = Course.find(query).populate(POPULATE);
  }

  const total = await Course.countDocuments(query);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const sortOrder = sortDir === 'asc' ? 1 : -1;
  const sortField = sortBy === 'courseName' ? 'name' : sortBy;

  const courses = await courseQuery
    .sort({ [sortField]: sortOrder })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  // Attach checklistIncomplete flag
  const courseIds = courses.map((c) => c._id);
  const states = await ChecklistState.find({ courseId: { $in: courseIds }, checked: false }).select('courseId').lean();
  const incompleteIds = new Set(states.map((s) => s.courseId.toString()));
  const result = courses.map((c) => ({ ...c, checklistIncomplete: incompleteIds.has(c._id.toString()) }));

  res.json({ data: result, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id).populate(POPULATE).lean();
  if (!course) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(course);
});

router.post('/', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const course = await Course.create(req.body);
  const populated = await Course.findById(course._id).populate(POPULATE).lean();
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, courseId: course._id.toString(), action: 'יצר קורס' });
  res.status(201).json(populated);
});

router.put('/:id', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const existing = await Course.findById(req.params.id).lean();
  if (!existing) { res.status(404).json({ message: 'Not found' }); return; }

  const io: Server = req.app.get('io');
  const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(POPULATE).lean();

  // Audit changed fields
  const tracked = ['status', 'totalHours', 'sessionsCount', 'startDate', 'endDate', 'numberOfStudents', 'academicYear', 'isRecognizedForCredit', 'fundingSource'];
  for (const field of tracked) {
    const oldVal = (existing as Record<string, unknown>)[field];
    const newVal = (req.body as Record<string, unknown>)[field];
    if (newVal !== undefined && String(oldVal) !== String(newVal)) {
      await logAudit({ userId: req.user!.userId, userName: req.user!.username, courseId: req.params.id, action: 'עדכן שדה', fieldChanged: field, oldValue: oldVal, newValue: newVal });
    }
  }

  io.to(`course:${req.params.id}`).emit('course-updated', updated);
  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404).json({ message: 'Not found' }); return; }
  if (course.status !== 'בתכנון') { res.status(400).json({ message: 'ניתן למחוק קורס רק בסטטוס "בתכנון"' }); return; }
  await course.deleteOne();
  await ChecklistState.deleteMany({ courseId: req.params.id });
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, action: 'מחק קורס' });
  res.json({ message: 'Deleted' });
});

router.post('/:id/clone', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const source = await Course.findById(req.params.id).lean();
  if (!source) { res.status(404).json({ message: 'Not found' }); return; }
  const { _id, notes: _notes, createdAt: _ca, updatedAt: _ua, ...rest } = source as Record<string, unknown>;
  const clone = await Course.create({ ...rest, status: 'בתכנון', notes: [] });
  const populated = await Course.findById(clone._id).populate(POPULATE).lean();
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, courseId: clone._id.toString(), action: `שוכפל מקורס ${String(_id)}` });
  res.status(201).json(populated);
});

router.post('/:id/notes', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const { type, content } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: { type, content, author: req.user!.userId, authorName: req.user!.username } } },
    { new: true }
  ).populate(POPULATE).lean();
  if (!course) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(course);
});

export default router;
