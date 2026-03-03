import { auth } from "@clerk/nextjs/server";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { syncClerkUserToDatabase } from "@/lib/user-sync";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userRecord = await syncClerkUserToDatabase();
  const { userId } = auth();
  const userDisplayName = userRecord?.full_name ?? userRecord?.email ?? userId ?? "Authenticated user";

  return (
    <div className="min-h-screen bg-emerald-50/50">
      <div className="md:flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <DashboardHeader userDisplayName={userDisplayName} />
          {children}
        </main>
      </div>
    </div>
  );
}
