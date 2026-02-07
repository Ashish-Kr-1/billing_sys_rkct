# Remaining Implementation Tasks

## What's Done:
✅ Backend section access endpoints created
✅ Section access UI added to UserManagement
✅ Company filtering implemented in CompanySelection
✅ Section access migration completed

## What Needs Manual Completion:

### 1. Fix SectionSelection.jsx
Add at the top after imports:
```javascript
import { useState } from 'react';
import { api, handleApiResponse } from '../config/apiClient';
```

Add state in component:
```javascript
const [accessibleSections, setAccessibleSections] = useState([]);
const [loading, setLoading] = useState(true);
```

Add fetch function after useEffect:
```javascript
const fetchUserSectionAccess = async () => {
    try {
        if (user?.role === 'admin') {
            setAccessibleSections(['invoice', 'analytics', 'ledger', 'quotation']);
        } else {
            const data = await handleApiResponse(api.get(`/users/${user.user_id}/section-access`));
            setAccessibleSections(data.sections || []);
        }
    } catch (error) {
        console.error('Error fetching section access:', error);
        setAccessibleSections([]);
    } finally {
        setLoading(false);
    }
};
```

Update useEffect to call it:
```javascript
useEffect(() => {
    if (!selectedCompany) {
        navigate('/select-company');
    } else {
        fetchUserSectionAccess();
    }
}, [selectedCompany, navigate]);
```

Wrap each section card with:
```javascript
{accessibleSections.includes('analytics') && (
    // ... analytics button
)}
```

Remove the entire User Management section (lines 249-287)

### 2. Add User Management Button to CompanySelection.jsx
Replace the logout button section (lines 94-100) with:
```javascript
<div className="flex items-center gap-3">
    {user?.role === 'admin' && (
        <button
            onClick={handleUserManagement}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
            <Users className="w-5 h-5" />
            <span>User Management</span>
        </button>
    )}
    <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
    >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
    </button>
</div>
```

## Testing Checklist:
- [ ] Admin sees all companies
- [ ] Regular user sees only assigned companies
- [ ] Admin sees all sections
- [ ] Regular user sees only assigned sections
- [ ] Company access checkboxes work
- [ ] Section access checkboxes work
- [ ] User Management button appears in Company Selection for admins
- [ ] User Management removed from Section Selection
