import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';

const router = Router();

router.use(protect, authorize('Admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;


