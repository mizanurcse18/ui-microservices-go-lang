import { Row } from '@tanstack/react-table';

// User data interface based on API response
export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
}

// Filter operator types matching backend
export type FilterOperator = 
  'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 
  'like' | 'in' | 'not_in' | 'is_null' | 'is_not_null';

// Filter configuration interface
export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: any;
}

// Sort configuration interface
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// API Response interface for paginated users
export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Configuration interfaces
export interface ToolbarButtonConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'mono' | 'dashed' | 'dim' | 'foreground' | 'inverse';
  onClick: () => void;
}

export interface ColumnConfig<T = any> {
  id: string;
  title: string;
  accessorKey?: string;
  accessorFn?: (row: T) => any;
  enableSorting?: boolean;
  enableHiding?: boolean;
  enableFiltering?: boolean;
  isFilter?: boolean;
  size?: number;
  cell?: (props: { row: Row<T> }) => React.ReactNode;
}

export interface DataGridConfig<T = any> {
  columns: ColumnConfig<T>[];
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnPinning?: boolean;
  enableColumnMoving?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}