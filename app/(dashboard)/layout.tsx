import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSiderbar from "@/module/dashboard/ui/components/dashboard-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
        <DashboardSiderbar/>
      <main className="flex flex-col h-screen w-screen bg-muted">
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
