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