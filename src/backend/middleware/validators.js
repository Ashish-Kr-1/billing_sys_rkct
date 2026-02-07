import { body, validationResult } from 'express-validator';

// Middleware to handle validation result
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        // Combine specific messages or return just the first one generally, 
        // but for "warnings", providing a list is better.
        // Frontend likely just shows one error string from `error` field.
        // We'll join them.
        return res.status(400).json({
            error: "Validation Failed: " + errorMessages.join(", "),
            details: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for Quotation Creation
 * Matches DB types and constraints
 */
export const validateQuotation = [
    // Header Fields
    body('quotation.QuotationNo')
        .notEmpty().withMessage('Quotation Number is required')
        .isString().withMessage('Quotation Number must be text')
        .isLength({ max: 50 }).withMessage('Quotation Number too long (max 50 chars)'),

    body('quotation.QuotationDate')
        .custom((value) => {
            if (!value) return true; // Optional, defaults to NOW()
            if (isNaN(Date.parse(value))) throw new Error('Invalid Quotation Date');
            return true;
        }),

    body('quotation.party_id')
        .notEmpty().withMessage('Party selection is required')
        .isInt().withMessage('Party ID must be an integer'),

    body('quotation.subtotal')
        .isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),

    // Items Validation
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required'),

    body('items.*.description')
        .notEmpty().withMessage('Item description/name is required')
        .isString(),

    body('items.*.quantity')
        .isFloat({ min: 0.01 }).withMessage('All items must have a quantity > 0'),

    body('items.*.price')
        .isFloat({ min: 0 }).withMessage('All items must have a valid price'),

    body('items.*.HSNCode')
        .optional()
        .isString().withMessage('HSN Code must be text')
        .isLength({ max: 20 }).withMessage('HSN Code too long (max 20 chars)'),

    // Execute the check
    handleValidationErrors
];

/**
 * Validation rules for Party Creation
 */
export const validateParty = [
    body('party_name')
        .trim()
        .notEmpty().withMessage('Party Name is required')
        .isLength({ max: 255 }).withMessage('Party Name too long (max 255 chars)'),

    body('type')
        .isIn(['customer', 'supplier', 'vendor', 'both']).withMessage('Type must be customer, vendor, supplier or both'),

    body('supply_state_code')
        .notEmpty().withMessage('State Code is required')
        .isLength({ max: 10 }).withMessage('State Code too long'),

    body('gstin_no')
        .optional({ checkFalsy: true })
        .matches(/^[0-9A-Z]{15}$/).withMessage('GSTIN must be exactly 15 alphanumeric characters')
        .toUpperCase(),

    body('mobile_no')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Mobile Number must contain only digits')
        .isLength({ min: 10, max: 15 }).withMessage('Mobile Number must be 10-15 digits'),

    body('pin_code')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Pin Code must be numeric')
        .isLength({ min: 6, max: 6 }).withMessage('Pin Code must be 6 digits'),

    body('email')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Invalid Email Address'),

    body('vendore_code')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 }).withMessage('Vendor Code too long (max 50 chars)'),

    body('contact_person')
        .optional({ checkFalsy: true })
        .isLength({ max: 150 }).withMessage('Contact Person too long (max 150 chars)'),

    handleValidationErrors
];

/**
 * Validation rules for Item Creation
 */
export const validateItem = [
    body('item_name')
        .trim().notEmpty().withMessage('Item Name is required'),

    body('rate')
        .isFloat({ min: 0 }).withMessage('Rate must be a positive number'),

    body('hsn_code')
        .optional()
        .isLength({ max: 20 }).withMessage('HSN Code too long'),

    handleValidationErrors
];
