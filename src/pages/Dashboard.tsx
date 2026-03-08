import logoImg from "@/assets/jobpilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Upload, BarChart3, Target, LogOut, User,
  FileText, TrendingUp, AlertTriangle, ChevronRight, Settings, Download, Sparkles
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [resumeCount, setResumeCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, resumeRes, matchRes, skillsRes, optimizedRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("resumes").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("job_matches").select("*").eq("user_id", user.id).order("match_score", { ascending: false }).limit(5),
        supabase.from("skills").select("*").eq("user_id", user.id).limit(10),
        supabase.from("optimized_resumes").select("id, created_at, job_match_id, ats_keywords, optimized_content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setResumeCount(resumeRes.count ?? 0);
      setMatchCount(matchRes.data?.length ?? 0);
      setTopMatches(matchRes.data ?? []);
      setSkills(skillsRes.data ?? []);

      // Enrich optimized resumes with job match titles
      const optimized = optimizedRes.data ?? [];
      if (optimized.length > 0) {
        const jobIds = [...new Set(optimized.map((o: any) => o.job_match_id).filter(Boolean))];
        if (jobIds.length > 0) {
          const { data: jobs } = await supabase.from("job_matches").select("id, title, company").in("id", jobIds);
          const jobMap = new Map((jobs ?? []).map((j: any) => [j.id, j]));
          optimized.forEach((o: any) => {
            const job = jobMap.get(o.job_match_id);
            o.job_title = job?.title || "Unknown Role";
            o.job_company = job?.company || "";
          });
        }
      }
      setOptimizedResumes(optimized);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src={logoImg} alt="JobPilot" className="w-7 h-7 object-contain" />
            JobPilot
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile"><Settings className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Here's your career intelligence overview.</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Resumes Uploaded", value: resumeCount, icon: FileText, color: "text-primary" },
            { label: "Job Matches", value: matchCount, icon: Target, color: "text-accent" },
            { label: "Avg Match Score", value: topMatches.length ? `${Math.round(topMatches.reduce((a, b) => a + (b.match_score ?? 0), 0) / topMatches.length)}%` : "—", icon: BarChart3, color: "text-success" },
            { label: "Optimized Resumes", value: optimizedResumes.length, icon: Sparkles, color: "text-warning" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="hero" className="w-full justify-start" asChild>
                <Link to="/upload"><Upload className="w-4 h-4 mr-2" /> Upload Resume</Link>
              </Button>
              <Button variant="hero-outline" className="w-full justify-start" asChild>
                <Link to="/jobs"><Target className="w-4 h-4 mr-2" /> Discover Jobs</Link>
              </Button>
              <Button variant="hero-outline" className="w-full justify-start" asChild>
                <Link to="/profile"><User className="w-4 h-4 mr-2" /> Edit Profile</Link>
              </Button>
            </div>
          </motion.div>

          {/* Top matches */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Top Job Matches</h2>
              {topMatches.length > 0 && (
                <Link to="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            {topMatches.length === 0 ? (
              <div className="text-center py-10">
                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No matches yet</p>
                <p className="text-xs text-muted-foreground">Upload your resume to start discovering jobs.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{match.title}</p>
                      <p className="text-xs text-muted-foreground">{match.company} • {match.location}</p>
                    </div>
                    <span className={`text-sm font-bold ml-4 shrink-0 ${
                      (match.match_score ?? 0) >= 80 ? "text-success" :
                      (match.match_score ?? 0) >= 60 ? "text-warning" : "text-destructive"
                    }`}>{match.match_score}%</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* My Optimized Resumes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> My Optimized Resumes
            </h2>
          </div>
          {optimizedResumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No optimized resumes yet</p>
              <p className="text-xs text-muted-foreground">Go to Job Discovery and optimize your resume for a specific role.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optimizedResumes.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{opt.job_title || "Optimized Resume"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {opt.job_company && <span>{opt.job_company}</span>}
                      <span>•</span>
                      <span>{new Date(opt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="hero-outline" size="sm" onClick={() => navigate(`/resume-preview?id=${opt.id}`)}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Preview & Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Skills section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6 mt-6">
          <h2 className="font-semibold mb-4">Your Skills</h2>
          {skills.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No skills extracted yet. Upload a resume to get started.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill.id} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {skill.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
