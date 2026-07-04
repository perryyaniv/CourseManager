import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import CourseName from '../models/CourseName';
import CourseType from '../models/CourseType';
import Lecturer from '../models/Lecturer';
import Location from '../models/Location';
import Region from '../models/Region';
import Course from '../models/Course';

const router = Router();
router.use(authenticate);

type AnyModel = mongoose.Model<mongoose.Document>;

const listMap: Record<string, { model: AnyModel; refField?: string }> = {
  'course-names': { model: CourseName as unknown as AnyModel, refField: 'name' },
  'course-types': { model: CourseType as unknown as AnyModel, refField: 'type' },
  'lecturers': { model: Lecturer as unknown as AnyModel, refField: 'lecturers' },
  'locations': { model: Location as unknown as AnyModel, refField: 'location' },
  'regions': { model: Region as unknown as AnyModel, refField: 'region' },
};

router.get('/:listType', async (req: AuthRequest, res: Response) => {
  const list = listMap[req.params.listType];
  if (!list) { res.status(404).json({ message: 'Unknown list type' }); return; }
  const items = await list.model.find().sort({ name: 1, firstName: 1 });
  res.json(items);
});

router.post('/:listType', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const list = listMap[req.params.listType];
  if (!list) { res.status(404).json({ message: 'Unknown list type' }); return; }
  const item = await list.model.create(req.body);
  res.status(201).json(item);
});

router.put('/:listType/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const list = listMap[req.params.listType];
  if (!list) { res.status(404).json({ message: 'Unknown list type' }); return; }
  const item = await list.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(item);
});

router.delete('/:listType/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const list = listMap[req.params.listType];
  if (!list) { res.status(404).json({ message: 'Unknown list type' }); return; }

  const field = list.refField;
  if (field) {
    const query = field === 'lecturers' ? { lecturers: req.params.id } : { [field]: req.params.id };
    const inUse = await Course.exists(query);
    if (inUse) { res.status(409).json({ message: 'בשימוש - לא ניתן למחוק' }); return; }
  }

  await list.model.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
