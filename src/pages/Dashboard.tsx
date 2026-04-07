import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, BarChart3, Target, FileText, TrendingUp,
  ChevronRight, Download, Sparkles,
  Flame, Trophy, Zap, ArrowRight,
} from "lucide-react";

const LEVEL_THRESHOLDS = [
  { label: "Beginner", min: 0, color: "text-muted-foreground" },
  { label: "Explorer", min: 20, color: "text-primary" },
  { label: "Rising Star", min: 50, color: "text-accent" },
  { label: "Pro Candidate", min: 80, color: "text-success" },
];

function getLevel(score: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i].min) return LEVEL_THRESHOLDS[i];
  }
  return LEVEL_THRESHOLDS[0];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [resumeCount, setResumeCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<any[]>([]);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [profileRes, resumeRes, matchRes, skillsRes, optimizedRes, interviewRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("resumes").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("job_matches").select("*").eq("user_id", user.id).order("match_score", { ascending: false }).limit(5),
          supabase.from("skills").select("*").eq("user_id", user.id).limit(10),
          supabase.from("optimized_resumes").select("id, created_at, job_match_id, ats_keywords, optimized_content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
          supabase.from("interview_sessions").select("id", { count: "exact" }).eq("user_id", user.id),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        setResumeCount(resumeRes.count ?? 0);
        setMatchCount(matchRes.data?.length ?? 0);
        setTopMatches(matchRes.data ?? []);
        setSkills(skillsRes.data ?? []);
        setInterviewCount(interviewRes.count ?? 0);

        const optimized = optimizedRes.data ?? [];
        if (optimized.length > 0) {
          const jobIds = [...new Set(optimized.map((o: any) => o.job_match_id).filter(Boolean))];
          if (jobIds.length > 0) {
            const { data: jobs } = await supabase.from("job_matches").select("id, title, company").in("id", jobIds);
            const jobMap = new Map((jobs ?? []).map((j: any) => [j.id, j]));
            optimized.forEach((o: any) => {
              const job = jobMap.get(o.job_match_id);
              o.job_title = job?.title || "Optimized Resume";
              o.job_company = job?.company || "";
            });
          }
        }
        setOptimizedResumes(optimized);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const resumeHealth = useMemo(() => {
    let score = 10;
    if (profile?.full_name) score += 10;
    if (profile?.headline) score += 10;
    if (profile?.experience_level) score += 5;
    if (skills.length >= 3) score += 15;
    if (skills.length >= 8) score += 10;
    if (resumeCount > 0) score += 20;
    if (optimizedResumes.length > 0) score += 10;
    if (interviewCount > 0) score += 10;
    return Math.min(100, score);
  }, [profile, skills, resumeCount, optimizedResumes, interviewCount]);

  const level = getLevel(resumeHealth);

  const dailyTasks = useMemo(() => {
    const tasks: { label: string; done: boolean; action: string }[] = [];
    tasks.push({ label: "Upload your resume", done: resumeCount > 0, action: "/upload" });
    tasks.push({ label: profile?.headline ? "Complete your profile" : "Add a headline to your profile", done: !!profile?.headline, action: "/profile" });
    tasks.push({ label: matchCount > 0 ? "Explore job matches" : "Discover job opportunities", done: matchCount > 0, action: "/jobs" });
    tasks.push({ label: interviewCount > 0 ? "Practice interviews" : "Try a mock interview", done: interviewCount > 0, action: "/interview" });
    return tasks.slice(0, 4);
  }, [resumeCount, profile, matchCount, interviewCount]);

  const completedTasks = dailyTasks.filter((t) => t.done).length;

  const card = "glass rounded-2xl p-4 sm:p-5";
  const delay = (i: number) => ({ delay: i * 0.04 });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome + Level */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">
              {profile?.full_name ? `Hey, ${profile.full_name.split(" ")[0]} 👋` : "Welcome back 👋"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Let's get you hired.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Trophy className={`w-3.5 h-3.5 ${level.color}`} />
              <span className={`text-xs font-semibold ${level.color}`}>{level.label}</span>
            </div>
          </div>
        </motion.div>

        {/* Resume Health Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(1)} className={`${card} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Career Readiness</span>
              </div>
              <span className="text-2xl font-black text-primary">{resumeHealth}%</span>
            </div>
            <Progress value={resumeHealth} className="h-2 mb-2" />
            <p className="text-[11px] text-muted-foreground">
              {resumeHealth >= 80 ? "You're ahead of 80% of candidates!" : resumeHealth >= 50 ? "Getting stronger — keep going!" : "Complete tasks below to boost your score."}
            </p>
          </div>
        </motion.div>

        {/* Daily Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(2)} className={card}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold">Daily Goals</span>
            </div>
            <span className="text-xs text-muted-foreground">{completedTasks}/{dailyTasks.length} done</span>
          </div>
          <div className="space-y-2">
            {dailyTasks.map((task, i) => (
              <button
                key={i}
                onClick={() => navigate(task.action)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-surface-2 border border-border/20 hover:border-primary/30 transition-colors text-left group"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                  {task.done && <span className="text-[10px] text-primary-foreground">✓</span>}
                </div>
                <span className={`text-sm flex-1 min-w-0 truncate ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Resumes", value: resumeCount, icon: FileText, color: "text-primary" },
            { label: "Job Matches", value: matchCount, icon: Target, color: "text-accent" },
            { label: "Optimized", value: optimizedResumes.length, icon: Sparkles, color: "text-warning" },
            { label: "Interviews", value: interviewCount, icon: BarChart3, color: "text-success" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(3 + i)} className={card}>
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Top Job Matches */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(7)} className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Top Matches
            </h2>
            {topMatches.length > 0 && (
              <Link to="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {topMatches.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">Upload resume to discover matches</p>
              <Button variant="hero-outline" size="sm" onClick={() => navigate("/jobs")}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Discover Jobs
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {topMatches.map((match) => (
                <Link key={match.id} to="/jobs" className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border/20 hover:border-primary/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{match.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{match.company} • {match.location}</p>
                  </div>
                  <span className={`text-sm font-bold ml-3 shrink-0 ${
                    (match.match_score ?? 0) >= 80 ? "text-success" :
                    (match.match_score ?? 0) >= 60 ? "text-warning" : "text-destructive"
                  }`}>{match.match_score}%</span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Optimized Resumes */}
        {optimizedResumes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(8)} className={card}>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" /> Optimized Resumes
            </h2>
            <div className="space-y-2">
              {optimizedResumes.slice(0, 3).map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{opt.job_title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{opt.job_company} • {new Date(opt.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate(`/resume-preview?id=${opt.id}`)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={delay(9)} className={card}>
            <h2 className="text-sm font-semibold mb-3">Your Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill.id} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {skill.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
