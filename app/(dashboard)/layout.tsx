import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardNavbar from "@/module/dashboard/ui/components/dashboard-navbar";
import DashboardSidebar from "@/module/dashboard/ui/components/dashboard-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col min-h-screen w-screen bg-muted">
        <DashboardNavbar />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
