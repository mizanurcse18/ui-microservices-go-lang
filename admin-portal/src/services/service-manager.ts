import { authService } from './modules/auth';
import { userService } from './modules/user';
import { 
  defaultErrorHandler, 
  ApiErrorHandler,
  ERROR_CODES,
  isAuthenticationError,
  isAuthorizationError,
  requiresRedirectToLogin,
  getErrorMessage
} from './error-handler';

/**
 * ServiceManager provides a centralized way to access all services
 * in the application. This makes it easier to manage dependencies
 * and ensures consistent service usage across the application.
 */
class ServiceManager {
  static readonly auth = authService;
  static readonly user = userService;
  static readonly errorHandler = defaultErrorHandler;

  /**
   * Initialize all services with the proper configuration
   * This can be called during app initialization to ensure
   * all services are properly configured
   */
  static initialize() {
    // In the future, we can add initialization logic here
    // for example, setting up default headers, base URLs, etc.
    console.log('Services initialized');
  }
}

// Re-export error handling utilities for convenience
export {
  ServiceManager,
  ApiErrorHandler,
  ERROR_CODES,
  isAuthenticationError,
  isAuthorizationError,
  requiresRedirectToLogin,
  getErrorMessage
};