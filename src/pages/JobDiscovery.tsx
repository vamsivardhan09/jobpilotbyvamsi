import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, ArrowLeft, Search, Target, MapPin, DollarSign,
  CheckCircle2, XCircle, Loader2, Sparkles, ExternalLink, Filter,
} from "lucide-react";

type JobMatch = {
  id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_range?: string;
  match_score: number;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  apply_url?: string;
  status?: string;
};

const JobDiscovery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "stretch">("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [skillsRes, profileRes, matchesRes] = await Promise.all([
        supabase.from("skills").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("job_matches").select("*").eq("user_id", user.id).order("match_score", { ascending: false }),
      ]);
      setSkills(skillsRes.data ?? []);
      setProfile(profileRes.data);
      setSavedJobs(matchesRes.data ?? []);
      setInitialLoading(false);
    };
    load();
  }, [user]);

  const discoverJobs = async () => {
    if (!user || skills.length === 0) {
      toast({ title: "No skills found", description: "Upload a resume first to extract your skills.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setJobs([]);
    setSelectedJob(null);

    try {
      const { data, error } = await supabase.functions.invoke("discover-jobs", {
        body: {
          skills: skills.map((s) => ({ name: s.name, category: s.category, proficiency: s.proficiency })),
          experienceLevel: profile?.experience_level,
          preferredRoles: profile?.preferred_roles,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Discovery failed");

      const discovered: JobMatch[] = data.data;
      setJobs(discovered);

      // Save to database
      const rows = discovered.map((job) => ({
        user_id: user.id,
        title: job.title,
        company: job.company || null,
        location: job.location || null,
        description: job.description || null,
        salary_range: job.salary_range || null,
        match_score: job.match_score,
        required_skills: job.required_skills || [],
        matched_skills: job.matched_skills || [],
        missing_skills: job.missing_skills || [],
        apply_url: job.apply_url || null,
        status: "new",
      }));

      const { data: insertedJobs, error: dbError } = await supabase.from("job_matches").insert(rows).select();
      if (dbError) console.error("DB save error:", dbError);
      if (insertedJobs) {
        setSavedJobs((prev) => [...insertedJobs, ...prev]);
        setJobs(insertedJobs);
      }

      toast({ title: "Jobs discovered!", description: `Found ${discovered.length} matching positions.` });
    } catch (err: any) {
      console.error("Discovery error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const displayJobs = (jobs.length > 0 ? jobs : savedJobs).filter((job) => {
    if (filter === "high") return (job.match_score ?? 0) >= 80;
    if (filter === "medium") return (job.match_score ?? 0) >= 60 && (job.match_score ?? 0) < 80;
    if (filter === "stretch") return (job.match_score ?? 0) < 60;
    return true;
  });

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  const scoreBg = (score: number) =>
    score >= 80 ? "bg-success/10 border-success/20" : score >= 60 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20";

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            JobMind
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Job Discovery</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered job matching based on your {skills.length} extracted skills.
          </p>
        </motion.div>

        {/* Discover button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="glass rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold mb-1">Find New Matches</h2>
                <p className="text-xs text-muted-foreground">
                  {skills.length > 0
                    ? `Using ${skills.length} skills: ${skills.slice(0, 5).map((s) => s.name).join(", ")}${skills.length > 5 ? "..." : ""}`
                    : "Upload a resume first to extract skills."}
                </p>
              </div>
              <Button
                variant="hero"
                onClick={discoverJobs}
                disabled={loading || skills.length === 0}
                className="shrink-0"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Discovering...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Discover Jobs</>
                )}
              </Button>
            </div>
            {loading && (
              <div className="mt-4">
                <Progress value={undefined} className="h-1" />
                <p className="text-xs text-muted-foreground mt-2">AI is analyzing your profile and finding matching positions...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        {displayJobs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {(["all", "high", "medium", "stretch"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  filter === f
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface-2 text-muted-foreground border-border/50 hover:border-primary/20"
                }`}
              >
                {f === "all" ? "All" : f === "high" ? "High Match (80+)" : f === "medium" ? "Medium (60-79)" : "Stretch (<60)"}
              </button>
            ))}
          </motion.div>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Job list */}
          <div className={`space-y-3 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
            <AnimatePresence>
              {displayJobs.length === 0 && !loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-10 text-center">
                  <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {savedJobs.length === 0 ? "No job matches yet" : "No jobs match this filter"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {savedJobs.length === 0 ? "Click 'Discover Jobs' to find positions matching your skills." : "Try a different filter."}
                  </p>
                </motion.div>
              ) : (
                displayJobs.map((job, i) => (
                  <motion.div
                    key={job.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedJob(job)}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30 ${
                      selectedJob?.id === job.id ? "border-primary/50 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          )}
                          {job.salary_range && (
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_range}</span>
                          )}
                        </div>
                      </div>
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${scoreBg(job.match_score)}`}>
                        <span className={scoreColor(job.match_score)}>{job.match_score}%</span>
                      </div>
                    </div>
                    {/* Skill pills - compact */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.matched_skills?.slice(0, 4).map((s, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                          {s}
                        </span>
                      ))}
                      {(job.matched_skills?.length ?? 0) > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] text-muted-foreground">
                          +{(job.matched_skills?.length ?? 0) - 4} more
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Detail panel */}
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 glass rounded-xl p-6 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold">{selectedJob.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${scoreBg(selectedJob.match_score)}`}>
                  <span className={scoreColor(selectedJob.match_score)}>{selectedJob.match_score}% match</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-5 text-xs text-muted-foreground">
                {selectedJob.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedJob.location}</span>
                )}
                {selectedJob.salary_range && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{selectedJob.salary_range}</span>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{selectedJob.description}</p>

              {/* Matched skills */}
              {selectedJob.matched_skills?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills You Have</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.matched_skills.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {selectedJob.missing_skills?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills to Learn</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.missing_skills.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        <XCircle className="w-3 h-3" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required skills */}
              {selectedJob.required_skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.required_skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 text-muted-foreground border border-border/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.apply_url && (
                <Button variant="hero" className="w-full" asChild>
                  <a href={selectedJob.apply_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" /> Apply Now
                  </a>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDiscovery;
