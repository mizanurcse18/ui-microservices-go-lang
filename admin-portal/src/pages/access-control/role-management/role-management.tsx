import { RoleTable } from './components';

export function AccessControlRoleManagementPage() {
  return (
    <div className="container-fluid mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Role Management</h1>        
      </div>
      <div className="grid gap-5 lg:gap-7.5">
        <RoleTable />
      </div>
    </div>
  );
}