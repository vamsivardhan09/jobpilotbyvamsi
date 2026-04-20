import { Link } from "react-router-dom";
import logoImg from "@/assets/jobpilot-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <img src={logoImg} alt="AnyJobs" className="w-7 h-7 object-contain" />
            AnyJobs
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AnyJobs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
