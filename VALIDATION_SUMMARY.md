# Validation Middleware Implementation

## Overview
We have implemented a robust validation middleware layer using `express-validator` to intercept form submissions before they reach the database logic. This ensures that data type mismatches (e.g., text in number fields, invalid Enums, length violations) are caught early and returned as structured warnings to the frontend.

## Components Created
- `src/backend/middleware/validators.js`: Contains reusable validation chains for:
    - **Parties**: Validates name, GSTIN format, mobile number digits, state code, etc.
    - **Items**: Validates rate (positive number), HSN code length.
    - **Quotations**: Validates structure, nested items, quantities, and prices.

## Routes Updated
1. **Quotation Creation** (`src/backend/routes/quotationRoutes.js`)
   - Added `validateQuotation` middleware to `POST /`.
2. **Party Creation** (`src/backend/app/app.js`)
   - Added `validateParty` middleware to `POST /createParty`.
3. **Item Creation** (`src/backend/app/app.js`)
   - Added `validateItem` middleware to `POST /createItem`.

## Frontend Integration
The existing frontend error handling mechanism (`handleApiResponse` -> `notify` toast) automatically displays these validation errors to the user as "Warnings/Errors", satisfying the requirement to "give warning" on mismatch.

## Validation Rules Examples
- **Mobile No**: Must be numeric (10-15 digits).
- **GSTIN**: Must be exactly 15 alphanumeric characters.
- **Amounts**: Must be positive numbers.
- **Enums**: Party Type must be 'customer', 'vendor', 'supplier', or 'both'.
