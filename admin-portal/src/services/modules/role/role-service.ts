import { BaseApiService, type ApiResponse } from '../base-api-service';

interface Role {
  id: string | number;
  name: string;
  description: string;
  application_id?: number;
  company_id: string;
  created_at?: string;
  updated_at?: string;
}

interface RoleFilters {
  search?: string;
  name?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  columnFilters?: Array<{ id: string; value: any; operator?: string }>;
}

interface PaginatedRolesResponse {
  roles: Role[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class RoleService extends BaseApiService {
  private static instance: RoleService;
  
  private constructor(apiVersion: string = 'v1') {
    // Use the base URL with the API version path
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  async getRolesPaginated(filters?: RoleFilters): Promise<ApiResponse<PaginatedRolesResponse>> {
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

    console.log('Role service making paginated request with body:', requestBody);
    
    // Use centralized endpoint system with module-aware method
    const response = await this.postModule<any, any>('auth', 'roles/paginate', requestBody);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      const apiData = response.data;
      return {
        ...response,
        data: {
          roles: apiData.roles || [],
          total: apiData.total || 0,
          page: apiData.page || 1,
          pageSize: apiData.pageSize || 10,
          totalPages: apiData.totalPages || 1
        }
      };
    }
    
    return response;
  }

  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    const response = await this.getModule<any>('auth', 'roles');
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async getRoleById(id: string | number): Promise<ApiResponse<Role>> {
    const response = await this.getModule<any>('auth', `roles/${id}`);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async saveRole(roleData: Role | Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Role>> {
    // Always use the same endpoint for both create and update
    const response = await this.postModule<Role, any>('auth', 'roles/create', roleData);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async deleteRole(id: string | number): Promise<ApiResponse<void>> {
    const response = await this.deleteModule<any>('auth', `roles/${id}`);
    
    // Transform the response to match the expected format
    if (response.success) {
      return {
        ...response,
        data: undefined
      };
    }
    
    return response;
  }
}

// Singleton instance
const roleService = RoleService.getInstance();

export { roleService, RoleService, type Role, type RoleFilters, type PaginatedRolesResponse };