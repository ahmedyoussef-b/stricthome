// src/app/(dashboard)/admin/page.tsx
import AdminPageClient from '@/components/dashboard/admin/AdminPageClient';
import AdminStatsGrid from '@/components/dashboard/admin/AdminStatsGrid';
import AdminSidebar from '@/components/dashboard/admin/AdminSidebar';

export default function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    return (
        <AdminPageClient>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                  <AdminStatsGrid />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                  <AdminSidebar 
                    searchParams={searchParams}
                  />
              </div>
            </div>
        </AdminPageClient>
    );
}
