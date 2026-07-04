import { Router, Response } from 'express';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    res.status(400).json({ message: 'username, password, role required' });
    return;
  }
  const existing = await User.findOne({ username });
  if (existing) {
    res.status(409).json({ message: 'Username already exists' });
    return;
  }
  const user = await User.create({ username, password, role, forcePasswordChange: true });
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, action: `יצר משתמש ${username}` });
  res.status(201).json({ _id: user._id, username: user.username, role: user.role, active: user.active, forcePasswordChange: user.forcePasswordChange });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { role, active } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role, active }, { new: true }).select('-password');
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, action: `עדכן משתמש ${user.username}` });
  res.json(user);
});

router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  const { tempPassword } = req.body;
  if (!tempPassword) { res.status(400).json({ message: 'tempPassword required' }); return; }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  user.password = tempPassword;
  user.forcePasswordChange = true;
  await user.save();
  await logAudit({ userId: req.user!.userId, userName: req.user!.username, action: `אפס סיסמה למשתמש ${user.username}` });
  res.json({ message: 'Password reset' });
});

export default router;
