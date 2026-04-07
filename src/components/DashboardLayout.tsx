import logoImg from "@/assets/jobpilot-logo.png";
import { useState } from "react";
import {
  FileSearch, Sparkles, Target, User,
  LogOut, BarChart3, Mic, Wrench,
  ChevronDown, Menu, X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
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

      {/* Mobile top bar */}
      <header className="h-12 flex md:hidden items-center justify-between border-b border-border/30 glass sticky top-0 z-50 px-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logoImg} alt="JobPilot" className="w-5 h-5 object-contain" />
          <span className="font-bold text-sm">JobPilot</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setAtsOpen(true)}>
            <BarChart3 className="w-4 h-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-12 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {primaryNav.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive(item.url) ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </Link>
          ))}
          <div className="border-t border-border/30 my-2 pt-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-1">Career Tools</p>
            {careerTools.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.action === "ats") setAtsOpen(true);
                  else navigate(item.url);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary w-full text-left"
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </button>
            ))}
          </div>
          <div className="border-t border-border/30 my-2 pt-2">
            <button
              onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      <ATSScoreChecker open={atsOpen} onOpenChange={setAtsOpen} />
    </div>
  );
}
