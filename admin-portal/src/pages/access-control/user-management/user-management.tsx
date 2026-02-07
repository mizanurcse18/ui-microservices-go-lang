import { UserTable } from './components';

export function AccessControlUserManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>        
      </div>
      <div className="grid gap-5 lg:gap-7.5">
        <UserTable />
      </div>
    </div>
  );
}