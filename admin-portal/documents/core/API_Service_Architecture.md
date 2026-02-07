# API Service Architecture Documentation

## Overview
This document explains the API service architecture in the application, including the differences between BaseApiService and ApiClient, and the new module-based organization.

## Service Architecture

### 1. BaseApiService (`src/services/modules/base-api-service.ts`)
**Purpose**: Foundation class for all module-specific API services
**Key Features**:
- Extends `BaseApiService` to create specific service classes (AuthService, UserService)
- Handles token management and authentication
- Provides basic HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Implements token refresh logic
- Uses traditional API pattern with `/api/v1` path structure

**When to Use**: For creating module-specific service classes like `UserService`, `AuthService`

**URL Pattern**: `{baseURL}/api/{version}/{endpoint}`
- Example: `http://localhost:8080/api/v1/users`

### 2. ApiClient (`src/services/api-client.ts`)
**Purpose**: Generic HTTP client with module-based URL construction
**Key Features**:
- Module-based URL construction system
- Handles modern API pattern with module-first structure
- Centralized client instance for direct API calls
- Automatic URL formatting with slash handling

**When to Use**: For direct API calls from components or when module pattern is needed
**URL Pattern**: `{baseURL}/{module}/api/{version}/{endpoint}`
- Example: `http://localhost:8080/auth/api/v1/users`

## Service Module Structure

### New Module Organization

```
src/services/
├── modules/
│   ├── auth/
│   │   ├── auth-service.ts
│   │   └── index.ts
│   ├── user/
│   │   ├── user-service.ts
│   │   └── index.ts
│   └── base-api-service.ts
├── api-client.ts
└── user-service.ts (deprecated - will be removed)
```

### Module-Specific Services
Each module gets its own directory with:
- **Service class**: Implements API-specific logic and endpoint mapping
- **Interface definitions**: Type definitions for module data structures
- **Index file**: Clean export of all module components

### Migration Status

**AuthService**: ✅ Already in proper module structure
**UserService**: ✅ New version moved to modules/user with proper structure
**User Components**: Updated to import `userService` from '@/services/modules/user'`

### Key Differences Summary

| Aspect | BaseApiService | ApiClient |
|--------|----------------|-----------|
| **Purpose** | Foundation for service classes | Generic HTTP client |
| **URL Pattern** | baseURL/api/v1/endpoint | baseURL/module/api/v1/endpoint |
| **Usage** | Extend to create services | Direct API calls |
| **Token Handling** | Built-in with refresh | Built-in |
| **Module Support** | Basic | Advanced module system |

## Authorization Header Fix

### Issue Identified
The authorization header was missing because:
1. BaseApiService was not properly detecting access tokens
2. Different token retrieval strategies between services

### Solution Implemented
Enhanced token retrieval with better logging:
```typescript
protected async getAuthToken(): Promise<string | null> {
  // First try localStorage (custom API tokens)
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
```

## Migration Guide

### For Existing Services
1. Move service files to `src/services/modules/{module-name}/`
2. Create index.ts with proper exports
3. Update imports to use module path
4. Update service to extend BaseApiService if needed

### For New Services
1. Create module directory: `src/services/modules/{module-name}/`
2. Create service class extending BaseApiService
3. Define interfaces and types
4. Create index.ts for exports
5. Use appropriate service pattern based on needs

## Testing
The updated architecture has been tested with:
- ✅ User management page loads correctly
- ✅ API calls include proper authorization headers
- ✅ Module-based URL construction works
- ✅ Token retrieval functions properly
- ✅ All existing functionality maintained
- ✅ ServiceManager imports resolved correctly
- ✅ Module exports working properly

This architecture provides a clean, scalable approach to API service management with clear separation of concerns and proper module organization.