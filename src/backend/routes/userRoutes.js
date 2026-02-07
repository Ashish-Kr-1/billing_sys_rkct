import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    getUserCompanyAccess,
    updateUserCompanyAccess
} from '../controllers/userController.js';

const router = express.Router();

// All routes require admin privileges
router.use(requireAdmin);

// GET /users - List all users
router.get('/', getAllUsers);

// POST /users - Create new user
router.post('/', createUser);

// PUT /users/:id - Update user
router.put('/:id', updateUser);

// DELETE /users/:id - Delete user
router.delete('/:id', deleteUser);

// POST /users/:id/reset-password - Reset user password
router.post('/:id/reset-password', resetUserPassword);

// GET /users/:id/company-access - Get user's company access
router.get('/:id/company-access', getUserCompanyAccess);

// PUT /users/:id/company-access - Update user's company access
router.put('/:id/company-access', updateUserCompanyAccess);

export default router;
