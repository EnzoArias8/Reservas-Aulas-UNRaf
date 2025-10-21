import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { getUsers, updateUser, deleteUser } from '../controllers/user.controller';

const router = Router();

router.use(protect, authorize('Admin'));

router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;


