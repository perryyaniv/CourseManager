import { Router, Response } from 'express';
import Course, { ICourse } from '../models/Course';
import ChecklistState from '../models/ChecklistState';
import ChecklistItem from '../models/ChecklistItem';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { Server } from 'socket.io';

const router = Router();
router.use(authenticate);

const POPULATE = [
  { path: 'name', select: 'name' },
  { path: 'type', select: 'name' },
  { path: 'lecturers', select: 'firstName lastName phone email' },
  { path: 'location', select: 'name' },
];

router.get('/', async (req: AuthRequest, res: Response) => {
  const { academicYear, status, lecturer, startDateFrom, startDateTo, search, page = '1', limit = '25', sortBy = 'startDate', sortDir = 'desc', activeOnly } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};
  if (academicYear) query.academicYear = academicYear;
  if (status) query.status = status;
  else if (activeOnly === 'true') query.status = { $in: ['פעיל', 'בתכנון'] };
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

  const STATUS_PRIORITY: Record<string, number> = { 'פעיל': 1, 'בתכנון': 2, 'הושלם': 3, 'בוטל': 4 };

  let courses;
  if (sortBy === 'checklistPriority') {
    // Sort: incomplete checklist first → active → planning → rest; all by JS after computing flags
    const allItems = await ChecklistItem.find({ active: true }).select('_id applicableStatuses').lean();
    const allIds = await Course.find(query).select('_id status').lean();
    const checkedStates = await ChecklistState.find({
      courseId: { $in: allIds.map((c) => c._id) }, checked: true,
    }).select('courseId itemId').lean();

    const checkedByCourse = new Map<string, Set<string>>();
    for (const s of checkedStates) {
      const cid = s.courseId.toString();
      if (!checkedByCourse.has(cid)) checkedByCourse.set(cid, new Set());
      checkedByCourse.get(cid)!.add(s.itemId.toString());
    }

    const ALL_STATUSES_FB = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];
    const incompleteSet = new Set(
      allIds.filter((c) => {
        const applicable = allItems.filter((i) =>
          ((i.applicableStatuses as string[] | undefined) ?? ALL_STATUSES_FB).includes(c.status as string)
        );
        if (applicable.length === 0) return false;
        const checked = checkedByCourse.get(c._id.toString()) ?? new Set<string>();
        return applicable.some((i) => !checked.has(i._id.toString()));
      }).map((c) => c._id.toString())
    );

    const statusOrd: Record<string, number> = { 'פעיל': 2, 'בתכנון': 3, 'הושלם': 4, 'בוטל': 5 };
    const sorted = [...allIds].sort((a, b) => {
      const aInc = incompleteSet.has(a._id.toString()) ? 1 : statusOrd[a.status as string] ?? 6;
      const bInc = incompleteSet.has(b._id.toString()) ? 1 : statusOrd[b.status as string] ?? 6;
      return aInc - bInc;
    });

    const total_ = sorted.length;
    const pageIds = sorted.slice((pageNum - 1) * limitNum, pageNum * limitNum).map((c) => c._id);
    const raw = await Course.find({ _id: { $in: pageIds } }).populate(POPULATE).lean();
    const orderMap = new Map(pageIds.map((id, i) => [id.toString(), i]));
    courses = raw.sort((a, b) => (orderMap.get(a._id.toString()) ?? 0) - (orderMap.get(b._id.toString()) ?? 0));

    // Override total for this branch
    const checklistResult = { courses, total: total_, pageNum, limitNum };
    // Compute checklist flags inline (reuse existing logic below)
    const courseIds2 = courses.map((c) => c._id);
    const checkedStates2 = await ChecklistState.find({ courseId: { $in: courseIds2 }, checked: true }).select('courseId itemId').lean();
    const checkedMap2 = new Map<string, Set<string>>();
    for (const s of checkedStates2) {
      const cid = s.courseId.toString();
      if (!checkedMap2.has(cid)) checkedMap2.set(cid, new Set());
      checkedMap2.get(cid)!.add(s.itemId.toString());
    }
    const result2 = courses.map((c) => {
      const applicable = allItems.filter((i) =>
        ((i.applicableStatuses as string[] | undefined) ?? ALL_STATUSES_FB).includes(c.status as string)
      );
      const applicableIds = new Set(applicable.map((i) => i._id.toString()));
      const checkedSet = checkedMap2.get(c._id.toString()) ?? new Set<string>();
      const done = [...applicableIds].filter((id) => checkedSet.has(id)).length;
      return { ...c, checklistDone: done, checklistTotal: applicableIds.size, checklistIncomplete: applicableIds.size > 0 && done < applicableIds.size };
    });
    return res.json({ data: result2, total: total_, page: pageNum, totalPages: Math.ceil(total_ / limitNum) });
  } else if (sortBy === 'statusPriority') {
    // Use aggregation for custom status ordering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: query },
      { $addFields: { _statusOrder: { $switch: {
        branches: Object.entries(STATUS_PRIORITY).map(([s, v]) => ({ case: { $eq: ['$status', s] }, then: v })),
        default: 5,
      }}}},
      { $sort: { _statusOrder: 1, startDate: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];
    const raw = await Course.aggregate(pipeline);
    courses = await Course.populate(raw, POPULATE);
  } else {
    const sortField = sortBy === 'courseName' ? 'name' : sortBy;
    courses = await courseQuery
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
  }

  // Attach checklist progress per course, counting only items applicable to each course's status
  const ALL_STATUSES = ['בתכנון', 'פעיל', 'הושלם', 'בוטל'];
  const allActiveItems = await ChecklistItem.find({ active: true }).select('_id applicableStatuses').lean();
  const courseIds = courses.map((c) => c._id);

  // Load all checked states for these courses (only checked=true)
  const allCheckedStates = await ChecklistState.find({
    courseId: { $in: courseIds },
    checked: true,
  }).select('courseId itemId').lean();

  // Build a map: courseId → Set of checked itemIds
  const checkedByCoursMap = new Map<string, Set<string>>();
  for (const s of allCheckedStates) {
    const cid = s.courseId.toString();
    if (!checkedByCoursMap.has(cid)) checkedByCoursMap.set(cid, new Set());
    checkedByCoursMap.get(cid)!.add(s.itemId.toString());
  }

  const result = courses.map((c) => {
    const applicable = allActiveItems.filter((i) =>
      ((i.applicableStatuses as string[] | undefined) ?? ALL_STATUSES).includes(c.status as string)
    );
    const applicableIds = new Set(applicable.map((i) => i._id.toString()));
    const checkedSet = checkedByCoursMap.get(c._id.toString()) ?? new Set<string>();
    const checklistDone = [...applicableIds].filter((id) => checkedSet.has(id)).length;
    const checklistTotal = applicableIds.size;
    return {
      ...c,
      checklistDone,
      checklistTotal,
      checklistIncomplete: checklistTotal > 0 && checklistDone < checklistTotal,
    };
  });

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

  // Block status change if checklist for current status is incomplete
  // (cancellation to בוטל is always allowed)
  const newStatus = (req.body as Record<string, unknown>).status as string | undefined;
  if (newStatus && newStatus !== existing.status && newStatus !== 'בוטל') {
    const applicableItems = await ChecklistItem.find({
      active: true,
      applicableStatuses: existing.status,
    }).select('_id').lean();

    if (applicableItems.length > 0) {
      const checkedCount = await ChecklistState.countDocuments({
        courseId: req.params.id,
        itemId: { $in: applicableItems.map((i) => i._id) },
        checked: true,
      });
      if (checkedCount < applicableItems.length) {
        res.status(400).json({
          message: `לא ניתן לשנות סטטוס — יש לסיים את הצ'קליסט עבור "${existing.status}" תחילה (${checkedCount}/${applicableItems.length} הושלמו)`,
        });
        return;
      }
    }
  }

  const io: Server = req.app.get('io');
  const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(POPULATE).lean();

  // Audit changed fields
  const tracked = ['status', 'totalHours', 'sessionsCount', 'startDate', 'endDate', 'numberOfStudents', 'academicYear', 'isRecognizedForCredit'];
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

router.delete('/:id/notes/:noteId', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404).json({ message: 'Not found' }); return; }

  const note = course.notes.find((n) => n._id.toString() === req.params.noteId);
  if (!note) { res.status(404).json({ message: 'Note not found' }); return; }

  if (req.user!.role !== 'admin' && note.author.toString() !== req.user!.userId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const updated = await Course.findByIdAndUpdate(
    req.params.id,
    { $pull: { notes: { _id: req.params.noteId } } },
    { new: true }
  ).populate(POPULATE).lean();

  res.json(updated);
});

export default router;
