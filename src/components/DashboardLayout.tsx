import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import logoImg from "@/assets/jobpilot-logo.png";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary transition-colors font-medium text-sm">
                <Menu className="w-5 h-5" />
                <span className="hidden sm:inline">Menu</span>
              </SidebarTrigger>
              <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                <img src={logoImg} alt="JobPilot" className="w-6 h-6 object-contain" />
                <span className="font-bold text-sm">JobPilot</span>
              </Link>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
