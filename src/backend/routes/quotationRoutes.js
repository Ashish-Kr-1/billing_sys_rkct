import express from 'express';
import {
    createQuotationHandler,
    getNextQuotationNumber,
    getAllQuotations,
    deleteQuotation,
    updateQuotationStatus,
    getQuotationDetailsHandler,
    updateQuotationHandler
} from '../controllers/quotationController.js';

import { validateQuotation } from '../middleware/validators.js';

const router = express.Router();

router.put('/status', updateQuotationStatus);
router.post('/', validateQuotation, createQuotationHandler);
router.get('/quotationNo', getNextQuotationNumber);
router.get('/', getAllQuotations);
router.get('/details', getQuotationDetailsHandler);
router.put('/:quotation_no', validateQuotation, updateQuotationHandler);
router.delete('/:id', deleteQuotation);

export default router;
