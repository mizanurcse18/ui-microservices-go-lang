import { supabase } from '@/lib/supabase';
import { API_MODULES, type ApiModule } from '@/config/api-modules';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
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

  // Generic DELETE request
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
      const responseData = await response.json();
      
      // Check if response has the nested data structure { status, data, message }
      if (responseData && typeof responseData === 'object' && 'status' in responseData && 'data' in responseData) {
        if (responseData.status === 'success') {
          return { data: responseData.data as T, success: true };
        } else {
          // Check if this is an invalid/expired token error
          const errorMessage = responseData.message || 'API request failed';
          if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('Unauthorized - invalid token')) {
            // Try to refresh the access token
            const refreshSuccess = await this.refreshAccessToken();
            if (refreshSuccess) {
              // If refresh succeeded, we could potentially retry the original request
              // For now, we'll return the error and let the calling code handle retry logic
              console.log('Token was refreshed, but request needs to be retried');
            }
          }
          return { error: errorMessage, success: false };
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