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
  CheckCircle2, XCircle, Loader2, Sparkles, ExternalLink, Filter, FileText,
  ChevronDown, AlertTriangle, Lightbulb, Globe,
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
  source?: string;
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
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(15);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [progressText, setProgressText] = useState("");

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
    setSuggestions([]);
    setVisibleCount(15);
    setProgressText("Searching job boards across India and globally...");

    try {
      // Delete old low-quality matches (score < 20) before new discovery
      await supabase.from("job_matches").delete().eq("user_id", user.id).lt("match_score", 20);

      setTimeout(() => setProgressText("Analyzing job listings with AI..."), 3000);
      setTimeout(() => setProgressText("Scoring matches against your skills..."), 6000);

      const { data, error } = await supabase.functions.invoke("discover-jobs", {
        body: {
          skills: skills.map((s) => ({ name: s.name, category: s.category, proficiency: s.proficiency })),
          experienceLevel: profile?.experience_level,
          preferredRoles: profile?.preferred_roles,
          location: locationFilter !== "all" ? locationFilter : (profile?.preferred_locations?.[0] || "India"),
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Discovery failed");

      const discovered: JobMatch[] = data.data;
      setTotalResults(data.total || discovered.length);

      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }

      if (discovered.length === 0) {
        toast({ title: "No matches found", description: "Try updating your resume with more relevant skills.", variant: "default" });
        setLoading(false);
        return;
      }

      setJobs(discovered);

      // Save to database — deduplicate by apply_url
      const existingUrls = new Set(savedJobs.map((j) => j.apply_url).filter(Boolean));
      const newJobs = discovered.filter((job) => !existingUrls.has(job.apply_url));

      if (newJobs.length > 0) {
        const rows = newJobs.map((job) => ({
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
      } else {
        // All jobs already saved, use discovered data
        setJobs(discovered);
      }

      toast({ title: "Jobs discovered!", description: `Found ${discovered.length} matching positions.` });
    } catch (err: any) {
      console.error("Discovery error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setProgressText("");
    }
  };

  const locationOptions = [
    { value: "all", label: "All Locations" },
    { value: "India", label: "India" },
    { value: "Remote", label: "Remote" },
    { value: "USA", label: "USA" },
    { value: "Bengaluru", label: "Bengaluru" },
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Mumbai", label: "Mumbai" },
    { value: "Delhi", label: "Delhi / NCR" },
    { value: "Pune", label: "Pune" },
    { value: "Chennai", label: "Chennai" },
  ];

  const allJobs = jobs.length > 0 ? jobs : savedJobs;
  const displayJobs = allJobs.filter((job) => {
    // Filter out low-quality aggregator pages (very low score with no matched skills)
    if ((job.match_score ?? 0) < 15 && (!job.matched_skills || job.matched_skills.length === 0)) return false;
    // Client-side aggregator title filtering
    const t = (job.title || "").toLowerCase();
    if (/^\d{3,}/.test(job.title || "")) return false; // Starts with large number like "77648..."
    if (/\bjobs?\s*(in|near|by|for|\d{4}|$)/i.test(t) && !/\bat\b/i.test(t)) return false; // "X Jobs in India" but not "X at Company"
    // Score filter
    if (filter === "high" && (job.match_score ?? 0) < 80) return false;
    if (filter === "medium" && ((job.match_score ?? 0) < 60 || (job.match_score ?? 0) >= 80)) return false;
    if (filter === "stretch" && (job.match_score ?? 0) >= 60) return false;
    // Location filter
    if (locationFilter !== "all") {
      const loc = (job.location || "").toLowerCase();
      const title = (job.title || "").toLowerCase();
      const desc = (job.description || "").toLowerCase();
      const term = locationFilter.toLowerCase();
      if (!loc.includes(term) && !title.includes(term) && !desc.includes(term)) return false;
    }
    return true;
  });

  const visibleJobs = displayJobs.slice(0, visibleCount);
  const hasMore = visibleCount < displayJobs.length;

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  const scoreBg = (score: number) =>
    score >= 80 ? "bg-success/10 border-success/20" : score >= 60 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20";

  const sourceIcon = (source?: string) => {
    if (!source) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
        <Globe className="w-2.5 h-2.5" />
        {source}
      </span>
    );
  };

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
            AI-powered job matching across LinkedIn, Indeed, Naukri & more — prioritizing India.
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
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Search className="w-3 h-3 animate-pulse" />
                  {progressText}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Suggestions when no results */}
        {suggestions.length > 0 && displayJobs.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-6 mb-8 border-warning/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-2">Suggestions to improve results</h3>
                <ul className="space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-warning shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        {allJobs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {/* Score filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {(["all", "high", "medium", "stretch"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setVisibleCount(15); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                    filter === f
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-secondary text-muted-foreground border-border/50 hover:border-primary/20"
                  }`}
                >
                  {f === "all" ? `All (${allJobs.length})` : f === "high" ? "High Match (80+)" : f === "medium" ? "Medium (60-79)" : "Stretch (<60)"}
                </button>
              ))}
            </div>

            {/* Location dropdown */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setVisibleCount(15); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-secondary text-foreground transition-colors hover:border-primary/20 focus:border-primary/30 focus:outline-none appearance-none cursor-pointer pr-7"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                {locationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Result count */}
            {locationFilter !== "all" && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {displayJobs.length} result{displayJobs.length !== 1 ? "s" : ""}
              </span>
            )}
          </motion.div>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Job list */}
          <div className={`space-y-3 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
            <AnimatePresence>
              {visibleJobs.length === 0 && !loading ? (
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
                visibleJobs.map((job, i) => (
                  <motion.div
                    key={job.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedJob(job)}
                    className={`glass rounded-xl p-4 cursor-pointer transition-all group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
                      selectedJob?.id === job.id ? "border-primary/50 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          )}
                          {job.salary_range && (
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_range}</span>
                          )}
                          {sourceIcon((job as any).source)}
                        </div>
                      </div>
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${scoreBg(job.match_score)}`}>
                        <span className={scoreColor(job.match_score)}>{job.match_score}%</span>
                      </div>
                    </div>
                    {/* Skill pills */}
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
                    {/* Apply button inline for quick access */}
                    {job.apply_url && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Apply Now
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleCount((prev) => prev + 15)}
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Load More ({displayJobs.length - visibleCount} remaining)
                </Button>
              </motion.div>
            )}
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
                {sourceIcon((selectedJob as any).source)}
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
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* URL validation warning */}
              {!selectedJob.apply_url && (
                <div className="flex items-center gap-2 text-xs text-warning mb-4 p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>No application link available for this position.</span>
                </div>
              )}

              <div className="flex gap-3">
                {selectedJob.apply_url && (
                  <Button variant="hero" className="flex-1" asChild>
                    <a href={selectedJob.apply_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Apply Now
                    </a>
                  </Button>
                )}
                {selectedJob.id && (
                  <Button variant="hero-outline" className="flex-1" asChild>
                    <Link to={`/optimize?job=${selectedJob.id}`}>
                      <FileText className="w-4 h-4 mr-2" /> Optimize Resume
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDiscovery;
