import express from 'express';
import {
    createQuotationHandler,
    getNextQuotationNumber,
    getAllQuotations,
    deleteQuotation
} from '../controllers/quotationController.js';

const router = express.Router();

router.post('/', createQuotationHandler);
router.get('/quotationNo', getNextQuotationNumber);
router.get('/', getAllQuotations);
router.delete('/:id', deleteQuotation);

export default router;
