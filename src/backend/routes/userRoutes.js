import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    getUserCompanyAccess,
    updateUserCompanyAccess,
    getUserSectionAccess,
    updateUserSectionAccess
} from '../controllers/userController.js';

const router = express.Router();

// Middleware to check if user is admin or accessing their own data
const requireAdminOrSelf = (req, res, next) => {
    const requestedId = parseInt(req.params.id);
    if (req.user.role === 'admin' || req.user.user_id === requestedId) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};

// Admin only routes
router.get('/', requireAdmin, getAllUsers);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser); // Only admin can update user details for now
router.delete('/:id', requireAdmin, deleteUser);
router.post('/:id/reset-password', requireAdmin, resetUserPassword);

// Access control routes
router.get('/:id/company-access', requireAdminOrSelf, getUserCompanyAccess);
router.put('/:id/company-access', requireAdmin, updateUserCompanyAccess); // Only admin can grant access

router.get('/:id/section-access', requireAdminOrSelf, getUserSectionAccess);
router.put('/:id/section-access', requireAdmin, updateUserSectionAccess); // Only admin can grant access

export default router;
