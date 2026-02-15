import { CompanyTable } from './components';

export function AccessControlCompanyManagementPage() {
  return (
    <div className="container-fluid mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Company Management</h1>        
      </div>
      <div className="grid gap-5 lg:gap-7.5">
        <CompanyTable />
      </div>
    </div>
  );
}