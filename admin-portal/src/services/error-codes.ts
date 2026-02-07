// Error Code Constants - Matching Backend Response Codes
export const ERROR_CODES = {
  // SUCCESS CODES
  // 0000 series - Success responses
  SUCCESS: '0000', // Standard success response code

  // BASIC ERROR CODES
  // 0001 series - General/basic errors
  BASIC_ERROR: '0001', // Generic error code for basic failures

  // AUTHENTICATION ERROR CODES
  // 0400 series - Authentication and authorization related errors
  UNAUTHORIZED: '0401', // HTTP 401 equivalent - authentication required
  FORBIDDEN: '0403', // HTTP 403 equivalent - access forbidden

  // TOKEN_ERROR_CODES
  // 0410 series - Token specific errors
  INVALID_TOKEN: '0410', // Malformed or structurally invalid tokens
  EXPIRED_TOKEN: '0411', // Tokens that have passed their expiration time
  REVOKED_TOKEN: '0412', // Tokens that have been explicitly revoked
  MISSING_TOKEN: '0413', // Absence of required authentication tokens

  // INVALID REQUEST ERROR CODES
  // 0420 series - Request validation and format errors
  INVALID_REQUEST_FORMAT: '0420', // Malformed request bodies or parameters
  VALIDATION_ERROR: '0421', // Business logic validation failures
  METHOD_NOT_ALLOWED: '0422', // HTTP method not supported for endpoint

  // RESOURCE ERROR CODES
  // 0430 series - Resource not found or conflict errors
  NOT_FOUND: '0430', // HTTP 404 equivalent - requested entity doesn't exist
  CONFLICT: '0431', // HTTP 409 equivalent - resource conflicts

  // DATABASE ERROR CODES
  // 0500 series - Database and persistence errors
  DATABASE_ERROR: '0500', // General database operation failures
  DATABASE_CONNECTION_ERROR: '0501', // Database connectivity issues

  // SERVICE ERROR CODES
  // 0510 series - External service and dependency errors
  SERVICE_UNAVAILABLE: '0510', // HTTP 503 equivalent - temporary service unavailability

  // INTERNAL SERVER ERROR CODE
  // 0520 - Unexpected server errors
  INTERNAL_SERVER_ERROR: '0520', // HTTP 500 equivalent - unexpected system failures
} as const;

// Type for error code keys
export type ErrorCodeKey = keyof typeof ERROR_CODES;

// Type for error code values
export type ErrorCodeValue = typeof ERROR_CODES[ErrorCodeKey];

// Error categories for handling logic
export const ERROR_CATEGORIES = {
  SUCCESS: 'SUCCESS',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  RESOURCE: 'RESOURCE',
  SERVER: 'SERVER',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];

// Map error codes to categories for handling
export const ERROR_CODE_CATEGORIES: Record<ErrorCodeValue, ErrorCategory> = {
  [ERROR_CODES.SUCCESS]: ERROR_CATEGORIES.SUCCESS,
  [ERROR_CODES.BASIC_ERROR]: ERROR_CATEGORIES.SERVER,
  [ERROR_CODES.UNAUTHORIZED]: ERROR_CATEGORIES.AUTHENTICATION,
  [ERROR_CODES.FORBIDDEN]: ERROR_CATEGORIES.AUTHORIZATION,
  [ERROR_CODES.INVALID_TOKEN]: ERROR_CATEGORIES.AUTHENTICATION,
  [ERROR_CODES.EXPIRED_TOKEN]: ERROR_CATEGORIES.AUTHENTICATION,
  [ERROR_CODES.REVOKED_TOKEN]: ERROR_CATEGORIES.AUTHENTICATION,
  [ERROR_CODES.MISSING_TOKEN]: ERROR_CATEGORIES.AUTHENTICATION,
  [ERROR_CODES.INVALID_REQUEST_FORMAT]: ERROR_CATEGORIES.VALIDATION,
  [ERROR_CODES.VALIDATION_ERROR]: ERROR_CATEGORIES.VALIDATION,
  [ERROR_CODES.METHOD_NOT_ALLOWED]: ERROR_CATEGORIES.VALIDATION,
  [ERROR_CODES.NOT_FOUND]: ERROR_CATEGORIES.RESOURCE,
  [ERROR_CODES.CONFLICT]: ERROR_CATEGORIES.RESOURCE,
  [ERROR_CODES.DATABASE_ERROR]: ERROR_CATEGORIES.SERVER,
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: ERROR_CATEGORIES.SERVER,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: ERROR_CATEGORIES.SERVER,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: ERROR_CATEGORIES.SERVER,
};

// HTTP status codes mapping
export const HTTP_STATUS_MAP: Record<number, ErrorCodeValue> = {
  400: ERROR_CODES.INVALID_REQUEST_FORMAT,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  405: ERROR_CODES.METHOD_NOT_ALLOWED,
  409: ERROR_CODES.CONFLICT,
  500: ERROR_CODES.INTERNAL_SERVER_ERROR,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
};

// Human readable messages for error codes
export const ERROR_MESSAGES: Record<ErrorCodeValue, string> = {
  [ERROR_CODES.SUCCESS]: 'Operation completed successfully',
  [ERROR_CODES.BASIC_ERROR]: 'An error occurred while processing your request',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required. Please log in',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to access this resource',
  [ERROR_CODES.INVALID_TOKEN]: 'Your session has expired. Please log in again',
  [ERROR_CODES.EXPIRED_TOKEN]: 'Your session has expired. Please log in again',
  [ERROR_CODES.REVOKED_TOKEN]: 'Your session has been terminated. Please log in again',
  [ERROR_CODES.MISSING_TOKEN]: 'Authentication required. Please log in',
  [ERROR_CODES.INVALID_REQUEST_FORMAT]: 'Invalid request format. Please check your input',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed. Please check your input',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 'This action is not allowed',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.CONFLICT]: 'A conflict occurred with your request',
  [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred',
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'Database connection failed',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An unexpected server error occurred',
};

export const isAuthenticationError = (errorCode: string): boolean => {
  return [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.INVALID_TOKEN,
    ERROR_CODES.EXPIRED_TOKEN,
    ERROR_CODES.REVOKED_TOKEN,
    ERROR_CODES.MISSING_TOKEN,
  ].includes(errorCode as ErrorCodeValue);
};

export const isAuthorizationError = (errorCode: string): boolean => {
  return ERROR_CODES.FORBIDDEN === errorCode;
};

export const isSuccessCode = (errorCode: string): boolean => {
  return ERROR_CODES.SUCCESS === errorCode;
};

export const requiresRedirectToLogin = (errorCode: string): boolean => {
  return isAuthenticationError(errorCode);
};

// Get appropriate error category for an error code
export const getErrorCategory = (errorCode: string): ErrorCategory => {
  return ERROR_CODE_CATEGORIES[errorCode as ErrorCodeValue] || ERROR_CATEGORIES.UNKNOWN;
};

// Get human readable message for error code
export const getErrorMessage = (errorCode: string): string => {
  return ERROR_MESSAGES[errorCode as ErrorCodeValue] || 'An unknown error occurred';
};