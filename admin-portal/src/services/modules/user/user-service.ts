import { BaseApiService, type ApiResponse } from '@/services/modules/base-api-service';
import { AUTH_MODULE, ApiEndpointHelper } from '@/config/api-endpoints';

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

interface UserFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  columnFilters?: Array<{ id: string; value: any; operator?: string }>;
}

interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class UserService extends BaseApiService {
  private static instance: UserService;
  
  private constructor(apiVersion: string = 'v1') {
    // Use the base URL with the API version path
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUsersPaginated(filters?: UserFilters): Promise<ApiResponse<any>> {
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

    console.log('User service making paginated request with body:', requestBody);
    
    // Use centralized endpoint system with module-aware method
    return await this.postModule<any, any>('auth', 'users/paginate', requestBody);
  }

  async getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const params: Record<string, any> = {};
    
    if (filters?.search) {
      params.q = filters.search;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.sortBy) {
      params.sortBy = filters.sortBy;
      params.order = filters.sortOrder || 'asc';
    }

    return await this.get<User[]>(`/users`, params);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return await this.get<User>(`/users/${id}`);
  }

  async createUser(userData: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    return await this.postModule<User, any>('auth', 'users', userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return await this.postModule<User, any>('auth', `users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    // For DELETE requests, we might need a deleteModule method
    // For now, using the existing pattern
    return await this.delete<void>(`/auth/api/v1/users/${id}`);
  }

  async toggleUserStatus(id: string, status: boolean): Promise<ApiResponse<User>> {
    return await this.postModule<User, any>('auth', `users/${id}/status`, { switch: status });
  }

  async exportUsers(format: 'csv' | 'xlsx' = 'csv', scope: 'all' | 'filtered' = 'all'): Promise<ApiResponse<Blob>> {
    const requestBody = {
      format,
      scope
    };

    console.log('User service making export request with body:', requestBody);
    
    // Use centralized endpoint system with module-aware method
    return await this.postModule<Blob, any>('auth', 'users/export', requestBody);
  }
}

// Singleton instance
const userService = UserService.getInstance();

export { userService, UserService, type User, type UserFilters, type PaginatedUsersResponse };