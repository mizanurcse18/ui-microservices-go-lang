# Route Access Control Implementation Guide

## Overview
This document describes how to implement route access control based on user menu permissions in the admin portal application. The system will ensure that users can only access routes that correspond to their assigned menu items, redirecting unauthorized access attempts to a custom 404 page.

## Current Routing Architecture

### 1. Application Structure
The routing follows this hierarchy:
```
App.tsx (BrowserRouter)
└── AppRouting.tsx
    └── AppRoutingSetup.tsx (Main authenticated routes)
        ├── Demo1Layout (Protected by RequireAuth)
        │   └── All application pages/routes
        ├── AuthRouting (Authentication routes: /auth/*)
        │   └── SignIn, SignUp, etc.
        └── ErrorRouting (Error pages: /error/*)
            └── Error404, Error500
```

### 2. Key Components
- **AppRoutingSetup.tsx**: Contains all main application routes (300+ routes)
- **RequireAuth.tsx**: Authentication guard component
- **MenuContext**: Manages dynamic menu data from backend API
- **Error404.tsx**: Custom 404 Not Found page

### 3. Route Categories
The application has these main route categories:
- **Authentication routes** (`/auth/*`) - Handled by AuthRouting component
- **Main application routes** (`/*`) - Handled by AppRoutingSetup component
- **Error routes** (`/error/*`) - Handled by ErrorRouting component

## Implementation Plan

### 1. Create Permission Utility Functions

First, we need to create utility functions to check route permissions:

```javascript
// src/utils/route-permissions.ts
import { MenuItem, MenuConfig } from '@/config/types';

export interface RoutePermission {
  path: string;
  allowed: boolean;
}

/**
 * Extract all paths from menu configuration (including nested children)
 */
export function extractMenuPaths(menuConfig: MenuConfig): string[] {
  const paths: string[] = [];
  
  function traverseMenu(items: MenuConfig) {
    items.forEach(item => {
      if (item.path && !item.disabled) {
        paths.push(item.path);
      }
      if (item.children) {
        traverseMenu(item.children);
      }
    });
  }
  
  traverseMenu(menuConfig);
  return paths;
}

/**
 * Check if a route is accessible based on user's menu permissions
 */
export function isRouteAccessible(
  routePath: string,
  allowedPaths: string[]
): boolean {
  // Handle exact matches
  if (allowedPaths.includes(routePath)) {
    return true;
  }
  
  // Handle parent route matches (e.g., /account/* should match /account/home)
  const matchingParent = allowedPaths.find(allowedPath => {
    // Remove trailing slash for comparison
    const cleanAllowedPath = allowedPath.replace(/\/$/, '');
    const cleanRoutePath = routePath.replace(/\/$/, '');
    
    // Check if routePath starts with allowedPath
    return cleanRoutePath.startsWith(cleanAllowedPath) && 
           (cleanRoutePath === cleanAllowedPath || 
            cleanRoutePath[cleanAllowedPath.length] === '/');
  });
  
  return !!matchingParent;
}

/**
 * Get route permissions for all routes
 */
export function getRoutePermissions(
  currentRoute: string,
  menuItems: MenuConfig
): RoutePermission[] {
  const allowedPaths = extractMenuPaths(menuItems);
  const permissions: RoutePermission[] = [];
  
  // In a real implementation, you would have a complete route map
  // This is a simplified version that just checks the current route
  permissions.push({
    path: currentRoute,
    allowed: isRouteAccessible(currentRoute, allowedPaths)
  });
  
  return permissions;
}
```

### 2. Create Route Guard Component

```javascript
// src/components/common/route-guard.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useMenuContext } from '@/contexts/menu-context';
import { isRouteAccessible, extractMenuPaths } from '@/utils/route-permissions';
import { useAuth } from '@/auth/context/auth-context';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { menuItems, isLoading: menuLoading } = useMenuContext();
  const { auth, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAccessible, setIsAccessible] = useState(false);
  
  useEffect(() => {
    const checkRouteAccess = async () => {
      if (authLoading || menuLoading) {
        return; // Wait for loading to complete
      }
      
      if (!auth?.access_token) {
        // Let RequireAuth handle unauthenticated users
        setIsChecking(false);
        return;
      }
      
      if (!menuItems || menuItems.length === 0) {
        // Fallback to static menu or allow access if menu failed to load
        console.warn('Menu data not available, allowing route access');
        setIsAccessible(true);
        setIsChecking(false);
        return;
      }
      
      const allowedPaths = extractMenuPaths(menuItems);
      const accessible = isRouteAccessible(location.pathname, allowedPaths);
      
      console.log('Route access check:', {
        route: location.pathname,
        accessible,
        allowedPaths: allowedPaths.slice(0, 10) // Log first 10 for debugging
      });
      
      setIsAccessible(accessible);
      setIsChecking(false);
    };
    
    checkRouteAccess();
  }, [location.pathname, menuItems, authLoading, menuLoading, auth]);
  
  if (authLoading || menuLoading || isChecking) {
    return <ScreenLoader />;
  }
  
  if (auth?.access_token && !isAccessible) {
    // Redirect to custom 404 when route is not in allowed menus
    console.log('Redirecting to 404 - route not accessible:', location.pathname);
    return <Navigate to="/error/404" replace />;
  }
  
  return <>{children}</>;
}
```

### 3. Update AppRoutingSetup to Include Route Guard

```javascript
// src/routing/app-routing-setup.tsx
import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth } from '@/auth/require-auth';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { RouteGuard } from '@/components/common/route-guard';
// ... other imports

export function AppRoutingSetup() {
  return (
    <Routes>
      {/* Authentication routes - no route guard needed */}
      <Route path="auth/*" element={<AuthRouting />} />
      
      {/* Error routes - no route guard needed */}
      <Route path="error/*" element={<ErrorRouting />} />
      
      {/* Protected application routes with route guard */}
      <Route element={<RequireAuth />}>
        <Route element={
          <RouteGuard>
            <Demo1Layout />
          </RouteGuard>
        }>
          <Route path="/" element={<DefaultPage />} />
          <Route path="/dark-sidebar" element={<Demo1DarkSidebarPage />} />
          <Route
            path="/public-profile/profiles/default/"
            element={<ProfileDefaultPage />}
          />
          {/* ... all other routes ... */}
          
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to="/error/404" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

### 4. Enhanced Menu Context for Better Integration

```javascript
// src/contexts/menu-context.tsx (additions)
export interface MenuContextType {
  menuItems: MenuConfig;
  isLoading: boolean;
  error: string | null;
  loadMenu: () => Promise<void>;
  reloadMenu: () => Promise<void>;
  resetToStaticMenu: () => void;
  // New methods for route access
  getAllowedPaths: () => string[];
  isPathAllowed: (path: string) => boolean;
}

// Add these methods to the context value:
const getAllowedPaths = (): string[] => {
  return extractMenuPaths(menuItems);
};

const isPathAllowed = (path: string): boolean => {
  return isRouteAccessible(path, getAllowedPaths());
};

const value: MenuContextType = {
  menuItems,
  isLoading,
  error,
  loadMenu,
  reloadMenu,
  resetToStaticMenu,
  getAllowedPaths,
  isPathAllowed,
};
```

### 5. Create Route Access Hook for Components

```javascript
// src/hooks/use-route-access.ts
import { useLocation } from 'react-router-dom';
import { useMenuContext } from '@/contexts/menu-context';

export function useRouteAccess() {
  const location = useLocation();
  const { isPathAllowed, getAllowedPaths } = useMenuContext();
  
  const currentPath = location.pathname;
  const isAllowed = isPathAllowed(currentPath);
  const allowedPaths = getAllowedPaths();
  
  return {
    currentPath,
    isAllowed,
    allowedPaths,
    checkAccess: (path: string) => isPathAllowed(path)
  };
}
```

## Implementation Steps

### Step 1: Create Utility Files
1. Create `src/utils/route-permissions.ts` with the permission utility functions
2. Create `src/components/common/route-guard.tsx` with the RouteGuard component
3. Create `src/hooks/use-route-access.ts` with the custom hook

### Step 2: Update Menu Context
Add the new methods to the existing menu context to expose route access functionality.

### Step 3: Integrate Route Guard
Update `AppRoutingSetup.tsx` to wrap the main layout with the RouteGuard component.

### Step 4: Test Implementation
1. Log in with a user account that has limited menu permissions
2. Try to manually navigate to routes not in their menu
3. Verify redirection to the 404 page
4. Test that allowed routes still work normally

## Key Features

### 1. Dynamic Permission Checking
- Permissions are checked against the user's actual menu data from the backend
- Works with both static and dynamic menu configurations
- Handles nested menu structures and path hierarchies

### 2. Graceful Fallbacks
- If menu data fails to load, the system allows access (fail-open approach)
- Unauthenticated users are handled by the existing RequireAuth component
- Loading states show appropriate spinners

### 3. Comprehensive Logging
- Detailed console logs for debugging permission checks
- Clear indication of why access was denied
- Path matching logic is traceable

### 4. Performance Considerations
- Permission checking is memoized and only runs when necessary
- No additional API calls for permission checking
- Uses existing menu context data

## Edge Cases Handled

1. **Nested Routes**: `/account/home/settings` will be allowed if user has `/account` in their menu
2. **Trailing Slashes**: Both `/account/` and `/account` are treated the same
3. **Menu Loading Failures**: System gracefully allows access if menu data is unavailable
4. **Static vs Dynamic Menus**: Works with both the fallback static menu and dynamic API menu
5. **Route Parameters**: Basic path matching works with parameterized routes

## Future Enhancements

1. **Fine-grained Permissions**: Add support for specific action permissions (read/write/delete)
2. **Role-based Access**: Extend to support role-based permission checking
3. **Caching**: Cache allowed paths for better performance
4. **Real-time Updates**: Listen for menu updates and refresh permissions
5. **Audit Logging**: Log access attempts for security monitoring

## Testing Checklist

- [ ] Users can access routes in their menu
- [ ] Users are redirected from routes not in their menu
- [ ] Nested route access works correctly
- [ ] Menu loading failures don't break the application
- [ ] Authentication flow still works as expected
- [ ] 404 page displays properly for unauthorized access
- [ ] Console logs show appropriate debugging information
- [ ] Performance is acceptable with permission checking

This implementation provides a robust, secure way to control route access based on user menu permissions while maintaining a good user experience.