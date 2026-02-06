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