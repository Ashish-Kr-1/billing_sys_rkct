import express from 'express';
import {
    createQuotationHandler,
    getNextQuotationNumber,
    getAllQuotations,
    deleteQuotation,
    updateQuotationStatus
} from '../controllers/quotationController.js';

const router = express.Router();

router.post('/', createQuotationHandler);
router.get('/quotationNo', getNextQuotationNumber);
router.get('/', getAllQuotations);
router.delete('/:id', deleteQuotation);
router.put('/status', updateQuotationStatus);

export default router;
