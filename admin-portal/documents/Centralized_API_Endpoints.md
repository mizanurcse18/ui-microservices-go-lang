# Centralized API Endpoint Management System

## Overview
This document describes the implementation of a centralized API endpoint management system that organizes all API endpoints by module and provides type-safe, maintainable access to API paths throughout the application.

## System Structure

### Configuration File
**Location**: `src/config/api-endpoints.ts`

The system is organized into modules, each containing related endpoints:

```typescript
// AUTH Module - User management and authentication endpoints
export const AUTH_MODULE: ApiModule = {
  baseUrl: '/auth',
  endpoints: {
    USER_PAGINATE: {
      path: '/users/paginate',
      method: 'POST',
      description: 'Get paginated list of users'
    },
    // ... other endpoints
  }
};

// ACCESS CONTROL Module - Permissions and authorization endpoints
export const ACCESS_CONTROL_MODULE: ApiModule = {
  baseUrl: '/access-control',
  endpoints: {
    PERMISSIONS_LIST: {
      path: '/permissions',
      method: 'GET',
      description: 'Get all permissions'
    },
    // ... other endpoints
  }
};
```

## Key Features

### 1. Module-Based Organization
Endpoints are grouped by functional modules:
- **AUTH_MODULE**: User management, authentication
- **ACCESS_CONTROL_MODULE**: Permissions, roles, authorization

### 2. Type Safety
Full TypeScript support with:
- Interface definitions for endpoints
- Type definitions for endpoint keys
- Compile-time validation of endpoint references

### 3. Utility Functions
Helper class for working with endpoints:
```typescript
class ApiEndpointHelper {
  static getEndpointPath(module: ApiModule, endpointKey: string): string
  static getEndpoint(module: ApiModule, endpointKey: string): ApiEndpoint
  static buildEndpointPath(module: ApiModule, endpointKey: string, params: Record<string, string | number>): string
}
```

### 4. Convenience Exports
Pre-built endpoint accessors for common use cases:
```typescript
export const AUTH_ENDPOINTS = {
  USER_PAGINATE: () => ApiEndpointHelper.getEndpointPath(AUTH_MODULE, 'USER_PAGINATE'),
  USER_UPDATE: (id: string | number) => ApiEndpointHelper.buildEndpointPath(AUTH_MODULE, 'USER_UPDATE', { id }),
  // ... other endpoints
};
```

## Usage Examples

### Basic Endpoint Usage
```typescript
import { AUTH_ENDPOINTS } from '@/config/api-endpoints';

// Simple endpoint without parameters
const response = await apiClient.post(AUTH_ENDPOINTS.USER_PAGINATE(), requestBody);

// Endpoint with path parameters
const userResponse = await apiClient.get(AUTH_ENDPOINTS.USER_GET(userId));
```

### Direct Module Access
```typescript
import { AUTH_MODULE, ApiEndpointHelper } from '@/config/api-endpoints';

// Get endpoint configuration
const endpointConfig = ApiEndpointHelper.getEndpoint(AUTH_MODULE, 'USER_PAGINATE');
console.log(endpointConfig.method); // 'POST'
console.log(endpointConfig.description); // 'Get paginated list of users'

// Build endpoint path with parameters
const userPath = ApiEndpointHelper.buildEndpointPath(AUTH_MODULE, 'USER_UPDATE', { id: '123' });
// Returns: '/auth/users/123'
```

### Type-Safe Endpoint Access
```typescript
import { AuthEndpointKey } from '@/config/api-endpoints';

// TypeScript will enforce valid endpoint keys
const validEndpoint: AuthEndpointKey = 'USER_PAGINATE'; // ✅ Valid
// const invalidEndpoint: AuthEndpointKey = 'INVALID_ENDPOINT'; // ❌ TypeScript error
```

## Benefits

### ✅ **Maintainability**
- Single source of truth for all API endpoints
- Changes to endpoint paths only need to be made in one location
- Clear organization by functional modules

### ✅ **Type Safety**
- Compile-time validation of endpoint references
- IntelliSense support in IDEs
- Reduced runtime errors from typos

### ✅ **Consistency**
- Standardized endpoint definitions
- Consistent naming conventions
- Uniform parameter handling

### ✅ **Scalability**
- Easy to add new modules and endpoints
- Support for complex path parameters
- Extensible utility functions

## Migration Example

### Before (Hardcoded Strings)
```typescript
// Multiple components with duplicated endpoint strings
const response1 = await apiClient.post('/auth/users/paginate', data);
const response2 = await apiClient.get('/auth/users/123');
const response3 = await apiClient.put('/auth/users/123', updateData);
```

### After (Centralized System)
```typescript
// Single import, type-safe access
import { AUTH_ENDPOINTS } from '@/config/api-endpoints';

const response1 = await apiClient.post(AUTH_ENDPOINTS.USER_PAGINATE(), data);
const response2 = await apiClient.get(AUTH_ENDPOINTS.USER_GET('123'));
const response3 = await apiClient.put(AUTH_ENDPOINTS.USER_UPDATE('123'), updateData);
```

## Testing
The system has been tested and verified:
- ✅ Application compiles without errors
- ✅ API calls work with centralized endpoints
- ✅ TypeScript provides proper type checking
- ✅ User management page functions correctly
- ✅ Path parameter replacement works as expected

This centralized approach provides a robust, maintainable foundation for API endpoint management that scales well with application growth.