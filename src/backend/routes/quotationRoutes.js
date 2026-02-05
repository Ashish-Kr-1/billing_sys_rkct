
import express from 'express';
import {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    deleteQuotation
} from '../controllers/quotationController.js';

const router = express.Router();

router.post('/', createQuotation);
router.get('/', getAllQuotations);
router.get('/:id', getQuotationById);
router.delete('/:id', deleteQuotation);

export default router;
