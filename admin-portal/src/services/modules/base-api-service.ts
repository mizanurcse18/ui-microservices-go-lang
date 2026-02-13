import { supabase } from '@/lib/supabase';
import { API_MODULES, type ApiModule } from '@/config/api-modules';
import { defaultErrorHandler } from '@/services/error-handler';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status_code?: string;
  message?: string;
  status?: string;
}

class BaseApiService {
  protected baseUrl: string;
  protected apiVersion: string;
  protected defaultHeaders: HeadersInit;

  constructor(baseURL: string, apiVersion: string = 'v1', defaultHeaders: HeadersInit = {}) {
    this.baseUrl = baseURL;
    this.apiVersion = apiVersion; // Kept for backward compatibility, but not used in URL construction
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  // Generic GET request
  async get<T = any>(endpoint: string, params?: Record<string, any>, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(endpoint, params);
      
      console.log('Making GET request to:', url); // Debug log
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('GET response status:', response.status); // Debug log
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('GET request failed:', error); // Debug log
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic POST request (kept for backward compatibility)
  async post<T = any, D = any>(endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(endpoint);
      
      console.log('Making POST request to:', url, 'with data:', data); // Debug log
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('POST response status:', response.status); // Debug log
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('POST request failed:', error); // Debug log
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }
  protected async getModule<T = any>(
    moduleName: string, 
    endpointKey: string, 
    params?: Record<string, any>,
    headers: HeadersInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const apiVersion = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';
      const endpointPath = `/${moduleName}${apiVersion}/${endpointKey.replace(/^\//, '')}`;
      const url = this.buildUrl(endpointPath, params);
      
      console.log('Making module GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('Module GET response status:', response.status);
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('Module GET request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  protected async postModule<T = any, D = any>(
    moduleName: string, 
    endpointKey: string, 
    data?: D, 
    headers: HeadersInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const apiVersion = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';
      const endpointPath = `/${moduleName}${apiVersion}/${endpointKey.replace(/^\//, '')}`;
      const url = `${this.baseUrl}${endpointPath}`;
      
      console.log('Making module POST request to:', url, 'with data:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('Module POST response status:', response.status);
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('Module POST request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic PUT request (kept for backward compatibility)
  async put<T = any, D = any>(endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(endpoint);
      
      console.log('Making PUT request to:', url, 'with data:', data); // Debug log
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('PUT response status:', response.status); // Debug log
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('PUT request failed:', error); // Debug log
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic DELETE request (kept for backward compatibility)
  async delete<T = any>(endpoint: string, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(endpoint);
      
      console.log('Making DELETE request to:', url); // Debug log
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('DELETE response status:', response.status); // Debug log
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('DELETE request failed:', error); // Debug log
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  // Generic PATCH request
  async patch<T = any, D = any>(endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = this.buildUrl(endpoint);
      
      console.log('Making PATCH request to:', url, 'with data:', data); // Debug log
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('PATCH response status:', response.status); // Debug log
      
      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      console.error('PATCH request failed:', error); // Debug log
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      };
    }
  }

  protected async getAuthToken(): Promise<string | null> {
    // First try to get from localStorage (for custom API tokens)
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('Using access token from localStorage');
      return token;
    }
    
    // Fallback to Supabase session
    console.log('Falling back to Supabase session for token');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  protected async getStoredRefreshToken(): Promise<string | null> {
    return Promise.resolve(localStorage.getItem('refresh_token'));
  }

  protected async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }
      
      // Import auth service dynamically to avoid circular dependencies
      const authModule = await import('./auth/auth-service');
      const authServiceInstance = new authModule.AuthService();
      
      const refreshResult = await authServiceInstance.refreshToken(refreshToken);
      
      if (refreshResult.success && refreshResult.data) {
        // Store the new tokens
        localStorage.setItem('access_token', refreshResult.data.access_token);
        localStorage.setItem('refresh_token', refreshResult.data.refresh_token);
        console.log('Access token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', refreshResult.error);
        return false;
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      return false;
    }
  }

  protected async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.text();
      let errorResponse: any = {
        error: errorData || `HTTP error! status: ${response.status}`,
        success: false,
      };
  
      // Try to parse JSON error response
      try {
        const parsedError = JSON.parse(errorData);
        errorResponse = {
          ...errorResponse,
          ...parsedError,
          status_code: parsedError.status_code || response.status.toString()
        };
      } catch (e) {
        // If parsing fails, use the raw error with HTTP status mapping
        errorResponse.status_code = response.status.toString();
      }
  
      // Process the error through the error handler
      const processedResponse = defaultErrorHandler.processApiResponse(errorResponse);
      return processedResponse as ApiResponse<T>;
    }
  
    if (response.status === 204) {
      // No content
      return { success: true } as ApiResponse<T>;
    }
  
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
        
      // Check if response has the nested data structure { status, data, message, status_code }
      if (responseData && typeof responseData === 'object') {
        // Process through error handler to catch any error codes in successful responses
        const processedResponse = defaultErrorHandler.processApiResponse({
          ...responseData,
          success: responseData.status === 'success',
          data: responseData.data,
          error: responseData.message
        });
          
        if (processedResponse.success) {
          // Return complete response preserving all original fields
          return { 
            data: processedResponse.data as T, 
            success: true,
            message: processedResponse.message,
            status_code: processedResponse.status_code,
            status: processedResponse.status
          };
        } else {
          // Return complete error response preserving all original fields
          return { 
            error: processedResponse.message || processedResponse.error, 
            success: false,
            status_code: processedResponse.status_code,
            message: processedResponse.message,
            data: processedResponse.data as T | undefined,
            status: processedResponse.status
          };
        }
      }
        
      // Otherwise return the data directly
      return { data: responseData, success: true };
    } else {
      const text = await response.text();
      return { data: text as unknown as T, success: true };
    }
  }

  protected buildUrl(endpoint: string, params?: Record<string, any>): string {
    // For module-based services, endpoint should already include the full path
    // e.g., /auth/api/v1/users/paginate
    // Or it can be a relative path that gets combined with module info
    const url = new URL(`${this.baseUrl}${endpoint}`);
    console.log('Building URL:', `${this.baseUrl}${endpoint}`); // Debug log
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    console.log('Final URL:', url.toString()); // Debug log
    return url.toString();
  }

  // New method to build URLs using the centralized endpoint system
  protected buildModuleUrl(moduleName: string, endpointPath: string, params?: Record<string, any>): string {
    const apiVersion = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';
    const fullPath = `/${moduleName}${apiVersion}${endpointPath}`;
    const url = new URL(`${this.baseUrl}${fullPath}`);
    
    console.log('Building module URL:', `${this.baseUrl}${fullPath}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    console.log('Final module URL:', url.toString());
    return url.toString();
  }
}

export { BaseApiService };
export type { ApiResponse };