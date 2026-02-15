import { BaseApiService, type ApiResponse } from '../base-api-service';

interface Company {
  id: string;
  name: string;
  domain: string;
  category: string;
  seq_no: number;
  is_default: boolean;
  status: string;
  company_status: string;
  address: string;
  tin: string;
  bin: string;
  company_logo_path: string;
  email: string;
  employee_range: string;
  funded: number;
}

interface CompanyFilters {
  search?: string;
  status?: string;
  company_status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  columnFilters?: Array<{ id: string; value: any; operator?: string }>;
}

interface PaginatedCompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class CompanyService extends BaseApiService {
  private static instance: CompanyService;
  
  private constructor(apiVersion: string = 'v1') {
    // Use the base URL with the API version path
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  async getCompaniesPaginated(filters?: CompanyFilters): Promise<ApiResponse<PaginatedCompaniesResponse>> {
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

    console.log('Company service making paginated request with body:', requestBody);
    
    // Use centralized endpoint system with module-aware method
    const response = await this.postModule<any, any>('auth', 'companies/paginate', requestBody);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      const apiData = response.data;
      return {
        ...response,
        data: {
          companies: apiData.data || [],
          total: apiData.total || 0,
          page: apiData.page || 1,
          pageSize: apiData.page_size || 10,
          totalPages: apiData.total_pages || 1
        }
      };
    }
    
    return response;
  }

  async getCompanyById(id: string): Promise<ApiResponse<Company>> {
    const response = await this.getModule<any>('auth', `companies/${id}`);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async saveCompany(companyData: Company | Omit<Company, 'id'>): Promise<ApiResponse<Company>> {
    // Always use the same endpoint for both create and update
    const response = await this.postModule<Company, any>('auth', 'companies/save', companyData);
    
    // Transform the response to match the expected format
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data
      };
    }
    
    return response;
  }

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    const response = await this.delete<any>(`/auth/api/v1/companies/${id}`);
    
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
const companyService = CompanyService.getInstance();

export { companyService, CompanyService, type Company, type CompanyFilters, type PaginatedCompaniesResponse };