import { Link } from "react-router-dom";
import logoImg from "@/assets/jobpilot-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  to?: string;
}

const sizeMap = {
  sm: { img: "w-7 h-7", text: "text-base" },
  md: { img: "w-8 h-8", text: "text-lg" },
  lg: { img: "w-12 h-12", text: "text-2xl" },
};

export const Logo = ({ size = "sm", to = "/" }: LogoProps) => {
  const s = sizeMap[size];
  return (
    <Link to={to} className={`flex items-center gap-2 font-bold ${s.text} tracking-tight`}>
      <img src={logoImg} alt="AnyJobs" className={`${s.img} object-contain`} />
      <span>AnyJobs</span>
    </Link>
  );
};
