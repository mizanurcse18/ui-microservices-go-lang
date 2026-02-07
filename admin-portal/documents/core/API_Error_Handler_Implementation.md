# API Error Handler Implementation

## Overview
This document describes the implementation of a generic error code handler system that processes backend error responses and automatically handles authentication redirects, validation errors, and other common error scenarios.

## Error Code Structure
The system implements a comprehensive error code system matching the backend response format:

### Success Codes
- `0000` - Standard success response code

### Authentication Error Codes (0400 series)
- `0401` - Unauthorized (authentication required)
- `0410` - Invalid token (malformed or structurally invalid)
- `0411` - Expired token
- `0412` - Revoked token
- `0413` - Missing token

### Authorization Error Codes
- `0403` - Forbidden (insufficient permissions)

### Validation Error Codes (0420 series)
- `0420` - Invalid request format
- `0421` - Validation error
- `0422` - Method not allowed

### Resource Error Codes (0430 series)
- `0430` - Not found
- `0431` - Conflict

### Server Error Codes (0500 series)
- `0500` - Database error
- `0501` - Database connection error
- `0510` - Service unavailable
- `0520` - Internal server error

## Implementation Files

### 1. Error Code Definitions (`src/services/error-codes.ts`)
Contains all error code constants, categories, and utility functions:

```typescript
import { ERROR_CODES, isAuthenticationError, requiresRedirectToLogin } from '@/services/error-codes';

// Check if an error requires login redirect
if (requiresRedirectToLogin(errorCode)) {
  // Redirect to login page
}

// Check if it's an authentication error
if (isAuthenticationError(errorCode)) {
  // Handle authentication error
}
```

### 2. Error Handler (`src/services/error-handler.ts`)
Main error processing logic that:
- Processes API responses
- Automatically redirects on authentication errors
- Categorizes errors
- Provides human-readable messages

```typescript
import { defaultErrorHandler } from '@/services/error-handler';

// Process API response
const processedResponse = defaultErrorHandler.processApiResponse(apiResponse);

// Check if response requires auth redirect
if (defaultErrorHandler.requiresAuthRedirect(response)) {
  // Handle redirect scenario
}

// Get error category
const category = defaultErrorHandler.getResponseCategory(response);
```

### 3. Integration with Base API Service
The error handler is automatically integrated into `BaseApiService`:

```typescript
// In base-api-service.ts - handleResponse method
const processedResponse = defaultErrorHandler.processApiResponse({
  ...responseData,
  success: responseData.status === 'success',
  data: responseData.data,
  error: responseData.message
});
```

## Expected Backend Response Format

The system expects API responses in this format:

```json
{
  "status": "failure",
  "status_code": "0401",
  "message": "Invalid or expired token",
  "data": {
    "error": "Unauthorized - invalid token"
  }
}
```

Or for success responses:

```json
{
  "status": "success",
  "status_code": "0000",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

## Automatic Handling Features

### 1. Authentication Redirect
When authentication errors occur (`0401`, `0410`, `0411`, `0412`, `0413`), the system automatically:
- Clears stored authentication tokens
- Redirects to the login page (`/auth/signin`)
- Logs the event for debugging

### 2. Error Categorization
Errors are automatically categorized for different handling:
- **Authentication**: Token-related issues
- **Authorization**: Permission issues
- **Validation**: Input validation errors
- **Resource**: Not found or conflict errors
- **Server**: Backend service errors

### 3. Human-Readable Messages
The system provides user-friendly error messages for each error code:
- `0401`: "Authentication required. Please log in"
- `0411`: "Your session has expired. Please log in again"
- `0403`: "You do not have permission to access this resource"

## Usage Examples

### In Service Classes
```typescript
// Your service methods automatically get error handling
async getUserData(): Promise<ApiResponse<User>> {
  // BaseApiService.handleResponse() automatically processes errors
  return await this.get<User>('/users/123');
  // If token is expired, user gets redirected to login automatically
}
```

### Manual Error Checking
```typescript
import { 
  ERROR_CODES, 
  isAuthenticationError, 
  getErrorMessage 
} from '@/services/error-codes';

// Check specific error conditions
if (response.status_code === ERROR_CODES.UNAUTHORIZED) {
  // Handle unauthorized specifically
}

if (isAuthenticationError(response.status_code)) {
  // Handle any authentication error
}

// Get user-friendly message
const userMessage = getErrorMessage(response.status_code);
```

### Custom Error Handler Configuration
```typescript
import { ApiErrorHandler } from '@/services/error-handler';

// Create custom error handler with specific configuration
const customErrorHandler = new ApiErrorHandler({
  autoRedirectOnAuthError: false, // Disable auto-redirect
  loginPath: '/custom-login',     // Custom login path
  enableLogging: true,            // Enable/disable logging
  redirectFunction: (path) => {   // Custom redirect logic
    // Custom navigation logic
    router.push(path);
  }
});
```

## Integration with Existing Code

The error handler integrates seamlessly with existing service architecture:

1. **No Breaking Changes**: Existing service calls continue to work
2. **Automatic Processing**: Error handling happens automatically in `BaseApiService`
3. **Backward Compatible**: Falls back to existing error handling if needed
4. **Configurable**: Behavior can be customized per use case

## Testing Authentication Redirects

To test the authentication redirect functionality:

```typescript
// Simulate expired token response
const expiredTokenResponse = {
  status: 'failure',
  status_code: '0411',
  message: 'Token has expired',
  success: false
};

// Process through error handler
const result = defaultErrorHandler.processApiResponse(expiredTokenResponse);
// This will automatically redirect to login and clear tokens
```

## Configuration Options

The error handler can be configured globally or per instance:

```typescript
// Update default handler configuration
defaultErrorHandler.updateConfig({
  autoRedirectOnAuthError: true,
  loginPath: '/auth/login',
  enableLogging: false
});
```

## Error Flow Process

1. **API Call Made**: Service method calls API endpoint
2. **Response Received**: Response is processed by `BaseApiService.handleResponse()`
3. **Error Detection**: System checks for error status and codes
4. **Category Determination**: Error is categorized (auth, validation, etc.)
5. **Automatic Actions**: 
   - Authentication errors → Token cleanup + Redirect
   - Other errors → Return processed response
6. **Response Return**: Clean, categorized response is returned to calling code

This implementation provides a robust, maintainable error handling system that reduces boilerplate code and ensures consistent error handling across the application.