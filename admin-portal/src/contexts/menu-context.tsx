import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuConfig } from '@/config/types';
import { API_MODULES } from '@/config/api-modules';
import { extractMenuPaths, isRouteAccessible } from '@/utils/route-permissions';
import {
  AlertCircle,
  Award,
  Badge,
  Bell,
  Bitcoin,
  Bolt,
  Book,
  Briefcase,
  Building,
  Building2,
  CalendarCheck,
  Captions,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  Code,
  Codepen,
  Coffee,
  File as DocumentIcon,
  Euro,
  Eye,
  File,
  FileQuestion,
  FileText,
  Flag,
  Ghost,
  Gift,
  Grid,
  Heart,
  HelpCircle,
  Image,
  Info,
  Kanban,
  Key,
  Layout,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MessageSquare,
  Monitor,
  Network,
  Pencil,
  Plus,
  Plug,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldOff,
  ShieldUser,
  ShoppingCart,
  SquareCode,
  SquareMousePointer,
  Star,
  Theater,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserCircle,
  Users,
  Zap,
  BarChart3,
  BarChart2,
  CloudCog,
  FileInput,
  CircleCheck,
  ScrollText,
} from 'lucide-react';

interface MenuContextType {
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

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [menuItems, setMenuItems] = useState<MenuConfig>(MENU_SIDEBAR);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on initial load and load menu if so
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      console.log('User is already authenticated, loading menu on initial mount');
      loadMenuWithToken(accessToken);
    } else {
      // If no access token, set loading to false to show static menu
      setIsLoading(false);
    }
  }, []);

  // Listen for menu load requests from auth adapter
  useEffect(() => {
    const handleMenuLoadRequest = (event: CustomEvent) => {
      console.log('Menu load request received:', event.detail);
      const { accessToken } = event.detail;
      if (accessToken) {
        console.log('Loading menu with access token');
        loadMenuWithToken(accessToken);
      } else {
        console.warn('No access token provided for menu loading');
      }
    };

    window.addEventListener('menu-load-request', handleMenuLoadRequest as EventListener);
    
    return () => {
      window.removeEventListener('menu-load-request', handleMenuLoadRequest as EventListener);
    };
  }, []);

  const loadMenuWithToken = async (accessToken: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Import auth service dynamically to avoid circular dependencies
      const authModule = await import('@/services/modules/auth/auth-service');
      const authServiceInstance = new authModule.AuthService();
      
      // Use the proper auth service method instead of direct fetch
      const menuResult = await authServiceInstance.getMenu();
      
      if (menuResult.success && menuResult.data) {
        // Transform API menu data to match our MenuConfig structure
        const transformedMenu = transformMenuData(menuResult.data);
        
        // Validate that we got a proper menu structure
        if (Array.isArray(transformedMenu) && transformedMenu.length > 0) {
          console.log('Setting menu items to dynamic menu:', transformedMenu.length, 'items');
          console.log('First menu item sample:', transformedMenu[0]);
          setMenuItems(transformedMenu);
          console.log('Dynamic menu loaded successfully with', transformedMenu.length, 'items');
        } else {
          console.warn('Transformed menu is empty or invalid, using static menu');
          setMenuItems(MENU_SIDEBAR);
        }
      } else {
        throw new Error(menuResult.error || 'Failed to fetch menu data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load menu';
      setError(errorMessage);
      console.error('Menu loading error:', errorMessage);
      // Fall back to static menu
      setMenuItems(MENU_SIDEBAR);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToStaticMenu = (): void => {
    setMenuItems(MENU_SIDEBAR);
    setError(null);
  };

  // New methods for route access control
  const getAllowedPaths = (): string[] => {
    return extractMenuPaths(menuItems);
  };

  const isPathAllowed = (path: string): boolean => {
    return isRouteAccessible(path, getAllowedPaths());
  };
  const loadMenu = async (): Promise<void> => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      await loadMenuWithToken(accessToken);
    }
  };

  // Icon mapping function to convert icon name strings to React components
  const getIconComponent = (iconName?: string): any => {
    if (!iconName) return undefined;
    
    // Static mapping of icon names to imported components
    const iconMap: Record<string, any> = {
      // From menu.config.tsx and other common icons
      'AlertCircle': AlertCircle,
      'Award': Award,
      'Badge': Badge,
      'Bell': Bell,
      'Bitcoin': Bitcoin,
      'Bolt': Bolt,
      'Book': Book,
      'Briefcase': Briefcase,
      'Building': Building,
      'Building2': Building2,
      'CalendarCheck': CalendarCheck,
      'Captions': Captions,
      'Check': Check,
      'CheckCircle': CheckCircle,
      'ChevronLeft': ChevronLeft,
      'ChevronRight': ChevronRight,
      'ChevronsUpDown': ChevronsUpDown,
      'Circle': Circle,
      'Code': Code,
      'Codepen': Codepen,
      'Coffee': Coffee,
      'DocumentIcon': DocumentIcon,
      'Euro': Euro,
      'Eye': Eye,
      'File': File,
      'FileQuestion': FileQuestion,
      'FileText': FileText,
      'Flag': Flag,
      'Ghost': Ghost,
      'Gift': Gift,
      'Grid': Grid,
      'Heart': Heart,
      'HelpCircle': HelpCircle,
      'Image': Image,
      'Info': Info,
      'Kanban': Kanban,
      'Key': Key,
      'Layout': Layout,
      'LayoutGrid': LayoutGrid,
      'LifeBuoy': LifeBuoy,
      'Mail': Mail,
      'MessageSquare': MessageSquare,
      'Monitor': Monitor,
      'Network': Network,
      'PeopleIcon': Users, // PeopleIcon alias
      'Pencil': Pencil,
      'Plus': Plus,
      'Plug': Plug,
      'Search': Search,
      'Send': Send,
      'Settings': Settings,
      'Share2': Share2,
      'Shield': Shield,
      'ShieldOff': ShieldOff,
      'ShieldUser': ShieldUser,
      'ShoppingCart': ShoppingCart,
      'SquareCode': SquareCode,
      'SquareMousePointer': SquareMousePointer,
      'Star': Star,
      'Theater': Theater,
      'ThumbsDown': ThumbsDown,
      'ThumbsUp': ThumbsUp,
      'Trash2': Trash2,
      'TrendingUp': TrendingUp,
      'User': User,
      'UserCheck': UserCheck,
      'UserCircle': UserCircle,
      'Users': Users,
      'WorkIcon': Briefcase, // WorkIcon alias
      'Zap': Zap,
      'BarChart3': BarChart3,
      'BarChart2': BarChart2,
      'CloudCog': CloudCog,
      'FileInput': FileInput,
      'CircleCheck': CircleCheck,
      'ScrollText': ScrollText,
    };
    
    const iconComponent = iconMap[iconName];
    if (iconComponent) {
      return iconComponent;
    } else {
      console.warn(`Unknown icon: ${iconName}`);
      return undefined;
    }
  };
  
  // Helper function to transform API menu data to our structure
  const transformMenuData = (apiMenuData: any): MenuConfig => {
    // Handle case where API returns a single object with items array
    if (!Array.isArray(apiMenuData) && (apiMenuData as any).items && Array.isArray((apiMenuData as any).items)) {
      apiMenuData = (apiMenuData as any).items;
    }
    
    // Handle case where API returns a single object with menus array (new format)
    if (!Array.isArray(apiMenuData) && (apiMenuData as any).menus && Array.isArray((apiMenuData as any).menus)) {
      apiMenuData = (apiMenuData as any).menus;
      console.log('Transforming menu data from .menus property:', apiMenuData.length, 'items');
    }
    
    // Ensure we have an array
    if (!Array.isArray(apiMenuData)) {
      console.warn('API menu data is not an array:', apiMenuData);
      return MENU_SIDEBAR;
    }
    
    return apiMenuData.map((item: any) => {
      // Handle icon mapping - convert string icon names to LucideIcon components if needed
      let iconComponent = item.icon;
      if (typeof item.icon === 'string') {
        iconComponent = getIconComponent(item.icon);
        console.log('Mapped icon string "' + item.icon + '" to component:', iconComponent);
      }
      
      const menuItem: any = {
        title: item.title || item.name || '',
        path: item.path || item.url || '',
        icon: iconComponent,
        disabled: item.disabled || item.isDisabled || false,
        heading: item.heading || (item.isHeading ? item.title : undefined),
        collapse: item.collapse || item.collapsible || false,
        collapseTitle: item.collapseTitle || 'Show less',
        expandTitle: item.expandTitle || 'Show more',
      };
      
      // Handle children recursively
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        menuItem.children = transformMenuData(item.children);
      }
      
      return menuItem;
    });
  };

  const reloadMenu = async (): Promise<void> => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      await loadMenuWithToken(accessToken);
    }
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

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenuContext(): MenuContextType {
  const context = useContext(MenuContext);
  if (context === undefined) {
    // Return a default context to prevent crashes during initialization
    console.warn('useMenuContext: MenuProvider not found, returning default context');
    return {
      menuItems: MENU_SIDEBAR,
      isLoading: false,
      error: null,
      loadMenu: async () => {},
      reloadMenu: async () => {},
      resetToStaticMenu: () => {},
      getAllowedPaths: () => extractMenuPaths(MENU_SIDEBAR),
      isPathAllowed: (path: string) => isRouteAccessible(path, extractMenuPaths(MENU_SIDEBAR))
    };
  }
  
  // Also expose the reload function globally for manual triggering
  if (typeof window !== 'undefined') {
    (window as any).reloadMenu = context.reloadMenu;
    (window as any).menuContext = context;
  }
  
  return context;
}