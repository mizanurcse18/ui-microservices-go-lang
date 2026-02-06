'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Filter, Search, Settings2, X } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { userService } from '@/services';
import { ContentLoader } from '@/components/common/content-loader';

interface IData {
  id: string;
  user: {
    avatar: string;
    name: string;
    email: string;
  };
  labels: string[];
  license?: {
    type: string;
    left: string;
  };
  payment?: string;
  enforce?: boolean;
}

// Data will be fetched from API
let initialData: IData[] = [];

const EnforceSwitch = ({ enforce }: { enforce: boolean }) => {
  return <Switch id="size-sm" size="sm" defaultChecked={enforce} />;
};

const Users = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'user', desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>('latest');
  const [users, setUsers] = useState<IData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers({
          search: searchQuery,
          status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
          sortBy: sorting[0]?.id,
          sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        });
        
        if (response.success && response.data) {
          // Transform User objects to match IData structure for saas-users
          const transformedData = response.data.map(user => ({
            id: user.id,
            user: {
              avatar: user.user?.avatar || 'blank.png',
              name: user.user?.userName || 'N/A',
              email: user.user?.description || 'user@example.com',
            },
            labels: user.labels || ['Basic'],
            license: user.products ? {
              type: user.products,
              left: 'Unlimited',
            } : undefined,
            payment: user.total || '2023-01-01',
            enforce: user.switch || false,
          }));
          setUsers(transformedData);
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
  }, [searchQuery, selectedStatuses, sorting]);

  const filteredData = useMemo(() => {
    let filtered = users;

    // Filter by status (2FA Enabled/Disabled)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) => {
        const status = item.enforce ? '2FA Enabled' : '2FA Disabled';
        return selectedStatuses.includes(status);
      });
    }

    // Filter by search query (case-insensitive)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user.name.toLowerCase().includes(searchLower) ||
          item.user.email.toLowerCase().includes(searchLower) ||
          item.labels.some((label) =>
            label.toLowerCase().includes(searchLower),
          ) ||
          (item.license && item.license.type.toLowerCase().includes(searchLower)) ||
          (item.payment && item.payment.toLowerCase().includes(searchLower)),
      );
    }

    // Apply sorting based on sortOrder
    if (sortOrder === 'latest') {
      filtered = [...filtered].sort(
        (a, b) => {
          const dateA = a.payment ? new Date(a.payment).getTime() : 0;
          const dateB = b.payment ? new Date(b.payment).getTime() : 0;
          return dateB - dateA;
        },
      );
    } else if (sortOrder === 'older') {
      filtered = [...filtered].sort(
        (a, b) => {
          const dateA = a.payment ? new Date(a.payment).getTime() : 0;
          const dateB = b.payment ? new Date(b.payment).getTime() : 0;
          return dateA - dateB;
        },
      );
    } else if (sortOrder === 'oldest') {
      filtered = [...filtered].sort(
        (a, b) => {
          const dateA = a.payment ? new Date(a.payment).getTime() : 0;
          const dateB = b.payment ? new Date(b.payment).getTime() : 0;
          return dateA - dateB;
        },
      );
    }

    return filtered;
  }, [users, searchQuery, selectedStatuses, sortOrder]);

  const statusCounts = useMemo(() => {
    return users.reduce(
      (acc, item) => {
        const status = item.enforce ? '2FA Enabled' : '2FA Disabled';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [users]);

  const handleStatusChange = (checked: boolean, value: string) => {
    setSelectedStatuses((prev = []) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: 'id',
        accessorFn: (row) => row.id,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        size: 51,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'user',
        accessorFn: (row) => row.user,
        header: ({ column }) => (
          <DataGridColumnHeader title="Subscriber" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${row.original.user.avatar}`)}
              className="size-7 rounded-full shrink-0"
              alt="image"
            />
            <div className="flex flex-col">
              <Link
                className="font-medium text-mono hover:text-primary-active mb-px"
                to="#"
              >
                {row.original.user.name}
              </Link>
              <Link
                className="text-sm text-secondary-foreground hover:text-primary-active"
                to="#"
              >
                {row.original.user.email}
              </Link>
            </div>
          </div>
        ),
        enableSorting: true,
        size: 300,
        meta: {
          headerClassName: '',
        },
      },
      {
        id: 'labels',
        accessorFn: (row) => row.labels,
        header: ({ column }) => (
          <DataGridColumnHeader title="Products" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            {row.original.labels.map((label: string, index: number) => (
              <Badge
                key={index}
                size="sm"
                variant="secondary"
              >
                {label}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: true,
        size: 200,
        meta: {
          headerClassName: '',
        },
      },
      {
        id: 'license',
        accessorFn: (row) => row.license,
        header: ({ column }) => (
          <DataGridColumnHeader title="License" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm text-foreground font-medium">
              {row.original.license?.type || ''}
            </span>
            <span className="text-xs text-secondary-foreground">
              {row.original.license?.left || ''}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 175,
        meta: {
          headerClassName: '',
        },
      },
      {
        id: 'payment',
        accessorFn: (row) => row.payment,
        header: ({ column }) => (
          <DataGridColumnHeader title="Latest Payment" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-medium">
            {row.original.payment}
          </span>
        ),
        enableSorting: true,
        size: 175,
        meta: {
          headerClassName: '',
        },
      },
      {
        id: 'enforce',
        accessorFn: (row) => row.enforce,
        header: ({ column }) => (
          <DataGridColumnHeader title="Enforce 2FA" column={column} />
        ),
        cell: ({ row }) => <EnforceSwitch enforce={!!row.original.enforce} />,
        enableSorting: true,
        size: 137,
        meta: {
          headerClassName: '',
        },
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataGridColumnHeader title="Invoices" column={column} />
        ),
        enableSorting: false,
        cell: () => {
          return (
            <Button mode="link" underlined="dashed">
              Download
            </Button>
          );
        },
        size: 100,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((users?.length || 0) / pagination.pageSize),
    getRowId: (row: IData) => String(row.id),
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    enableRowSelection: true,
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
        <Button>
          <Settings2 size={16} />
          Filters
        </Button>
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline">
              <Settings2 />
              Columns
            </Button>
          }
        />
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
        columnsPinnable: true,
        columnsMovable: true,
        columnsVisibility: true,
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
                  placeholder="Search Users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
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
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Filters
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter />
                    Sort Order
                    {sortOrder !== 'latest' && (
                      <Badge size="sm" variant="outline">
                        {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Sort By
                    </div>
                    <div className="space-y-3">
                      {['latest', 'older', 'oldest'].map((order) => (
                        <div key={order} className="flex items-center gap-2.5">
                          <Checkbox
                            id={order}
                            checked={sortOrder === order}
                            onCheckedChange={(checked) =>
                              checked && setSortOrder(order)
                            }
                          />
                          <Label
                            htmlFor={order}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {order.charAt(0).toUpperCase() + order.slice(1)}
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

export { Users };
