# Migration Guide: Updating Existing API Calls

## Quick Reference

### Before (Old Pattern)
```javascript
const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/endpoint`);
const data = await res.json();
```

### After (New Pattern)
```javascript
import api from './config/apiClient';

const data = await api.get('/endpoint');
```

## Common Patterns

### 1. GET Requests

**Before:**
```javascript
const res = await fetch(`${API_BASE}/parties/${id}`);
if (!res.ok) throw new Error('Failed');
const data = await res.json();
```

**After:**
```javascript
import api from './config/apiClient';

const data = await api.get(`/parties/${id}`);
// Error handling is automatic
```

### 2. POST Requests

**Before:**
```javascript
const res = await fetch(`${API_BASE}/createParty`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(partyData)
});
const data = await res.json();
```

**After:**
```javascript
import api from './config/apiClient';

const data = await api.post('/createParty', partyData);
// Headers are added automatically
```

### 3. PUT Requests

**Before:**
```javascript
const res = await fetch(`${API_BASE}/parties/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
```

**After:**
```javascript
const data = await api.put(`/parties/${id}`, updates);
```

### 4. DELETE Requests

**Before:**
```javascript
const res = await fetch(`${API_BASE}/parties/${id}`, {
  method: 'DELETE'
});
```

**After:**
```javascript
await api.delete(`/parties/${id}`);
```

## Files to Update

Search for these patterns in your codebase:

```bash
# Find all fetch calls
grep -r "fetch(" src/frontend/src/

# Find API_BASE usage
grep -r "API_BASE" src/frontend/src/

# Find VITE_API_BASE_URL usage
grep -r "VITE_API_BASE_URL" src/frontend/src/
```

## Example: Complete File Migration

### Before: `Create_Party.jsx`
```javascript
async function createParty(partyData) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/createParty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(partyData)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}
```

### After: `Create_Party.jsx`
```javascript
import api from './config/apiClient';

async function createParty(partyData) {
  try {
    const data = await api.post('/createParty', partyData);
    return data;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}
```

## Benefits of Migration

✅ **Automatic Company ID**: No need to manually add `x-company-id` header  
✅ **Automatic Auth**: JWT token added automatically  
✅ **Consistent Error Handling**: All errors handled the same way  
✅ **Less Boilerplate**: 10+ lines reduced to 1-2 lines  
✅ **Type Safety**: Easier to add TypeScript later  
✅ **Centralized Config**: Change base URL in one place

## Testing After Migration

1. **Test each migrated endpoint**:
   ```javascript
   // Add console.log to verify company ID is sent
   console.log('Selected Company:', localStorage.getItem('selectedCompany'));
   ```

2. **Check Network Tab**:
   - Verify `x-company-id` header is present
   - Verify `Authorization` header is present
   - Check request payload format

3. **Test Error Cases**:
   - Try with invalid company ID
   - Try without authentication
   - Try with invalid data

## Rollback Plan

If issues occur, you can temporarily use raw fetch:

```javascript
import { apiFetch } from './config/apiClient';

// Use the lower-level function with custom options
const data = await apiFetch('/endpoint', {
  method: 'POST',
  headers: { 'Custom-Header': 'value' },
  body: JSON.stringify(data)
});
```

## Need Help?

Check the main documentation: `docs/AUTH_AND_DB_SWITCHING.md`
