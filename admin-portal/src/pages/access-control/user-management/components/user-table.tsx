'use client';

import { useEffect, useMemo, useState } from 'react';
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
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Filter, Search, Settings2, X, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { userService } from '@/services/modules/user';
import { ContentLoader } from '@/components/common/content-loader';

// User data interface based on API response
interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

// Configuration interfaces
interface ToolbarButtonConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'mono' | 'dashed' | 'dim' | 'foreground' | 'inverse';
  onClick: () => void;
}

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

interface DataGridConfig {
  columns: ColumnConfig[];
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnPinning?: boolean;
  enableColumnMoving?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

// Configuration for the user table
const toolbarButtonsConfig: ToolbarButtonConfig[] = [
  {
    id: 'add-user',
    label: 'Add User',
    icon: <Plus size={16} />,
    variant: 'primary',
    onClick: () => {
      toast.info('Add User functionality will be implemented');
    }
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download size={16} />,
    variant: 'outline',
    onClick: () => {
      toast.info('Export functionality will be implemented');
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

const dataGridConfig: DataGridConfig = {
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
        cell: ({ row }) => <DataGridTableRowSelect row={row} />
      },
    {
      id: 'name',
      title: 'Name',
      accessorKey: 'name',
      enableSorting: true,
      size: 200
    },
    {
      id: 'email',
      title: 'Email',
      accessorKey: 'email',
      enableSorting: true,
      size: 250
    },
    {
      id: 'status',
      title: 'Status',
      accessorFn: (row) => row.is_active,
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <Badge
          size="lg"
          variant={row.original.is_active ? 'success' : 'secondary'}
          appearance="light"
          shape="circle"
        >
          <BadgeDot className={row.original.is_active ? 'bg-success' : 'bg-secondary'} />
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'role',
      title: 'Role',
      accessorFn: (row) => row.is_admin,
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <Badge
          size="lg"
          variant={row.original.is_admin ? 'primary' : 'info'}
          appearance="light"
        >
          {row.original.is_admin ? 'Admin' : 'User'}
        </Badge>
      )
    },
    {
      id: 'actions',
      title: 'Actions',
      enableSorting: false,
      size: 80,
      cell: ({ row }) => <ActionsCell row={row} />
    }
  ]
};

function ActionsCell({ row }: { row: Row<User> }) {
  const { copyToClipboard } = useCopyToClipboard();
  
  const handleCopyId = () => {
    copyToClipboard(String(row.original.id));
    toast.success(`User ID copied: ${row.original.id}`);
  };

  const handleEdit = () => {
    toast.info(`Edit user: ${row.original.name}`);
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
}

const UserTable = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: dataGridConfig.defaultPageSize || 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Prepare request filters
        const filters = {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sorting[0]?.id,
          sortOrder: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc'
        };
        
        // Use userService to make the API request
        const response = await userService.getUsersPaginated(filters);
                
        if (response.success && response.data) {
          // Handle the API response format
          setUsers(response.data.users);
        } else {
          setError(response.error || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  // Filter users based on search query and status
  const filteredData = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(user => {
        const status = user.is_active ? 'Active' : 'Inactive';
        return selectedStatuses.includes(status);
      });
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [users, searchQuery, selectedStatuses]);

  const statusCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const status = user.is_active ? 'Active' : 'Inactive';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [users]);

  const handleStatusChange = (checked: boolean, value: string) => {
    setSelectedStatuses(prev =>
      checked ? [...prev, value] : prev.filter(v => v !== value)
    );
  };

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
              <DataGridColumnHeader title={config.title} column={column} />
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

          if (config.cell) {
            column.cell = config.cell;
          }

          cols.push(column);
        });

      return cols;
    },
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((users?.length || 0) / pagination.pageSize),
    getRowId: (row: User) => String(row.id),
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    enableRowSelection: dataGridConfig.enableRowSelection,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();

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
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
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
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-64"
                />
                {searchQuery.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter />
                    Status
                    {selectedStatuses.length > 0 && (
                      <Badge size="sm" variant="outline">
                        {selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Filter by Status
                    </div>
                    <div className="space-y-3">
                      {Object.keys(statusCounts).map((status) => (
                        <div key={status} className="flex items-center gap-2.5">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) =>
                              handleStatusChange(checked === true, status)
                            }
                          />
                          <Label
                            htmlFor={status}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {status}
                            <span className="text-muted-foreground">
                              {statusCounts[status]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
  );
};

export { UserTable };