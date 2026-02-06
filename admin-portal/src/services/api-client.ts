import { supabase } from '@/lib/supabase';
import { UrlUtils } from '@/utils/url-utils';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private baseUrl: string;
  private apiVersion: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string, apiVersion: string = '/api/v1', defaultHeaders: HeadersInit = {}) {
    this.baseUrl = baseURL;
    this.apiVersion = apiVersion;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  // Generic GET request
  async get<T = any>(module: string, endpoint: string, params?: Record<string, any>, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(module, endpoint, params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic POST request
  async post<T = any, D = any>(module: string, endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildModuleUrl(module, endpoint);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic PUT request
  async put<T = any, D = any>(module: string, endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildModuleUrl(module, endpoint);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic DELETE request
  async delete<T = any>(module: string, endpoint: string, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildModuleUrl(module, endpoint);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  private buildModuleUrl(module: string, endpoint: string): string {
    // Build complete URL using utility function
    const constructedUrl = UrlUtils.buildApiUrl(this.baseUrl, module, this.apiVersion, endpoint);
    
    // Debug logging
    console.log('API Client URL Construction:');
    console.log('  Base URL:', this.baseUrl);
    console.log('  Module:', module);
    console.log('  API Version:', this.apiVersion);
    console.log('  Endpoint:', endpoint);
    console.log('  Final URL:', constructedUrl);
    
    return constructedUrl;
  }

  private buildUrl(module: string, endpoint: string, params?: Record<string, any>): string {
    const baseUrl = this.buildModuleUrl(module, endpoint);
    const url = new URL(baseUrl);
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async getAuthToken(): Promise<string | null> {
    // Get the current session from Supabase to extract the access token
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.text();
      return {
        error: errorData || `HTTP error! status: ${response.status}`,
        success: false,
      };
    }

    if (response.status === 204) {
      // No content
      return { success: true } as ApiResponse<T>;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, success: true };
    } else {
      const text = await response.text();
      return { data: text as unknown as T, success: true };
    }
  }
}

// Create a default instance of the API client
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const apiVersion = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';

const apiClient = new ApiClient(baseUrl, apiVersion);

export { ApiClient, apiClient };
export type { ApiResponse };