'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Settings2, X, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { UserDialog } from './user-dialog';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { userService } from '@/services/modules/user';
import { ContentLoader } from '@/components/common/content-loader';
import { ColumnInputFilter } from '@/components/ui/data-grid-column-input-filter';
import { 
  User, 
  PaginatedUsersResponse, 
  ToolbarButtonConfig, 
  ColumnConfig, 
  DataGridConfig 
} from '@/components/ui/data-grid/data-grid.types';

// Configuration for the user table - will be defined inside component to access state

const dataGridConfig: DataGridConfig<User> = {
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableColumnPinning: true,
  enableColumnMoving: true,
  pageSizeOptions: [5, 10, 20, 50],
  defaultPageSize: 10,
  columns: [
      {
        id: 'selection',
        title: '',
        accessorKey: 'id',
        enableSorting: false,
        enableHiding: false,
        size: 51,
      },
    {
      id: 'name',
      title: 'Name',
      accessorKey: 'name',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 200
    },
    {
      id: 'email',
      title: 'Email',
      accessorKey: 'email',
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'like',
      supportedOperators: ['eq', 'ne', 'like'],
      size: 250
    },
    {
      id: 'status',
      title: 'Status',
      accessorFn: (row: User) => row.is_active,
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 120,
    },
    {
      id: 'role',
      title: 'Role',
      accessorFn: (row: User) => row.is_admin,
      enableSorting: true,
      isFilter: true,
      defaultOperator: 'eq',
      supportedOperators: ['eq', 'ne'],
      size: 120,
    },
    {
      id: 'actions',
      title: 'Actions',
      enableSorting: false,
      size: 80,
    }
  ]
};



const UserTable = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: dataGridConfig.defaultPageSize || 10,
  });
  
  // State for Add User Dialog
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  // State for Edit User Dialog
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);


  
  // State to track if we're currently fetching data to prevent unwanted state updates
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Debug column filters changes
  useEffect(() => {
    console.log('📊 Column filters changed:', columnFilters);
  }, [columnFilters]);
  
  // Key to force re-render of filter components when clearing filters
  const [filterResetKey, setFilterResetKey] = useState(0);
  
  // Track if this is the initial render
  const isFirstRender = useRef(true);
  
  // Memoize sorting to prevent unnecessary re-renders
  const memoizedSorting = useMemo(() => sorting, [sorting[0]?.id, sorting[0]?.desc]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // Removed searchQuery and selectedStatuses state
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track the current request ID and previous sorting state
  const currentRequestId = useRef<string>('');
  const previousSortingRef = useRef<string>(JSON.stringify(sorting));
  
  // Initial data load - only run on mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🔄 Loading initial data');
      try {
        setLoading(true);
        
        // Prepare request filters for initial load
        const filters = {
          page: 1,
          pageSize: dataGridConfig.defaultPageSize || 10,
          sortBy: 'name',
          sortOrder: 'asc' as 'asc' | 'desc',
          columnFilters: [] as Array<{ id: string; value: any; operator?: string }>
        };
        
        console.log(`🔍 Initial API Request: Page ${filters.page}, PageSize: ${filters.pageSize}`);
        
        // Use userService to make the API request
        const response = await userService.getUsersPaginated(filters);
        
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedUsersResponse;
          setUsers(paginatedData.users);
          setTotalUsers(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching initial users:', err);
      } finally {
        setLoading(false);
        isFirstRender.current = false; // Mark that initial load is complete
      }
    };
    
    loadInitialData();
  }, []); // Empty dependency array for initial load only
  
  // Extract fetchUsers function for reusability
  const fetchUsers = async () => {
    const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${JSON.stringify(sorting[0])}`;
    
    // If there's already a request in flight, don't start a new one
    if (isFetching && currentRequestId.current === requestId) {
      console.log('🔄 Request already in flight, skipping...');
      return;
    }
    
    // SET REQUEST ID BEFORE making the API call to prevent race conditions
    currentRequestId.current = requestId;
    setIsFetching(true);
    
    try {
      setLoading(true);
      
      // Prepare request filters
      const filters = {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
        columnFilters: columnFilters.map(filter => {
          const filterValue = filter.value as { value: string; operator: string } | string;
          return {
            id: filter.id,
            value: typeof filterValue === 'object' && filterValue !== null ? filterValue.value : filterValue,
            operator: typeof filterValue === 'object' && filterValue !== null ? filterValue.operator : 'like'
          };
        })
      };
      
      console.log(`🔍 API Request: Page ${filters.page}, PageSize: ${filters.pageSize}, Sorting: ${JSON.stringify(sorting[0])}`);
      console.log(`🆔 Setting request ID to: ${requestId}`);
      console.log(`🆔 Current request ID is now: ${currentRequestId.current}`);
      if (columnFilters.length > 0) {
        console.log(`🔍 Filters sent:`, filters.columnFilters);
      }
      
      // Use userService to make the API request
      const response = await userService.getUsersPaginated(filters);
      
      // Only update state if this response is for the most recent request
      // and the pagination state hasn't changed since the request was made
      const isCurrentRequest = currentRequestId.current === requestId;
      const paginationStillValid = 
        pagination.pageIndex === (filters.page - 1) && 
        pagination.pageSize === filters.pageSize;
      
      if (isCurrentRequest && paginationStillValid) {
        if (response.success && response.data) {
          // Handle the API response format
          const paginatedData = response.data as PaginatedUsersResponse;
          setUsers(paginatedData.users);
          setTotalUsers(paginatedData.total);
          setTotalPages(paginatedData.totalPages);
        } else {
          setError(response.error || 'Failed to fetch users');
        }
      } else {
        console.log(`🔄 Ignoring stale response. Expected ID: ${requestId}, Current ID: ${currentRequestId.current}`);
        console.log(`🔄 Pagination still valid: ${paginationStillValid}`);
      }
    } catch (err) {
      // Only update error state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching users:', err);
      }
    } finally {
      // Only update loading state if this is the most recent request
      if (currentRequestId.current === requestId) {
        setLoading(false);
      }
      setIsFetching(false);
    }
  };

  // Fetch users from API when pagination/sorting/columnFilters changes
  useEffect(() => {
    // Skip if this is the first render (initial data load handles this)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Log all triggers for debugging
    console.log(`🔄 Effect triggered - Page: ${pagination.pageIndex}, PageSize: ${pagination.pageSize}`);
    console.log(`🔄 Column filters count: ${columnFilters.length}`);
    console.log(`🔄 Sorting:`, sorting[0]);
    
    // Check if sorting actually changed
    const currentSorting = JSON.stringify(memoizedSorting);
    const sortingChanged = previousSortingRef.current !== currentSorting;
    
    // Only update previous sorting if it actually changed
    if (sortingChanged) {
      previousSortingRef.current = currentSorting;
      console.log(`🔄 Sorting changed: ${currentSorting}`);
    }
    
    // Log filter changes in detail
    if (columnFilters.length > 0) {
      console.log(`🔄 Active filters:`, columnFilters.map(f => {
        const filterValue = f.value as { value: string; operator: string } | string | undefined;
        return {
          id: f.id,
          value: filterValue,
          operator: typeof filterValue === 'object' && filterValue !== null ? filterValue.operator : 'like'
        };
      }));
    } else {
      console.log('🔄 Filters cleared, reloading full dataset');
    }
    
    // Generate a unique request ID for this specific request
    const requestId = `${pagination.pageIndex}-${pagination.pageSize}-${currentSorting}`;
    currentRequestId.current = requestId;
    
    fetchUsers();
    
    // Return cleanup function to clear request ID on unmount
    return () => {
      currentRequestId.current = '';
    };
  }, [pagination.pageIndex, pagination.pageSize, memoizedSorting, columnFilters]);

  // Use users directly since we removed client-side filtering
  const filteredData = users;

  // Removed statusCounts since we removed the status filter

  // Removed handleStatusChange since we removed the status filter

  // Reset all filters
  const resetAllFilters = () => {
    setColumnFilters([]);
    // Increment reset key to force re-render of filter components
    setFilterResetKey(prev => prev + 1);
    // Reset to first page when clearing filters
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Check if any filters are active
  const hasActiveFilters = columnFilters.length > 0;

  // Build columns dynamically from configuration
  const columns = useMemo<ColumnDef<User>[]>(
    () => {
      const cols: ColumnDef<User>[] = [];

      // Add selection column
      if (dataGridConfig.enableRowSelection) {
        cols.push({
          id: 'selection',
          header: () => <DataGridTableRowSelectAll />,
          cell: ({ row }) => <DataGridTableRowSelect row={row} />,
          enableSorting: false,
          enableHiding: false,
          size: 51,
        });
      }

      // Add configured columns
      dataGridConfig.columns
        .filter(col => col.id !== 'selection')
        .forEach(config => {
          const column: ColumnDef<User> = {
            id: config.id,
            header: ({ column }) => (
              <div className="flex flex-col gap-1">
                <DataGridColumnHeader title={config.title} column={column} />
                {config.isFilter && (
                  <ColumnInputFilter 
                    key={`${config.id}-${filterResetKey}`}
                    column={column} 
                    placeholder={`Filter ${config.title}...`} 
                    className="mt-1 mb-1"
                    defaultOperator={config.defaultOperator}
                    supportedOperators={config.supportedOperators}
                  />
                )}
              </div>
            ),
            enableSorting: config.enableSorting ?? true,
            size: config.size,
          };

          if (config.accessorKey) {
            (column as any).accessorKey = config.accessorKey;
          }

          if (config.accessorFn) {
            (column as any).accessorFn = config.accessorFn;
          }

          // Handle specific cell rendering based on column ID
          if (config.id === 'status') {
            column.cell = ({ row }) => (
              <Badge
                size="lg"
                variant={row.original.is_active ? 'success' : 'secondary'}
                appearance="light"
                shape="circle"
              >
                <BadgeDot className={row.original.is_active ? 'bg-success' : 'bg-secondary'} />
                {row.original.is_active ? 'Active' : 'Inactive'}
              </Badge>
            );
          } else if (config.id === 'role') {
            column.cell = ({ row }) => (
              <Badge
                size="lg"
                variant={row.original.is_admin ? 'primary' : 'info'}
                appearance="light"
              >
                {row.original.is_admin ? 'Admin' : 'User'}
              </Badge>
            );
          } else if (config.id === 'actions') {
            column.cell = ({ row }) => {
              const { copyToClipboard } = useCopyToClipboard();
              
              const handleCopyId = () => {
                copyToClipboard(String(row.original.id));
                toast.success(`User ID copied: ${row.original.id}`);
              };

              const handleEdit = async () => {
                try {
                  console.log('📝 Edit button clicked for user:', row.original.id);
                  // Fetch fresh user data from the API
                  const response = await userService.getUserById(row.original.id);
                  
                  if (response.success && response.data) {
                    console.log('✅ User data fetched successfully:', response.data);
                    // Set the editing user with fresh data from the API
                    setEditingUser(response.data);
                    setIsEditUserDialogOpen(true);
                  } else {
                    toast.error(response.error || 'Failed to fetch user details');
                  }
                } catch (error) {
                  console.error('❌ Error fetching user details:', error);
                  toast.error('Failed to fetch user details');
                }
              };

              const handleDelete = () => {
                toast.warning(`Delete user: ${row.original.name}`);
              };

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="size-7" mode="icon" variant="ghost">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            };
          } else if (config.cell) {
            column.cell = config.cell;
          }

          // Add filter component if isFilter is true
          if (config.isFilter) {
            column.filterFn = 'includesString';
          }

          cols.push(column);
        });

      return cols;
    },
    [filterResetKey]
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: totalPages, // Use the actual total pages from API
    getRowId: (row: User) => String(row.id),
    state: {
      pagination,
      sorting: memoizedSorting,
      rowSelection,
      columnFilters,
    },
    columnResizeMode: 'onChange',
    // Use manual pagination to prevent react-table from managing page state
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableRowSelection: dataGridConfig.enableRowSelection,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();

    // Configuration for the user table
    const toolbarButtonsConfig: ToolbarButtonConfig[] = [
      {
        id: 'add-user',
        label: 'Add User',
        icon: <Plus size={16} />,
        variant: 'primary',
        onClick: () => {
          setIsAddUserDialogOpen(true);
        }
      },
      {
        id: 'export',
        label: 'Export',
        icon: <Download size={16} />,
        variant: 'outline',
        onClick: async () => {
          try {
            const response = await userService.exportUsers('csv', 'all');
            if (response.success && response.data) {
              // Create blob and download
              const blob = new Blob([response.data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              toast.success('Users exported successfully');
            } else {
              toast.error(response.error || 'Failed to export users');
            }
          } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export users');
          }
        }
      },
      {
        id: 'import',
        label: 'Import',
        icon: <Upload size={16} />,
        variant: 'outline',
        onClick: () => {
          toast.info('Import functionality will be implemented');
        }
      }
    ];

    return (
      <CardToolbar>
        {toolbarButtonsConfig.map(button => (
          <Button
            key={button.id}
            variant={button.variant}
            onClick={button.onClick}
          >
            {button.icon}
            {button.label}
          </Button>
        ))}
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={resetAllFilters}
          >
            <X size={16} className="me-2" />
            Clear Filters
          </Button>
        )}
        {dataGridConfig.enableColumnVisibility && (
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline">
                <Settings2 />
                Columns
              </Button>
            }
          />
        )}
      </CardToolbar>
    );
  };

  if (loading) {
    return <ContentLoader />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        table={table}
      recordCount={totalUsers} // Show the total number of users from API
      tableLayout={{
        columnsPinnable: dataGridConfig.enableColumnPinning ?? true,
        columnsMovable: dataGridConfig.enableColumnMoving ?? true,
        columnsVisibility: dataGridConfig.enableColumnVisibility ?? true,
        cellBorder: true,
      }}
    >
      <Card>
        <CardHeader>
          <CardHeading>
            <div className="flex items-center gap-2.5">
              {/* Search and status filter removed as requested */}
            </div>
          </CardHeading>
          <Toolbar />
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
    
    {/* Using a single state to track which mode the dialog is in */}
    <UserDialog
      open={isAddUserDialogOpen || isEditUserDialogOpen}
      onOpenChange={(open) => {
        // Close both dialogs when the dialog is closed
        setIsAddUserDialogOpen(false);
        setIsEditUserDialogOpen(false);
      }}
      user={isEditUserDialogOpen && editingUser ? {
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        confirmPassword: ''
      } : undefined}
      onRefresh={fetchUsers}
    />
  </>
);
};

export { UserTable };