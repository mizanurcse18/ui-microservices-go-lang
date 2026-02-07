# Access Control Module Documentation

## Overview
This document describes the Access Control module structure and configuration. The module has been renamed from "security" to "access-control" to better reflect its purpose of managing user access, permissions, and authorization controls.

## Module Structure
```
src/pages/access-control/
├── user-management/
│   ├── components/
│   │   ├── index.ts
│   │   └── user-table.tsx
│   ├── index.ts
│   ├── access-control-user-management-content.tsx
│   └── access-control-user-management-page.tsx
└── index.ts
```

## Key Components

### AccessControlUserManagementPage
- **Path**: `/access-control/user-management`
- **Purpose**: Main page wrapper for user management functionality
- **Features**: 
  - Page title and description
  - Responsive container layout
  - Integration with content component

### AccessControlUserManagementContent
- **Purpose**: Content container following team-crew pattern
- **Structure**: Grid layout with proper spacing
- **Integration**: Wraps the main user table component

### UserTable Component
- **Purpose**: Configurable data grid for user management
- **Features**:
  - Dynamic column configuration
  - Toolbar button configuration
  - API integration with pagination
  - Search and filtering capabilities
  - Row selection and actions

## Route Configuration
The module is registered in `AppRoutingSetup.tsx` with the following configuration:

```typescript
{/* Access Control Module Routes */}
<Route
  path="/access-control/user-management"
  element={<AccessControlUserManagementPage />}
/>
```

## Access URL
Users can access the user management page at:
```
http://localhost:5173/access-control/user-management
```

## Configuration Approach
The module follows a configurable design pattern:
- **Toolbar Buttons**: Defined via configuration arrays
- **Data Grid Columns**: Configurable column definitions
- **API Integration**: Standardized API call structure
- **Extensible**: Easy to add new features and views

## Future Development
This module serves as the foundation for all access control related functionality:
- User permissions management
- Role-based access control
- Authentication policies
- Audit logging
- Access monitoring

The configurable approach allows for consistent implementation of access control features across the application.