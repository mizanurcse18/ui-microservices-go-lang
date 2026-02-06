# Service Architecture

This document explains the modular service architecture implemented in this project.

## Overview

The service layer follows a modular approach with the following structure:

```
services/
├── modules/
│   ├── base-api-service.ts     # Base class with generic HTTP methods
│   ├── auth/
│   │   ├── auth-service.ts     # Authentication-specific API calls
│   │   └── index.ts            # Exports for auth module
│   └── index.ts                # Aggregates all module exports
├── user-service.ts             # User-specific API calls
├── service-manager.ts          # Centralized service access
└── index.ts                    # Main exports
```

## Base API Service

The `BaseApiService` provides generic HTTP methods:
- `get<T>(endpoint, params?, headers?)`
- `post<T, D>(endpoint, data?, headers?)`
- `put<T, D>(endpoint, data?, headers?)`
- `patch<T, D>(endpoint, data?, headers?)`
- `delete<T>(endpoint, headers?)`

All methods automatically include:
- Authentication tokens from Supabase
- Proper content-type headers
- Error handling
- API versioning (`/api/v1` by default)

## Modular Structure

Each module has its own folder under `modules/` with service-specific implementations.

### Auth Module

The auth module provides authentication-related API calls:
- `login(credentials)`
- `register(userData)`
- `forgotPassword(email)`
- `resetPassword(request)`
- `verifyEmail(token)`
- `changePassword(current, new)`

### Versioning

API versioning is handled through the constructor parameter:

```typescript
// Default to v1
const authService = new AuthService(); 

// Or specify version explicitly
const authService = new AuthService('v2');
```

The resulting URL structure is: `{BASE_URL}/{module}/api/{version}/{endpoint}`

For example:
- Auth: `http://localhost:8080/auth/api/v1/login`
- Users: `http://localhost:8080/users/api/v1/`

## Usage

### Direct Service Usage

```typescript
import { authService, userService } from '@/services';

// Authentication
const response = await authService.login({ email, password });

// User operations
const users = await userService.getUsers({ search: 'john' });
```

### Service Manager

```typescript
import { ServiceManager } from '@/services';

// Access services through the manager
const authResponse = await ServiceManager.auth.login({ email, password });
const users = await ServiceManager.user.getUsers();
```

## Environment Configuration

Set the base API URL in your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

If not set, defaults to `http://localhost:8080`.

## Adding New Modules

To add a new module (e.g., HRM):

1. Create a new folder: `services/modules/hrm/`
2. Create a service extending BaseApiService:
   ```typescript
   // services/modules/hrm/hrm-service.ts
   import { BaseApiService } from '../base-api-service';
   
   class HrmService extends BaseApiService {
     constructor(apiVersion: string = 'v1') {
       super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
       this.baseUrl = `${this.baseUrl}/hrm`;
     }
     
     async getEmployees() { /* ... */ }
   }
   ```
3. Add to the modules index: `services/modules/index.ts`
4. Export from the main index: `services/index.ts`

## Authentication Integration

The service layer automatically integrates with Supabase authentication by:
1. Retrieving the access token from the current session
2. Adding it to the Authorization header as `Bearer {token}`
3. Handling token refresh if needed (future enhancement)

This ensures all API calls are properly authenticated without manual intervention.