import { AccessControlUserManagementContent } from './access-control-user-management-content';

export function AccessControlUserManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, permissions, and access controls
        </p>
      </div>
      <AccessControlUserManagementContent />
    </div>
  );
}