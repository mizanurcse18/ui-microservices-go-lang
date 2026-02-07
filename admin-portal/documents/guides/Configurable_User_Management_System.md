# Configurable User Management System

## Overview
This is a configurable user management page built following the team-crew pattern. The system allows for dynamic configuration of data grids, toolbar buttons, and column definitions through configuration objects rather than hardcoding elements.

## Key Features

### 1. Dynamic Configuration
- **Toolbar Buttons**: Configurable via `toolbarButtonsConfig` array
- **Data Grid Columns**: Configurable via `dataGridConfig.columns` array
- **API Integration**: Fetches user data from the authentication API
- **Filtering & Sorting**: Built-in search and status filtering capabilities

### 2. Configuration Structure

#### Toolbar Button Configuration
```typescript
interface ToolbarButtonConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'mono' | 'dashed' | 'dim' | 'foreground' | 'inverse';
  onClick: () => void;
}
```

#### Column Configuration
```typescript
interface ColumnConfig {
  id: string;
  title: string;
  accessorKey?: string;
  accessorFn?: (row: User) => any;
  enableSorting?: boolean;
  enableHiding?: boolean;
  size?: number;
  cell?: (props: { row: Row<User> }) => React.ReactNode;
}
```

#### Data Grid Configuration
```typescript
interface DataGridConfig {
  columns: ColumnConfig[];
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnPinning?: boolean;
  enableColumnMoving?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}
```

### 3. API Integration
The system integrates with the authentication API endpoint:
```
POST http://localhost:8080/auth/api/v1/users/paginate
Authorization: Bearer <token>
Content-Type: application/json

{
  "page": 1,
  "pageSize": 10,
  "sort": [
    {"field": "id", "direction": "asc"}
  ]
}
```

Expected response format:
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com",
        "is_active": true,
        "is_admin": false
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 4. File Structure
```
src/pages/security/
├── user-management/
│   ├── components/
│   │   ├── index.ts
│   │   └── user-table.tsx
│   ├── index.ts
│   ├── security-user-management-content.tsx
│   └── security-user-management-page.tsx
└── index.ts
```

### 5. Usage Example

To create a new view with different configuration:

```typescript
// Custom configuration for a different user view
const customToolbarButtons: ToolbarButtonConfig[] = [
  {
    id: 'custom-action',
    label: 'Custom Action',
    icon: <CustomIcon />,
    variant: 'primary',
    onClick: () => handleCustomAction()
  }
];

const customColumns: ColumnConfig[] = [
  {
    id: 'custom-field',
    title: 'Custom Field',
    accessorKey: 'customField',
    enableSorting: true,
    size: 150
  }
];

// Use the same UserTable component with different props
<UserTable 
  toolbarButtons={customToolbarButtons}
  columns={customColumns}
/>
```

### 6. Key Components

#### UserTable Component
- **Props**: Configurable toolbar buttons and columns
- **State Management**: Handles pagination, sorting, filtering
- **API Integration**: Fetches and displays user data
- **Error Handling**: Graceful error display
- **Loading States**: Content loader during data fetch

#### ActionsCell Component
- Provides dropdown menu for row actions
- Includes: Edit, Copy ID, Delete functionality
- Uses toast notifications for user feedback

### 7. Styling and UX
- Follows the team-crew pattern styling
- Responsive design with proper spacing
- Consistent with existing UI components
- Smooth animations and transitions
- Accessible with proper ARIA labels

### 8. Extensibility
The system is designed to be easily extensible:
- Add new toolbar buttons through configuration
- Modify column definitions without code changes
- Customize cell rendering with custom components
- Extend API integration for different endpoints
- Add new filtering options

### 9. Testing
The component includes:
- Loading state handling
- Error state display
- Empty state management
- Proper TypeScript typing
- Console logging for debugging

This configurable approach allows creating different user management views by simply changing configuration objects, making it highly reusable and maintainable.