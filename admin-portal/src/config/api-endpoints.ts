// API Modules Configuration
// Centralized location for all API endpoints organized by module

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
}

export interface ApiModule {
  name: string;
  endpoints: Record<string, ApiEndpoint>;
}

// AUTH Module - User management and authentication endpoints
export const AUTH_MODULE: ApiModule = {
  name: 'auth',
  endpoints: {
    USER_PAGINATE: {
      path: '/users/paginate',
      method: 'POST',
      description: 'Get paginated list of users'
    },
    USER_CREATE: {
      path: '/users',
      method: 'POST',
      description: 'Create a new user'
    },
    USER_UPDATE: {
      path: '/users/{id}',
      method: 'PUT',
      description: 'Update user information'
    },
    USER_DELETE: {
      path: '/users/{id}',
      method: 'DELETE',
      description: 'Delete a user'
    },
    USER_GET: {
      path: '/users/{id}',
      method: 'GET',
      description: 'Get user details'
    },
    USER_SEARCH: {
      path: '/users/search',
      method: 'GET',
      description: 'Search users by criteria'
    },
    USER_ROLES: {
      path: '/users/{id}/roles',
      method: 'GET',
      description: 'Get user roles'
    },
    USER_PERMISSIONS: {
      path: '/users/{id}/permissions',
      method: 'GET',
      description: 'Get user permissions'
    }
  }
};

// ACCESS CONTROL Module - Permissions and authorization endpoints
export const ACCESS_CONTROL_MODULE: ApiModule = {
  name: 'access-control',
  endpoints: {
    PERMISSIONS_LIST: {
      path: '/permissions',
      method: 'GET',
      description: 'Get all permissions'
    },
    PERMISSIONS_CREATE: {
      path: '/permissions',
      method: 'POST',
      description: 'Create new permission'
    },
    ROLES_LIST: {
      path: '/roles',
      method: 'GET',
      description: 'Get all roles'
    },
    ROLES_CREATE: {
      path: '/roles',
      method: 'POST',
      description: 'Create new role'
    },
    ROLES_ASSIGN: {
      path: '/roles/{id}/assign',
      method: 'POST',
      description: 'Assign role to user'
    }
  }
};

// All API modules grouped together
export const API_MODULES = {
  AUTH: AUTH_MODULE,
  ACCESS_CONTROL: ACCESS_CONTROL_MODULE
};

// Utility functions for working with API endpoints
export class ApiEndpointHelper {
  // Get module name
  static getModuleName(module: ApiModule): string {
    return module.name;
  }

  // Get endpoint path (without module prefix)
  static getEndpointPath(module: ApiModule, endpointKey: string): string {
    const endpoint = module.endpoints[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in module`);
    }
    
    return endpoint.path;
  }

  // Get endpoint configuration
  static getEndpoint(module: ApiModule, endpointKey: string): ApiEndpoint {
    const endpoint = module.endpoints[endpointKey];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointKey} not found in module`);
    }
    return endpoint;
  }

  // Replace path parameters (e.g., {id} with actual values)
  static buildEndpointPath(module: ApiModule, endpointKey: string, params: Record<string, string | number> = {}): string {
    let path = this.getEndpointPath(module, endpointKey);
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      path = path.replace(`{${key}}`, String(params[key]));
    });
    
    return path;
  }

  // Build complete URL with module, version, and endpoint
  static buildCompleteUrl(module: ApiModule, endpointKey: string, baseUrl: string, params: Record<string, string | number> = {}): string {
    const apiVersion = import.meta.env.VITE_API_VERSION_PATH || '/api/v1';
    const endpointPath = this.buildEndpointPath(module, endpointKey, params);
    
    // Remove leading slash from endpoint path if present
    const cleanEndpointPath = endpointPath.startsWith('/') ? endpointPath.substring(1) : endpointPath;
    
    return `${baseUrl}/${module.name}${apiVersion}/${cleanEndpointPath}`;
  }
}

// Export commonly used endpoints for convenience
export const AUTH_ENDPOINTS = {
  MODULE_NAME: AUTH_MODULE.name,
  USER_PAGINATE: () => ApiEndpointHelper.getEndpointPath(AUTH_MODULE, 'USER_PAGINATE'),
  USER_CREATE: () => ApiEndpointHelper.getEndpointPath(AUTH_MODULE, 'USER_CREATE'),
  USER_UPDATE: (id: string | number) => ApiEndpointHelper.buildEndpointPath(AUTH_MODULE, 'USER_UPDATE', { id }),
  USER_DELETE: (id: string | number) => ApiEndpointHelper.buildEndpointPath(AUTH_MODULE, 'USER_DELETE', { id }),
  USER_GET: (id: string | number) => ApiEndpointHelper.buildEndpointPath(AUTH_MODULE, 'USER_GET', { id }),
  USER_SEARCH: () => ApiEndpointHelper.getEndpointPath(AUTH_MODULE, 'USER_SEARCH')
};

export const ACCESS_CONTROL_ENDPOINTS = {
  MODULE_NAME: ACCESS_CONTROL_MODULE.name,
  PERMISSIONS_LIST: () => ApiEndpointHelper.getEndpointPath(ACCESS_CONTROL_MODULE, 'PERMISSIONS_LIST'),
  PERMISSIONS_CREATE: () => ApiEndpointHelper.getEndpointPath(ACCESS_CONTROL_MODULE, 'PERMISSIONS_CREATE'),
  ROLES_LIST: () => ApiEndpointHelper.getEndpointPath(ACCESS_CONTROL_MODULE, 'ROLES_LIST'),
  ROLES_CREATE: () => ApiEndpointHelper.getEndpointPath(ACCESS_CONTROL_MODULE, 'ROLES_CREATE'),
  ROLES_ASSIGN: (id: string | number) => ApiEndpointHelper.buildEndpointPath(ACCESS_CONTROL_MODULE, 'ROLES_ASSIGN', { id })
};

// Type definitions for better TypeScript support
export type AuthEndpointKey = keyof typeof AUTH_MODULE.endpoints;
export type AccessControlEndpointKey = keyof typeof ACCESS_CONTROL_MODULE.endpoints;
export type ModuleEndpointKey = AuthEndpointKey | AccessControlEndpointKey;