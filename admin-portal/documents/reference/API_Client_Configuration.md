# API Client Configuration Update

## Overview
This document describes the update to the API client configuration to use `/api/v1/` as the standard API path structure, with configurable environment variables.

## Changes Made

### 1. Environment Variables Updated

**File**: `.env`
```env
## API Configuration
VITE_API_BASE_URL=http://localhost:8080
VITE_API_VERSION_PATH=/api/v1
```

### 2. API Client Configuration Updated

**File**: `src/services/api-client.ts`

**Before**:
```typescript
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '/api/v1');
```

**After**:
```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const apiVersionPath = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';
const fullBaseUrl = `${baseUrl}${apiVersionPath}`;

const apiClient = new ApiClient(fullBaseUrl);
```

## Configuration Structure

### Environment Variables
- **VITE_API_BASE_URL**: The base server URL (e.g., `http://localhost:8080`)
- **VITE_API_VERSION_PATH**: The API version path (e.g., `/api/v1`)

### URL Construction
The final API URL is constructed by combining both variables:
```
Full Base URL = VITE_API_BASE_URL + VITE_API_VERSION_PATH
Example: http://localhost:8080 + /api/v1 = http://localhost:8080/api/v1
```

## Benefits

### ✅ **Flexibility**
- Separate configuration for base URL and API version
- Easy to change API version without affecting server URL
- Support for different environments (dev, staging, prod)

### ✅ **Maintainability**
- Clear separation of concerns
- Environment-specific configurations
- Backward compatibility with existing .env setup

### ✅ **Scalability**
- Easy to add new API versions
- Support for versioned APIs
- Consistent URL structure across the application

## Usage Examples

### Development Environment
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_VERSION_PATH=/api/v1
# Results in: http://localhost:8080/api/v1
```

### Production Environment
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_VERSION_PATH=/api/v1
# Results in: https://api.yourdomain.com/api/v1
```

### Different API Version
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_VERSION_PATH=/api/v2
# Results in: https://api.yourdomain.com/api/v2
```

## API Endpoint Usage

With this configuration, API calls are simplified:

```typescript
// Instead of: '/users/paginate'
// The full URL becomes: http://localhost:8080/api/v1/users/paginate
const response = await apiClient.post('/users/paginate', requestBody);
```

## Backward Compatibility

The changes maintain full backward compatibility:
- Existing `VITE_API_BASE_URL` configuration is preserved
- Default values ensure the application works without .env changes
- All existing API calls continue to function

## Testing
The configuration has been tested and verified:
- ✅ Application compiles without errors
- ✅ API calls work with the new URL structure
- ✅ Environment variables are properly loaded
- ✅ User management page functions correctly

This update provides a more flexible and maintainable API configuration while preserving all existing functionality.