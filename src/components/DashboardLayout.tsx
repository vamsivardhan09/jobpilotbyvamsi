import logoImg from "@/assets/jobpilot-logo.png";
import { useState } from "react";
import {
  LayoutDashboard, Upload, Target, Sparkles, Mic, User,
  MoreHorizontal, LogOut, BarChart3,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ATSScoreChecker } from "@/components/ATSScoreChecker";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [atsOpen, setAtsOpen] = useState(false);
  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-14 flex items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 mr-1 sm:mr-3 shrink-0">
            <img src={logoImg} alt="JobPilot" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm hidden sm:inline">JobPilot</span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {primaryNav.map((item) => (
              <Button
                key={item.url}
                variant={isActive(item.url) ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-3",
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
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm gap-1 sm:gap-1.5 px-2 sm:px-3">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Check ATS Score button — right side of header */}
        <Button
          variant="hero-outline"
          size="sm"
          onClick={() => setAtsOpen(true)}
          className="shrink-0 text-xs sm:text-sm gap-1.5"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Check ATS Score</span>
          <span className="sm:hidden">ATS</span>
        </Button>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      <ATSScoreChecker open={atsOpen} onOpenChange={setAtsOpen} />
    </div>
  );
}
