import { 
  ERROR_CODES, 
  ERROR_CATEGORIES, 
  ERROR_CODE_CATEGORIES, 
  HTTP_STATUS_MAP,
  ERROR_MESSAGES,
  isAuthenticationError,
  isAuthorizationError,
  isSuccessCode,
  requiresRedirectToLogin,
  getErrorCategory,
  getErrorMessage
} from './error-codes';
import type { ApiResponse } from './modules/base-api-service';

// Extended API response interface to include status codes
interface ExtendedApiResponse<T = any> extends ApiResponse<T> {
  status?: string;
  status_code?: string;
  message?: string;
  data?: T;
}

// Error handler configuration
interface ErrorHandlerConfig {
  // Whether to automatically redirect on authentication errors
  autoRedirectOnAuthError?: boolean;
  // Custom redirect function (if not using window.location)
  redirectFunction?: (path: string) => void;
  // Login path for redirects
  loginPath?: string;
  // Enable console logging
  enableLogging?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  autoRedirectOnAuthError: true,
  redirectFunction: (path: string) => {
    window.location.href = path;
  },
  loginPath: '/auth/signin',
  enableLogging: true,
};

class ApiErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process API response and handle errors appropriately
   */
  processApiResponse<T>(response: ExtendedApiResponse<T>): ExtendedApiResponse<T> {
    // Log the response if enabled
    if (this.config.enableLogging) {
      console.log('API Response:', response);
    }

    // Handle success responses
    if (response.success && (!response.status || response.status === 'success')) {
      return response;
    }

    // Handle error responses
    if (!response.success || response.status === 'failure') {
      const errorCode = response.status_code || this.getStatusCodeFromMessage(response.error || response.message);
      const errorMessage = response.message || response.error || 'Unknown error occurred';
      
      if (this.config.enableLogging) {
        console.error('API Error:', {
          errorCode,
          errorMessage,
          category: getErrorCategory(errorCode),
          requiresRedirect: requiresRedirectToLogin(errorCode)
        });
      }

      // Handle authentication errors - redirect to login
      if (this.config.autoRedirectOnAuthError && requiresRedirectToLogin(errorCode)) {
        this.handleAuthError(errorCode, errorMessage);
        // Return modified response to indicate redirect
        return {
          ...response,
          error: 'Authentication required - redirecting to login',
          status_code: ERROR_CODES.UNAUTHORIZED
        };
      }

      // Handle authorization errors
      if (isAuthorizationError(errorCode)) {
        this.handleAuthorizationError(errorCode, errorMessage);
      }

      // Return the response with processed error information, preserving original message
      return {
        ...response,
        status_code: errorCode,
        message: response.message || getErrorMessage(errorCode)
      };
    }

    return response;
  }

  /**
   * Handle authentication errors by redirecting to login
   */
  private handleAuthError(errorCode: string, errorMessage: string): void {
    if (this.config.enableLogging) {
      console.log('Authentication error detected, redirecting to login:', {
        errorCode,
        errorMessage
      });
    }

    // Clear any stored authentication tokens
    this.clearAuthTokens();

    // Perform redirect
    const redirectPath = this.config.loginPath || DEFAULT_CONFIG.loginPath || '/auth/signin';
    if (this.config.redirectFunction) {
      this.config.redirectFunction(redirectPath);
    } else {
      DEFAULT_CONFIG.redirectFunction!(redirectPath);
    }
  }

  /**
   * Handle authorization errors (403)
   */
  private handleAuthorizationError(errorCode: string, errorMessage: string): void {
    if (this.config.enableLogging) {
      console.warn('Authorization error:', {
        errorCode,
        errorMessage
      });
    }
    // Could show a toast notification or modal here
    // For now, we'll just log it
  }

  /**
   * Clear authentication tokens from storage
   */
  private clearAuthTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('api_user_data');
    
    if (this.config.enableLogging) {
      console.log('Authentication tokens cleared');
    }
  }

  /**
   * Extract status code from error message or HTTP status
   */
  private getStatusCodeFromMessage(message?: string, httpStatus?: number): string {
    if (httpStatus && HTTP_STATUS_MAP[httpStatus]) {
      return HTTP_STATUS_MAP[httpStatus];
    }

    if (!message) return ERROR_CODES.BASIC_ERROR;

    // Try to extract error code from message
    const codeMatch = message.match(/code["']?\s*:\s*["']?(\d{4})["']?/i);
    if (codeMatch) {
      return codeMatch[1];
    }

    // Check for common error patterns
    if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
      return ERROR_CODES.UNAUTHORIZED;
    }
    
    if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
      return ERROR_CODES.FORBIDDEN;
    }
    
    if (message.toLowerCase().includes('not found') || message.includes('404')) {
      return ERROR_CODES.NOT_FOUND;
    }
    
    if (message.toLowerCase().includes('invalid token') || message.includes('expired token')) {
      return ERROR_CODES.INVALID_TOKEN;
    }

    return ERROR_CODES.BASIC_ERROR;
  }

  /**
   * Check if a response requires authentication redirect
   */
  requiresAuthRedirect(response: ExtendedApiResponse<any>): boolean {
    if (!response.status_code && response.error) {
      const inferredCode = this.getStatusCodeFromMessage(response.error);
      return requiresRedirectToLogin(inferredCode);
    }
    return requiresRedirectToLogin(response.status_code || '');
  }

  /**
   * Get error category for a response
   */
  getResponseCategory(response: ExtendedApiResponse<any>): string {
    const errorCode = response.status_code || this.getStatusCodeFromMessage(response.error);
    return getErrorCategory(errorCode);
  }

  /**
   * Get human readable message for a response
   */
  getResponseMessage(response: ExtendedApiResponse<any>): string {
    const errorCode = response.status_code || this.getStatusCodeFromMessage(response.error);
    return getErrorMessage(errorCode);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create default instance
const defaultErrorHandler = new ApiErrorHandler();

// Export utilities
export {
  ApiErrorHandler,
  defaultErrorHandler,
  ERROR_CODES,
  ERROR_CATEGORIES,
  ERROR_CODE_CATEGORIES,
  HTTP_STATUS_MAP,
  ERROR_MESSAGES,
  isAuthenticationError,
  isAuthorizationError,
  isSuccessCode,
  requiresRedirectToLogin,
  getErrorCategory,
  getErrorMessage
};

export type { 
  ExtendedApiResponse, 
  ErrorHandlerConfig
};