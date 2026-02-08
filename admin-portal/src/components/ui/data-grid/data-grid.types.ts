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

// Filter operator definitions with labels
export const FILTER_OPERATORS = [
  { value: 'eq', label: 'Equals', symbol: '=' },
  { value: 'ne', label: 'Not Equals', symbol: '≠' },
  { value: 'gt', label: 'Greater Than', symbol: '>' },
  { value: 'gte', label: 'Greater Than or Equal', symbol: '≥' },
  { value: 'lt', label: 'Less Than', symbol: '<' },
  { value: 'lte', label: 'Less Than or Equal', symbol: '≤' },
  { value: 'like', label: 'Contains', symbol: '∋' },
  { value: 'in', label: 'In List', symbol: '∈' },
  { value: 'not_in', label: 'Not In List', symbol: '∉' },
  { value: 'is_null', label: 'Is Null', symbol: '∅' },
  { value: 'is_not_null', label: 'Is Not Null', symbol: '∄' },
] as const;

// Helper function to get operator label
export const getOperatorLabel = (operator: FilterOperator): string => {
  const op = FILTER_OPERATORS.find(op => op.value === operator);
  return op ? op.label : operator;
};

// Helper function to get operator symbol
export const getOperatorSymbol = (operator: FilterOperator): string => {
  const op = FILTER_OPERATORS.find(op => op.value === operator);
  return op ? op.symbol : '';
};

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
  defaultOperator?: FilterOperator;
  supportedOperators?: FilterOperator[];
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