import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import ChecklistItem from '../models/ChecklistItem';
import ChecklistState from '../models/ChecklistState';
import Course from '../models/Course';

const router = Router();
router.use(authenticate);

// Admin: manage global checklist items
router.get('/items', async (_req, res: Response) => {
  const items = await ChecklistItem.find().sort({ order: 1, createdAt: 1 });
  res.json(items);
});

router.post('/items', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const item = await ChecklistItem.create(req.body);
  res.status(201).json(item);
});

router.post('/items/reorder', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { items } = req.body as { items: { id: string; order: number }[] };
  if (!Array.isArray(items)) { res.status(400).json({ message: 'items array required' }); return; }
  await Promise.all(items.map(({ id, order }) => ChecklistItem.findByIdAndUpdate(id, { order })));
  res.json({ message: 'Reordered' });
});

router.put('/items/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const item = await ChecklistItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(item);
});

router.delete('/items/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await ChecklistItem.findByIdAndDelete(req.params.id);
  await ChecklistState.deleteMany({ itemId: req.params.id });
  res.json({ message: 'Deleted' });
});

// Per-course checklist state — filtered by course status
router.get('/course/:courseId', async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.courseId).select('status').lean();
  if (!course) { res.status(404).json({ message: 'Course not found' }); return; }

  const items = await ChecklistItem.find({
    active: true,
    applicableStatuses: course.status,
  }).sort({ order: 1, createdAt: 1 });

  const states = await ChecklistState.find({ courseId: req.params.courseId });
  const stateMap = new Map(states.map((s) => [s.itemId.toString(), s]));

  const result = items.map((item) => {
    const state = stateMap.get(item._id.toString());
    return {
      _id: item._id,
      label: item.label,
      order: item.order,
      applicableStatuses: item.applicableStatuses,
      checked: state?.checked ?? false,
      checkedByName: state?.checkedByName,
      checkedAt: state?.checkedAt,
    };
  });
  res.json(result);
});

router.patch('/course/:courseId/:itemId', requireRole('admin', 'coordinator'), async (req: AuthRequest, res: Response) => {
  const { checked } = req.body;
  const update: Record<string, unknown> = { checked };
  if (checked) {
    update.checkedBy = req.user!.userId;
    update.checkedByName = req.user!.username;
    update.checkedAt = new Date();
  } else {
    update.checkedBy = undefined;
    update.checkedByName = undefined;
    update.checkedAt = undefined;
  }

  await ChecklistState.findOneAndUpdate(
    { courseId: req.params.courseId, itemId: req.params.itemId },
    { $set: update },
    { upsert: true, new: true }
  );
  res.json({ message: 'Updated' });
});

export default router;
