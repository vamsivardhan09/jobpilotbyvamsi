import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import logoImg from "@/assets/jobpilot-logo.png";
import {
  LayoutDashboard, Upload, Target, Sparkles, Mic, User,
  MoreHorizontal,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Jobs", url: "/jobs", icon: Target },
];

const moreNav = [
  { title: "ATS Optimizer", url: "/ats-optimizer", icon: Sparkles },
  { title: "Mock Interview", url: "/interview", icon: Mic },
  { title: "Profile", url: "/profile", icon: User },
];

function DashboardHeader() {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + "/");

  return (
    <header className="h-14 flex items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-4">
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="flex items-center gap-2 mr-2">
          <img src={logoImg} alt="JobPilot" className="w-6 h-6 object-contain" />
          <span className="font-bold text-sm hidden sm:inline">JobPilot</span>
        </Link>

        <nav className="flex items-center gap-1">
          {primaryNav.map((item) => (
            <Button
              key={item.url}
              variant={isActive(item.url) ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "text-xs sm:text-sm gap-1.5",
                isActive(item.url) && "shadow-sm"
              )}
            >
              <Link to={item.url}>
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </Link>
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm gap-1.5">
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moreNav.map((item) => (
                <DropdownMenuItem key={item.url} asChild>
                  <Link to={item.url} className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    isActive(item.url) && "font-medium text-primary"
                  )}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
