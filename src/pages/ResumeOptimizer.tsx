import logoImg from "@/assets/jobpilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, ArrowLeft, Loader2, Sparkles, CheckCircle2,
  ArrowUpRight, Lightbulb, Tag, Zap, FileText, Target,
} from "lucide-react";

const ResumeOptimizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobMatchId = searchParams.get("job");

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [jobMatch, setJobMatch] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!user || !jobMatchId) return;
    const load = async () => {
      const [jobRes, resumeRes] = await Promise.all([
        supabase.from("job_matches").select("*").eq("id", jobMatchId).eq("user_id", user.id).single(),
        supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      ]);
      setJobMatch(jobRes.data);
      setResume(resumeRes.data);
      setLoading(false);

      if (!jobRes.data) toast({ title: "Job not found", variant: "destructive" });
      if (!resumeRes.data) toast({ title: "No resume found", description: "Upload a resume first.", variant: "destructive" });
    };
    load();
  }, [user, jobMatchId]);

  const handleOptimize = async () => {
    if (!jobMatch || !resume?.raw_text || !user) return;
    setOptimizing(true);

    try {
      const { data, error } = await supabase.functions.invoke("optimize-resume", {
        body: {
          resumeText: resume.raw_text,
          jobTitle: jobMatch.title,
          jobCompany: jobMatch.company,
          jobDescription: jobMatch.description,
          requiredSkills: jobMatch.required_skills,
          matchedSkills: jobMatch.matched_skills,
          missingSkills: jobMatch.missing_skills,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Optimization failed");

      setResult(data.data);

      // Save to optimized_resumes
      const { data: insertedRow } = await supabase.from("optimized_resumes").insert({
        user_id: user.id,
        job_match_id: jobMatch.id,
        original_resume_id: resume.id,
        optimized_content: data.data,
        ats_keywords: data.data.ats_keywords || [],
      }).select("id").single();

      toast({ title: "Resume optimized!", description: "Your tailored resume is ready." });

      // Navigate to preview page
      if (insertedRow?.id) {
        navigate(`/resume-preview?id=${insertedRow.id}`);
        return;
      }
    } catch (err: any) {
      console.error("Optimize error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!jobMatch) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Job match not found.</p>
        <Button variant="hero-outline" onClick={() => navigate("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  const impactColor = (impact: string) =>
    impact === "high" ? "text-success bg-success/10 border-success/20" :
    impact === "medium" ? "text-warning bg-warning/10 border-warning/20" :
    "text-muted-foreground bg-surface-2 border-border/50";

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Job target card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Resume Optimizer</h1>
          <p className="text-sm text-muted-foreground mb-6">Tailor your resume for a specific job to maximize your match score.</p>

          <div className="glass rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Target Job</span>
                </div>
                <h2 className="font-semibold">{jobMatch.title}</h2>
                <p className="text-sm text-muted-foreground">{jobMatch.company} • {jobMatch.location}</p>
                {jobMatch.salary_range && <p className="text-xs text-muted-foreground mt-1">{jobMatch.salary_range}</p>}
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                (jobMatch.match_score ?? 0) >= 80 ? "bg-success/10 text-success border-success/20" :
                (jobMatch.match_score ?? 0) >= 60 ? "bg-warning/10 text-warning border-warning/20" :
                "bg-destructive/10 text-destructive border-destructive/20"
              }`}>{jobMatch.match_score}%</span>
            </div>

            {/* Skills gap */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {jobMatch.matched_skills?.map((s: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">✓ {s}</span>
              ))}
              {jobMatch.missing_skills?.map((s: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">✗ {s}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Optimize button */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {!resume ? (
              <div className="glass rounded-xl p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No resume found. Upload one first.</p>
                <Button variant="hero" onClick={() => navigate("/upload")}>Upload Resume</Button>
              </div>
            ) : optimizing ? (
              <div className="glass rounded-xl p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">Optimizing your resume...</h2>
                <p className="text-sm text-muted-foreground">AI is tailoring your resume for this specific role. This may take a moment.</p>
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">Ready to optimize</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Using your resume "{resume.file_name}" to create a tailored version for this role.
                </p>
                <Button variant="hero" size="lg" onClick={handleOptimize}>
                  <Sparkles className="w-4 h-4 mr-2" /> Optimize Resume
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Score improvement */}
            <div className="glass rounded-xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Resume Optimized</h2>
              <p className="text-sm text-muted-foreground">
                Estimated match improvement: <span className="text-success font-bold">+{result.match_improvement} points</span>
              </p>
            </div>

            {/* Optimized summary */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Optimized Summary
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.optimized_summary}</p>
            </div>

            {/* Key improvements */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" /> Key Improvements
              </h3>
              <div className="space-y-3">
                {result.improvements?.map((imp: any, i: number) => (
                  <div key={i} className="rounded-lg bg-surface-2 p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{imp.area}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${impactColor(imp.impact)}`}>
                        {imp.impact} impact
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground/60 block mb-1">Before</span>
                        <p className="text-muted-foreground">{imp.original}</p>
                      </div>
                      <div>
                        <span className="text-success/60 block mb-1">After</span>
                        <p className="text-foreground">{imp.optimized}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized experience */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" /> Optimized Experience
              </h3>
              <div className="space-y-5">
                {result.optimized_experience?.map((exp: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary/30 pl-4">
                    <p className="text-sm font-medium">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">{exp.company}{exp.duration ? ` • ${exp.duration}` : ""}</p>
                    <ul className="mt-2 space-y-1.5">
                      {exp.bullets?.map((b: string, j: number) => (
                        <li key={j} className="text-xs text-muted-foreground flex gap-2">
                          <ArrowUpRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills section */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> Optimized Skills Section
              </h3>
              <div className="space-y-3">
                {result.optimized_skills_section?.map((cat: any, i: number) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{cat.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills?.map((s: string, j: number) => (
                        <span key={j} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Keywords */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-success" /> ATS Keywords
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Include these keywords to pass ATS screening:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.ats_keywords?.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">{kw}</span>
                ))}
              </div>
            </div>

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-warning" /> Additional Tips
                </h3>
                <ul className="space-y-2">
                  {result.tips.map((tip: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-warning shrink-0">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="hero" className="flex-1" onClick={() => navigate("/jobs")}>
                Back to Jobs
              </Button>
              <Button variant="hero-outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizer;
