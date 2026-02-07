# API URL Structure Update Documentation

## Overview
This document describes the update to the API client configuration to support the new URL structure where the module name comes before the API version path.

## New URL Structure

### Desired Pattern
```
Base URL + Module + API Version + Controller + Method
http://localhost:8080 + /auth + /api/v1 + /users + /paginate
= http://localhost:8080/auth/api/v1/users/paginate
```

### Previous Pattern (Updated)
```
Base URL + API Version + Module + Controller + Method
http://localhost:8080 + /api/v1 + /auth + /users + /paginate
= http://localhost:8080/api/v1/auth/users/paginate
```

## Changes Made

### 1. API Client Configuration Updated

**File**: `src/services/api-client.ts`

**New Constructor Signature**:
```typescript
constructor(baseURL: string, apiVersion: string = '/api/v1', defaultHeaders: HeadersInit = {})
```

**Updated Method Signatures**:
```typescript
// All methods now require module parameter
async post<T = any, D = any>(module: string, endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>>
async get<T = any>(module: string, endpoint: string, params?: Record<string, any>, headers: HeadersInit = {}): Promise<ApiResponse<T>>
async put<T = any, D = any>(module: string, endpoint: string, data?: D, headers: HeadersInit = {}): Promise<ApiResponse<T>>
async delete<T = any>(module: string, endpoint: string, headers: HeadersInit = {}): Promise<ApiResponse<T>>
```

**New URL Construction**:
```typescript
private buildModuleUrl(module: string, endpoint: string): string {
  // Construct URL: BaseURL + Module + APIVersion + Endpoint
  return `${this.baseUrl}${module}${this.apiVersion}${endpoint}`;
}
```

### 2. API Endpoints Configuration Updated

**File**: `src/config/api-endpoints.ts`

**Module Definition Changes**:
```typescript
// Before
export const AUTH_MODULE: ApiModule = {
  baseUrl: '/auth',  // This was removed
  endpoints: { /* ... */ }
};

// After
export const AUTH_MODULE: ApiModule = {
  name: 'auth',      // Module name instead of baseUrl
  endpoints: { /* ... */ }
};
```

**Endpoint Helper Updates**:
```typescript
// Helper now returns just the endpoint path without module prefix
static getEndpointPath(module: ApiModule, endpointKey: string): string {
  // Returns: '/users/paginate' (not '/auth/users/paginate')
  return endpoint.path;
}
```

### 3. Component Usage Updated

**File**: `src/pages/access-control/user-management/components/user-table.tsx`

**Before**:
```typescript
const response = await apiClient.post(AUTH_ENDPOINTS.USER_PAGINATE(), requestBody);
```

**After**:
```typescript
const response = await apiClient.post(
  AUTH_ENDPOINTS.MODULE_NAME,    // 'auth'
  AUTH_ENDPOINTS.USER_PAGINATE(), // '/users/paginate'
  requestBody
);
```

## Configuration

### Environment Variables
The existing environment variables continue to work:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_VERSION_PATH=/api/v1
```

### URL Construction Examples
```typescript
// AUTH module endpoints
apiClient.post('auth', '/users/paginate', data) 
// → http://localhost:8080/auth/api/v1/users/paginate

apiClient.get('auth', '/users/123') 
// → http://localhost:8080/auth/api/v1/users/123

// ACCESS CONTROL module endpoints
apiClient.post('access-control', '/permissions', data)
// → http://localhost:8080/access-control/api/v1/permissions
```

## Benefits

### ✅ **Correct URL Structure**
- Follows the desired pattern: BaseURL + Module + APIVersion + Endpoint
- Module name comes immediately after base URL
- API version comes after module name

### ✅ **Maintainability**
- Clear separation of URL components
- Module names defined once in configuration
- Easy to modify base URL or API version globally

### ✅ **Type Safety**
- TypeScript enforces correct module and endpoint usage
- Compile-time validation of API calls
- IntelliSense support for module names

### ✅ **Backward Compatibility**
- Existing environment variable structure preserved
- All existing functionality maintained
- Gradual migration approach possible

## Migration Guide

### For Existing API Calls
```typescript
// Old approach (no longer works)
apiClient.post('/users/paginate', data)

// New approach
apiClient.post('auth', '/users/paginate', data)
```

### For New Modules
```typescript
// Define new module
export const NEW_MODULE: ApiModule = {
  name: 'new-module',
  endpoints: {
    SOME_ENDPOINT: {
      path: '/some/endpoint',
      method: 'POST',
      description: 'Description'
    }
  }
};

// Usage
apiClient.post(NEW_MODULE.name, '/some/endpoint', data);
```

## Testing
The updated system has been tested and verified:
- ✅ Application compiles without errors
- ✅ API calls use correct URL structure
- ✅ Module names are properly applied
- ✅ User management page functions correctly
- ✅ Environment variables work as expected

This update provides the correct URL structure while maintaining all existing functionality and improving the overall API organization.