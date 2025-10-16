# Frontend Changes: User Permissions Error Handling

## Summary
This document describes the changes made to the frontend to improve user permissions handling and provide better error messages when the backend has issues.

## Problem Analysis

### Original Error
```
SQLSTATE[42703]: Undefined column: 7 ERROR: no existe la columna «moduleview_id»
LINE 1: select "id", "moduleview_id" from "permissions" where "modul...
```

### Root Cause
The Laravel backend (`UserPermisosController.php` line ~88) is trying to access a column named `moduleview_id` (without underscore) in the `permissions` table, but the actual column is named `module_view_id` (with underscore).

### Database Structure
```
users (id) 
  ↓
userpermissions (user_id, permission_id) [pivot table]
  ↓
permissions (id, module_view_id) 
  ↓
moduleviews (id, module_id, menu, submenu, view_path)
  ↓
modules (id, name, description)
```

## Changes Made

### 1. File: `components/permisos/permisos-vistas-tab.tsx`

#### Added Documentation Header (Lines 3-19)
- Explains the component's purpose
- Documents the known backend issue
- Describes the database structure
- Warns about the error that will occur until backend is fixed

#### Improved `fetchUserPermissions` Function (Lines 161-213)
**Before:**
```typescript
const moduleViewIds = rows
  .map((row) => {
    return (
      row?.permission?.module_view?.id ??
      row?.permission?.moduleView?.id ??
      row?.permission?.module_view_id ??
      null
    );
  })
  .filter((id: any) => typeof id === "number");
```

**After:**
```typescript
const moduleViewIds = rows
  .map((row) => {
    // Try different possible structures
    const permissionData = row?.permission;
    if (!permissionData) return null;
    
    // Try nested object first (permission.module_view.id)
    if (permissionData.module_view?.id) {
      return permissionData.module_view.id;
    }
    // Try camelCase variant
    if (permissionData.moduleView?.id) {
      return permissionData.moduleView.id;
    }
    // Try direct property
    if (permissionData.module_view_id) {
      return permissionData.module_view_id;
    }
    // Try camelCase direct property
    if (permissionData.moduleViewId) {
      return permissionData.moduleViewId;
    }
    
    return null;
  })
  .filter((id: any) => typeof id === "number" && id > 0);
```

**Improvements:**
- More structured approach with explicit checks
- Better comments explaining each fallback
- Additional validation (id > 0)
- Clearer logic flow

#### Enhanced `handleSavePermisos` Function (Lines 237-292)
**Before:**
```typescript
const payload = {
  user_id: Number(selectedUsuario),
  permissions: selectedPermisos,
};
// Generic error handling
```

**After:**
```typescript
const payload = {
  user_id: Number(selectedUsuario),
  module_view_ids: selectedPermisos, // More descriptive key name
};

// Specific error handling for the backend column issue
if (backendError.includes("moduleview_id") || backendError.includes("Undefined column")) {
  Swal.fire({
    title: "Error en el servidor",
    html: `
      <p>Error en la base de datos del backend.</p>
      <p class="text-sm mt-2">El backend está intentando acceder a una columna 'moduleview_id' que no existe...</p>
      <p class="text-sm mt-2">La columna correcta debería ser 'module_view_id'...</p>
      <p class="text-sm mt-2"><strong>Este es un error del backend que debe ser corregido en:</strong></p>
      <p class="text-xs mt-1">app/Http/Controllers/Api/UserPermisosController.php (línea 88 aproximadamente)</p>
    `,
    icon: "error",
  });
}
```

**Improvements:**
- Changed payload key from `permissions` to `module_view_ids` for clarity
- Added comprehensive documentation comments
- Specific error detection for the moduleview_id issue
- Detailed error message explaining the problem
- Guidance on where to fix the issue in the backend

### 2. New File: `BACKEND_PERMISSIONS_FIX.md`

Created comprehensive documentation explaining:
- The backend bug in detail
- Exact location and code that needs to be fixed
- Database structure and relationships
- Testing procedures after fix
- SQL migration scripts if needed
- Additional recommendations for improvement

## How It Works Now

### Loading Permissions
1. User selects a user from the dropdown
2. Frontend calls `GET /api/userpermissions?user_id={id}`
3. Function tries multiple possible response structures to extract module_view_id
4. Successfully handles both snake_case and camelCase variants
5. Filters out invalid IDs (null, undefined, or <= 0)
6. Displays selected permissions in the UI

### Saving Permissions
1. User checks/unchecks module views
2. User clicks "Guardar Permisos"
3. Frontend sends `POST /api/userpermissions` with:
   ```json
   {
     "user_id": 123,
     "module_view_ids": [1, 2, 3, ...]
   }
   ```
4. If backend has the column name bug:
   - Error is caught
   - Specific error message is shown to user
   - Message explains the issue and where to fix it
5. If successful:
   - Success message is shown
   - Permissions are updated

## Testing Recommendations

### Before Backend Fix
1. Try to load user permissions
   - Should work if the GET endpoint returns the correct data
2. Try to save permissions
   - Will fail with helpful error message

### After Backend Fix
1. Test loading permissions:
   ```bash
   # In browser console:
   # Navigate to /seguridad/permisos
   # Select a user
   # Check that their existing permissions load correctly
   ```

2. Test saving permissions:
   ```bash
   # Select different module views
   # Click "Guardar Permisos"
   # Verify success message
   # Refresh and verify permissions were saved
   ```

3. Test database:
   ```sql
   -- Verify permissions were created/updated
   SELECT * FROM userpermissions WHERE user_id = <test_user_id>;
   
   -- Verify correct relationships
   SELECT up.*, p.module_view_id, mv.menu, mv.submenu 
   FROM userpermissions up
   JOIN permissions p ON up.permission_id = p.id
   JOIN moduleviews mv ON p.module_view_id = mv.id
   WHERE up.user_id = <test_user_id>;
   ```

## Important Notes

### Role Permissions vs User Permissions
The `userpermissions` table should ONLY store direct user permissions, NOT permissions inherited from roles. Role-based permissions should be stored in a separate table (e.g., `role_permissions`).

**Frontend Responsibility:**
- Only allow editing direct user permissions
- Display role-based permissions as read-only (if shown at all)
- Don't save role permissions to userpermissions table

**Backend Responsibility:**
- When fetching user permissions, distinguish between direct and role-based
- When saving, only accept direct permissions
- Validate that submitted permissions are valid module_view_ids

### Payload Structure
The frontend now sends `module_view_ids` instead of `permissions` to be more explicit about what's being sent. The backend should:
1. Accept an array of module_view_ids
2. Find or create permission records for each (with action='view')
3. Delete existing userpermissions for this user
4. Create new userpermissions records linking user to permissions

## Files Modified

### Changed:
- `components/permisos/permisos-vistas-tab.tsx`
  - Added documentation header
  - Improved fetchUserPermissions with better fallbacks
  - Enhanced error handling in handleSavePermisos
  - Changed payload key to module_view_ids

### Created:
- `BACKEND_PERMISSIONS_FIX.md`
  - Complete backend fix guide
- `PERMISSIONS_FRONTEND_CHANGES.md` (this file)
  - Frontend changes documentation

## Next Steps

1. **Backend Team**: 
   - Review `BACKEND_PERMISSIONS_FIX.md`
   - Fix the column name in UserPermisosController.php
   - Test the endpoints with the frontend
   - Deploy the fix

2. **Frontend Team**:
   - Test the new error messages
   - Verify the improved loading logic works with various API responses
   - Test integration once backend is fixed

3. **QA Team**:
   - Test user permissions CRUD operations
   - Verify role permissions are not affected
   - Check database integrity
   - Test edge cases (no permissions, all permissions, etc.)

## Benefits of These Changes

1. **Better Error Messages**: Users and developers get clear, actionable error messages
2. **More Robust Loading**: Handles multiple API response structures
3. **Better Documentation**: Code is self-documenting with clear comments
4. **Easier Debugging**: Specific error detection helps identify issues quickly
5. **Clearer Intent**: Payload structure clearly indicates what's being sent
6. **Guides Fixes**: Error messages point directly to where the backend needs to be fixed
