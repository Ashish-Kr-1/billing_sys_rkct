import express from 'express';

// Auth controllers
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    changePassword
} from '../controllers/authController.js';

// Company controllers
import {
    getAllCompanies,
    getCompanyById,
    testCompanyConnection,
    getCompanyStats,
    getCompanyConfig
} from '../controllers/companyController.js';

// Analytics controllers
import {
    getCompanyAnalytics,
    getCompanySummary,
    getAllCompaniesAnalytics
} from '../controllers/analyticsController.js';


// Auth middleware
import { authenticateUser } from '../middleware/auth.js';

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================
const authRouter = express.Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', authenticateUser, getCurrentUser);
authRouter.post('/change-password', authenticateUser, changePassword);

// ============================================================
// COMPANY ROUTES
// ============================================================
const companyRouter = express.Router();

companyRouter.get('/', getAllCompanies);
companyRouter.get('/:companyId', getCompanyById);
companyRouter.get('/:companyId/test', testCompanyConnection);
companyRouter.get('/:companyId/stats', getCompanyStats);
companyRouter.get('/:companyId/config', getCompanyConfig);

// ============================================================
// ANALYTICS ROUTES
// ============================================================
const analyticsRouter = express.Router();

analyticsRouter.get('/comparison', getAllCompaniesAnalytics);
analyticsRouter.get('/:companyId/data', getCompanyAnalytics);
analyticsRouter.get('/:companyId/summary', getCompanySummary);

export { authRouter, companyRouter, analyticsRouter };
