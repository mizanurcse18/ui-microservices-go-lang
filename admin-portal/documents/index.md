# Admin Portal - Development Documentation Index

## 📋 Project Overview

This documentation serves as the central hub for understanding and developing the Admin Portal application. The project follows a modular, service-oriented architecture with centralized API endpoint management.

## 🏗️ Core Architecture

### Project Structure
```
src/
├── auth/                    # Authentication system
├── components/             # Reusable UI components
├── config/                 # Application configuration
├── contexts/               # React context providers
├── hooks/                  # Custom React hooks
├── layouts/                # Page layouts and themes
├── pages/                  # Application pages organized by module
├── partials/               # Page sections and widgets
├── providers/              # Application providers
├── routing/                # Routing configuration
├── services/               # API services and clients
│   ├── modules/            # Module-specific services
│   │   ├── auth/           # Authentication service
│   │   ├── user/           # User management service
│   │   └── base-api-service.ts  # Base service class
│   ├── api-client.ts       # Generic HTTP client
│   └── service-manager.ts  # Central service access
└── utils/                  # Utility functions
```

## 🛠️ Adding New Services

### 1. Create Module Directory
```bash
mkdir src/services/modules/{module-name}
```

### 2. Create Service Class
**File**: `src/services/modules/{module-name}/{module-name}-service.ts`

```typescript
import { BaseApiService, type ApiResponse } from '@/services/modules/base-api-service';

interface YourDataType {
  id: string;
  // ... other properties
}

class YourModuleService extends BaseApiService {
  private static instance: YourModuleService;
  
  private constructor(apiVersion: string = 'v1') {
    super(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', apiVersion);
  }

  static getInstance(): YourModuleService {
    if (!YourModuleService.instance) {
      YourModuleService.instance = new YourModuleService();
    }
    return YourModuleService.instance;
  }

  // Example methods
  async getData(): Promise<ApiResponse<YourDataType[]>> {
    return await this.get<YourDataType[]>('/your-endpoint');
  }

  async createData(data: Omit<YourDataType, 'id'>): Promise<ApiResponse<YourDataType>> {
    return await this.postModule<YourDataType, any>('your-module', 'endpoint', data);
  }
}

const yourModuleService = YourModuleService.getInstance();
export { yourModuleService, YourModuleService };
```

### 3. Create Index File
**File**: `src/services/modules/{module-name}/index.ts`
```typescript
export { yourModuleService, YourModuleService } from './your-module-service';
```

### 4. Update Service Manager
**File**: `src/services/service-manager.ts`
```typescript
import { yourModuleService } from './modules/your-module';

class ServiceManager {
  static readonly yourModule = yourModuleService;
  // ... other services
}
```

## 📄 Adding New Pages

### 1. Create Page Directory
```bash
mkdir src/pages/{module-name}/{page-name}
```

### 2. Create Main Page Component
**File**: `src/pages/{module-name}/{page-name}/page.tsx`
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function YourPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Page Title</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your page content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Create Components Directory
```bash
mkdir src/pages/{module-name}/{page-name}/components
```

### 4. Add Route Configuration
**File**: `src/routing/app-routing.tsx`
```typescript
{
  path: '/your-module/your-page',
  element: <YourPage />,
  handle: {
    crumb: () => <span>Your Page</span>,
    title: 'Your Page Title'
  }
}
```

## 🔧 API Endpoint Management

### 1. Define Endpoints
**File**: `src/config/api-endpoints.ts`
```typescript
export const YOUR_MODULE: ApiModule = {
  name: 'your-module',
  endpoints: {
    LIST_ITEMS: {
      path: '/items',
      method: 'GET',
      description: 'Get list of items'
    },
    CREATE_ITEM: {
      path: '/items',
      method: 'POST',
      description: 'Create new item'
    }
  }
};

export const YOUR_MODULE_ENDPOINTS = {
  MODULE_NAME: YOUR_MODULE.name,
  LIST_ITEMS: () => ApiEndpointHelper.getEndpointPath(YOUR_MODULE, 'LIST_ITEMS'),
  CREATE_ITEM: () => ApiEndpointHelper.getEndpointPath(YOUR_MODULE, 'CREATE_ITEM')
};
```

### 2. Use in Services
```typescript
import { YOUR_MODULE_ENDPOINTS } from '@/config/api-endpoints';

// In your service method:
const response = await this.postModule<any, any>(
  YOUR_MODULE_ENDPOINTS.MODULE_NAME,
  YOUR_MODULE_ENDPOINTS.CREATE_ITEM(),
  data
);
```

## ⚙️ Configuration Files

### Environment Variables
**File**: `.env`
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_VERSION_PATH=/api/v1
```

### Menu Configuration
**File**: `src/config/menu.config.tsx`
```typescript
export const MENU_SIDEBAR: MenuItem[] = [
  {
    title: 'Your Module',
    path: '/your-module',
    icon: 'folder',
    children: [
      {
        title: 'Your Page',
        path: '/your-module/your-page'
      }
    ]
  }
];
```

## 📚 Documentation Structure

### Core Documentation Files
- **API_Service_Architecture.md** - Service architecture overview
- **API_Endpoint_Refactoring.md** - Endpoint management system
- **URL_Construction_Consolidation.md** - URL building patterns
- **Route_Access_Control_Implementation.md** - Route protection system

### Quick References
- **API_Client_Configuration.md** - HTTP client setup
- **Configurable_User_Management_System.md** - User management patterns
- **Dynamic_Menu_Implementation.md** - Menu system

## 🔄 Development Workflow

### 1. New Feature Development
1. Plan the module structure
2. Create service following the pattern
3. Implement page components
4. Configure routes and menu
5. Update documentation

### 2. API Integration
1. Define endpoints in `api-endpoints.ts`
2. Create/update service methods
3. Use centralized endpoint references
4. Test API calls

### 3. Component Development
1. Check existing components in `components/ui/`
2. Create new components in appropriate directories
3. Follow established patterns and naming conventions
4. Export through index files

## 🎯 Best Practices

### Code Organization
- Use module-based folder structure
- Maintain singleton pattern for services
- Centralize endpoint definitions
- Follow consistent naming conventions

### API Calls
- Use `postModule` for module-based endpoints
- Leverage environment variables for configuration
- Handle errors appropriately
- Log important operations

### Component Development
- Reuse existing UI components when possible
- Follow accessibility guidelines
- Implement proper TypeScript typing
- Write clean, maintainable code

## 🔍 Troubleshooting

### Common Issues
- **Duplicate method warnings**: Check BaseApiService for duplicate HTTP method definitions
- **URL construction errors**: Verify endpoint paths and module names
- **Authentication issues**: Check token handling in BaseApiService
- **Import errors**: Verify module paths and exports

### Debugging Tips
- Use browser console for API call debugging
- Check network tab for request/response details
- Enable debug logging in services
- Verify environment variable configuration

---

*Last Updated: February 2026*
*This documentation is maintained as the single source of truth for project development.*