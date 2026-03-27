import logoImg from "@/assets/jobpilot-logo.png";
import { useState } from "react";
import {
  FileSearch, Sparkles, Target, User,
  LogOut, BarChart3, Mic, Wrench,
  ChevronDown,
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
import BottomNav from "@/components/BottomNav";

const primaryNav = [
  { title: "Analyze Resume", url: "/upload", icon: FileSearch },
  { title: "Optimize for Job", url: "/ats-optimizer", icon: Sparkles },
  { title: "Find Opportunities", url: "/jobs", icon: Target },
];

const careerTools = [
  { title: "ATS Score Checker", url: "/ats-score", icon: BarChart3, action: "ats" },
  { title: "Resume Builder", url: "/dashboard", icon: Wrench },
  { title: "Mock Interview", url: "/interview", icon: Mic },
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
      {/* Top header — hidden on mobile, visible on md+ */}
      <header className="h-14 hidden md:flex items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-5">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="JobPilot" className="w-6 h-6 object-contain" />
          <span className="font-bold text-sm">JobPilot</span>
        </Link>

        <nav className="flex items-center gap-1">
          {primaryNav.map((item) => (
            <Button
              key={item.url}
              variant={isActive(item.url) ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn("text-sm gap-1.5 px-3", isActive(item.url) && "shadow-sm")}
            >
              <Link to={item.url}>
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm gap-1.5 px-3">
                <Wrench className="w-4 h-4" />
                <span>Career Tools</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              {careerTools.map((item) => (
                <DropdownMenuItem
                  key={item.title}
                  onClick={() => {
                    if (item.action === "ats") setAtsOpen(true);
                    else navigate(item.url);
                  }}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    isActive(item.url) && "font-medium text-primary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild className="text-sm gap-1 px-3">
            <Link to="/profile">
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">My Profile</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile top bar — minimal */}
      <header className="h-12 flex md:hidden items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logoImg} alt="JobPilot" className="w-5 h-5 object-contain" />
          <span className="font-bold text-sm">JobPilot</span>
        </Link>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setAtsOpen(true)}>
          <BarChart3 className="w-4 h-4 text-primary" />
        </Button>
      </header>

      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      <ATSScoreChecker open={atsOpen} onOpenChange={setAtsOpen} />
    </div>
  );
}
