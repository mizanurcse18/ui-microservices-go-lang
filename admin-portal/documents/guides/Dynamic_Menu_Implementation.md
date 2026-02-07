# Dynamic Menu Implementation

## Overview
This document describes the implementation of dynamic menu loading that replaces the hardcoded menu configuration with data fetched from an API endpoint after successful user login.

## Implementation Details

### 1. Menu Context Provider
**File:** `src/contexts/menu-context.tsx`

Created a React context provider that manages:
- Dynamic menu state (menuItems)
- Loading state (isLoading)
- Error handling (error)
- Menu loading functions

**Key Features:**
- Automatically listens for menu load requests via custom events
- Falls back to static menu configuration on API failures
- Provides manual reload capability
- Handles various API response structures

### 2. Auth Service Integration
**File:** `src/services/modules/auth/auth-service.ts`

Added menu endpoint to the AuthService:
```typescript
async getMenu(): Promise<ApiResponse<MenuResponse[]>> {
  return await this.get<MenuResponse[]>('/menus');
}
```

### 3. Auth Adapter Modification
**File:** `src/auth/adapters/supabase-adapter.ts`

Modified the login flow to automatically trigger menu loading:
- After successful login, dispatches a custom event with the access token
- Provides a `loadDynamicMenu()` method for manual triggering

### 4. Sidebar Menu Component Update
**File:** `src/layouts/demo1/components/sidebar-menu.tsx`

Updated to consume dynamic menu data from context:
- Uses `useMenuContext()` hook to access menu state
- Shows loading state while fetching menu
- Displays error messages if menu loading fails
- Falls back to rendering menu normally once loaded

### 5. App Provider Integration
**File:** `src/App.tsx`

Wrapped the application with `MenuProvider` to make the context available throughout the app.

## How It Works

### Automatic Loading Flow:
1. User logs in successfully
2. Auth adapter stores access token and dispatches `menu-load-request` event
3. Menu context listens for this event and loads menu data
4. Menu data is transformed to match the application's menu structure
5. Sidebar menu component re-renders with dynamic menu items

### Manual Loading:
- Call `window.reloadMenu()` from browser console
- Or use the `reloadMenu()` function from `useMenuContext()`

### Fallback Mechanism:
- If API call fails, falls back to hardcoded `MENU_SIDEBAR`
- If transformed menu is empty/invalid, uses static menu
- Loading errors are displayed but don't break the application

## API Endpoint Expected Response

The system expects the `/auth/api/v1/menus` endpoint to return data in this format:

```json
{
  "status": "success",
  "data": [
    {
      "title": "Dashboard",
      "path": "/dashboard",
      "icon": "LayoutDashboard",
      "children": [
        {
          "title": "Overview",
          "path": "/dashboard/overview"
        }
      ]
    }
  ]
}
```

## Transformation Logic

The `transformMenuData()` function handles:
- Converting API response structure to application menu structure
- Mapping field names (title/name, path/url, etc.)
- Handling nested children recursively
- Setting default values for optional fields
- Icon handling (currently passes through as-is)

## Error Handling

- Network errors fall back to static menu
- Invalid response formats fall back to static menu
- Empty menu responses fall back to static menu
- All errors are logged to console for debugging

## Testing

To test the implementation:
1. Start the development server: `npm run dev`
2. Navigate to the login page
3. Log in with valid credentials
4. Observe the menu loading in the sidebar
5. Check browser console for loading messages
6. Test fallback by stopping the API server temporarily

## Future Improvements

1. **Icon Mapping**: Implement proper mapping of string icon names to LucideIcon components
2. **Caching**: Add local storage caching of menu data
3. **Permissions**: Filter menu items based on user permissions
4. **Real-time Updates**: WebSocket support for menu updates
5. **Better Error UI**: More sophisticated error display and retry mechanisms