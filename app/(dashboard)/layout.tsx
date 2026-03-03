import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardNavbar from "@/module/dashboard/ui/components/dashboard-navbar";
import DashboardSidebar from "@/module/dashboard/ui/components/dashboard-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  const session = await auth.api.getSession({ headers: await headers() });

  // Unauthenticated — render landing page without sidebar/navbar
  if (!session) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col min-h-screen w-screen bg-muted/50">
        <DashboardNavbar />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
