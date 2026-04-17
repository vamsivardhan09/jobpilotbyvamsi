import logoImg from "@/assets/jobpilot-logo.png";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        {/* Desktop sidebar — hidden on mobile (mobile uses BottomNav) */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar — desktop shows sidebar trigger; mobile shows logo only */}
          <header className="h-12 flex items-center justify-between border-b border-border/30 glass sticky top-0 z-40 px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="shrink-0 hidden md:flex" />
              <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
                <img src={logoImg} alt="JobPilot" className="w-5 h-5 object-contain" />
                <span className="font-bold text-sm">JobPilot</span>
              </Link>
            </div>
          </header>

          {/* pb-20 on mobile so content isn't hidden behind BottomNav */}
          <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation — app-style */}
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
