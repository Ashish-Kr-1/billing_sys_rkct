import express from 'express';
import {
    createQuotationHandler,
    getNextQuotationNumber,
    getAllQuotations,
    deleteQuotation,
    updateQuotationStatus,
    getQuotationDetailsHandler
} from '../controllers/quotationController.js';

import { validateQuotation } from '../middleware/validators.js';

const router = express.Router();

router.post('/', validateQuotation, createQuotationHandler);
router.get('/quotationNo', getNextQuotationNumber);
router.get('/', getAllQuotations);
router.get('/details', getQuotationDetailsHandler);
router.delete('/:id', deleteQuotation);
router.put('/status', updateQuotationStatus);

export default router;
