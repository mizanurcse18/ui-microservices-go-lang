import { BaseApiService, type ApiResponse } from '../base-api-service';

// Define the Menu Item interface with all required fields
interface MenuItem {
  id?: number | string;
  menu_id?: number | string;
  parent_id?: number | string | null;
  title: string;
  translate?: string;
  menu_type?: string;
  type?: string;
  icon?: string;
  url?: string;
  badge?: string;
  target?: string;
  exact?: boolean;
  auth?: string;
  parameters?: Record<string, any>;
  is_visible?: boolean;
  sequence_no?: number;
  children?: MenuItem[];
}

interface MenuFilters {
  search?: string;
  title?: string;
  parent_id?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  columnFilters?: Array<{ id: string; value: any; operator?: string }>;
}

interface PaginatedMenuResponse {
  menus: MenuItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class MenuService extends BaseApiService {
  private static instance: MenuService;
  
  private constructor(apiVersion: string = 'v1') {
    // Use the base URL with the API version path
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  async getMenus(filters?: MenuFilters): Promise<ApiResponse<MenuItem[]>> {
    const params: Record<string, any> = {};
    
    if (filters?.parent_id !== undefined) {
      params.parent_id = filters.parent_id;
    }
    
    if (filters?.search) {
      params.search = filters.search;
    }
    
    console.log('Menu service making request with params:', params);
    
    // Use centralized endpoint system with module-aware method
    const response = await this.getModule<any>('auth', 'menus', params);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      // Extract menus from the nested data structure
      const menusData = response.data.data?.menus || response.data.menus || response.data;
      
      // Convert to proper MenuItem structure
      const transformedData = this.convertToTreeStructure(menusData);
      
      return {
        ...response,
        data: transformedData
      };
    }
    
    return response;
  }

  async getMenusTree(): Promise<ApiResponse<MenuItem[]>> {
    // Get all menus from the auth module endpoint and organize them into a tree structure
    const response = await this.getModule<any>('auth', 'menus');
    
    // Transform the response to match the expected format and convert to tree structure
    if (response.success && response.data) {
      // Extract menus from the nested data structure
      const menusData = response.data.data?.menus || response.data.menus || response.data;
      
      // Convert flat structure to hierarchical tree structure
      const treeData = this.convertToTreeStructure(menusData);
      
      return {
        ...response,
        data: treeData
      };
    }
    
    return response;
  }
  
  // Helper function to convert flat menu data to hierarchical structure
  private convertToTreeStructure(flatData: any[]): MenuItem[] {
    if (!flatData || !Array.isArray(flatData)) {
      return [];
    }
    
    return flatData.map(item => {
      const menuItem: MenuItem = {
        id: item.id || this.generateId(), // Generate ID if not provided
        menu_id: item.menu_id || item.id,
        parent_id: item.parent_id || null,
        title: item.title || item.name || '',
        translate: item.translate,
        menu_type: item.menu_type || 'item',
        type: item.type || (item.children ? 'collapse' : 'link'),
        icon: item.icon || '',
        url: item.path || item.url || '',
        badge: item.badge,
        target: item.target || '_self',
        exact: item.exact || false,
        auth: item.auth,
        parameters: item.parameters || {},
        is_visible: item.is_visible !== undefined ? item.is_visible : true,
        sequence_no: item.sequence_no || 0
      };
      
      // Recursively convert children if they exist
      if (item.children && Array.isArray(item.children)) {
        menuItem.children = this.convertToTreeStructure(item.children);
      }
      
      // Handle special case for headings
      if (item.heading) {
        menuItem.title = item.heading;
        menuItem.type = 'heading';
      }
      
      return menuItem;
    });
  }
  
  // Helper to generate a unique ID if not provided
  private generateId(): string {
    return 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getMenusPaginated(filters?: MenuFilters): Promise<ApiResponse<PaginatedMenuResponse>> {
    const requestBody: Record<string, any> = {};
    
    if (filters?.page !== undefined) {
      requestBody.page = filters.page;
    }
    if (filters?.pageSize !== undefined) {
      requestBody.pageSize = filters.pageSize;
    }
    
    // Add sorting if specified
    if (filters?.sortBy) {
      requestBody.sort = [{
        field: filters.sortBy,
        direction: filters.sortOrder || 'asc'
      }];
    }
    
    // Add column filters if specified
    if (filters?.columnFilters && filters.columnFilters.length > 0) {
      requestBody.filters = filters.columnFilters.map(filter => ({
        field: filter.id,
        operator: filter.operator || 'like',
        value: filter.value
      }));
    }

    console.log('Menu service making paginated request with body:', requestBody);
    
    // Use centralized endpoint system with module-aware method
    const response = await this.postModule<any, any>('auth', 'menus/paginate', requestBody);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      const apiData = response.data;
      return {
        ...response,
        data: {
          menus: Array.isArray(apiData.data) ? this.convertToTreeStructure(apiData.data) : [],
          total: apiData.total || 0,
          page: apiData.page || 1,
          pageSize: apiData.page_size || 10,
          totalPages: apiData.total_pages || 1
        }
      };
    }
    
    return response;
  }

  async getMenuById(id: string | number): Promise<ApiResponse<MenuItem>> {
    const response = await this.getModule<any>('auth', `menus/${id}`);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async saveMenu(menuData: MenuItem): Promise<ApiResponse<MenuItem>> {
    // Always use the same endpoint for both create and update
    const response = await this.postModule<MenuItem, any>('auth', 'menus/create', menuData);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async deleteMenu(id: string | number): Promise<ApiResponse<void>> {
    const response = await this.deleteModule<any>('auth', `menus/${id}`);
    
    // Transform the response to match the expected format
    if (response.success) {
      return {
        ...response,
        data: undefined
      };
    }
    
    return response;
  }

  async moveMenu(id: string | number, newParentId: string | number | null, position?: number): Promise<ApiResponse<MenuItem>> {
    const response = await this.postModule<any, any>('auth', 'menus/move', {
      id,
      parent_id: newParentId,
      position
    });
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async changeMenuParent(id: string | number, parentId: string | number | null): Promise<ApiResponse<MenuItem>> {
    const response = await this.postModule<any, any>('auth', 'menus/change-parent', {
      id,
      parent_id: parentId
    });
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }
}

// Singleton instance
const menuService = MenuService.getInstance();

export { menuService, MenuService, type MenuItem, type MenuFilters, type PaginatedMenuResponse };