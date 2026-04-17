import logoImg from "@/assets/jobpilot-logo.png";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact top bar — same on mobile + desktop, hosts the trigger */}
          <header className="h-12 flex items-center justify-between border-b border-border/30 glass sticky top-0 z-40 px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="shrink-0" />
              <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
                <img src={logoImg} alt="JobPilot" className="w-5 h-5 object-contain" />
                <span className="font-bold text-sm">JobPilot</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
