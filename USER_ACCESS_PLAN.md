# User Access Control Implementation Plan

## Completed:
✅ 1. Created `user_company_access` table
✅ 2. Added backend endpoints for company access management
✅ 3. Added UI for managing company access (checkboxes in UserManagement)
✅ 4. Filter companies in CompanySelection based on user access

## Remaining Tasks:

### Task 1: Move User Management Button to Company Selection
**File**: `/src/frontend/src/pages/CompanySelection.jsx`
- Add User Management button in header (admin only)
- Remove User Management from SectionSelection.jsx

### Task 2: Section Access Control
**Backend**:
1. Create migration: `add_user_section_access.js`
   - Table: `user_section_access` (user_id, section_name, created_by, created_at)
   - Sections: 'invoice', 'analytics', 'ledger', 'quotation'

2. Add to `userController.js`:
   - `getUserSectionAccess(req, res)`
   - `updateUserSectionAccess(req, res)`

3. Add routes to `userRoutes.js`:
   - `GET /users/:id/section-access`
   - `PUT /users/:id/section-access`

**Frontend**:
1. Update `UserManagement.jsx`:
   - Add section access modal with checkboxes
   - Add section access button (similar to company access)

2. Update `SectionSelection.jsx`:
   - Fetch user's section access
   - Filter sections based on access
   - Remove User Management card

## Database Schema:

```sql
CREATE TABLE user_section_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    UNIQUE KEY unique_user_section (user_id, section_name),
    INDEX idx_user_id (user_id)
);
```

## Available Sections:
- invoice
- analytics  
- ledger
- quotation
