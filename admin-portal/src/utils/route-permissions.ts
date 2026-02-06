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