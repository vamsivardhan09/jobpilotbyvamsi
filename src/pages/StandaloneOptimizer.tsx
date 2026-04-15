import logoImg from "@/assets/jobpilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, FileText,
  Target, Zap, Tag, Lightbulb, ArrowUpRight, Briefcase, Upload,
  BarChart3, AlertTriangle, Key,
} from "lucide-react";

const StandaloneOptimizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [originalScore, setOriginalScore] = useState<number | null>(null);
  const [optimizedScore, setOptimizedScore] = useState<number | null>(null);

  // Load user's latest resume on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setResume(data[0]);
        }
        setResumeLoaded(true);
      });
  }, [user]);

  const handleOptimize = async () => {
    if (!resume?.raw_text || !user) return;
    if (jobDescription.trim().length < 20) {
      toast({ title: "Job description too short", description: "Please paste at least 20 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-resume", {
        body: {
          resumeText: resume.raw_text,
          jobTitle: "",
          jobCompany: "",
          jobDescription: jobDescription.trim(),
          requiredSkills: [],
          matchedSkills: [],
          missingSkills: [],
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Optimization failed");

      setResult(data.data);

      // Use AI's real scores
      setOriginalScore(Math.round(data.data.original_ats_score || 0));
      setOptimizedScore(Math.round(data.data.optimized_ats_score || 0));
      setAtsScore(Math.round(data.data.original_ats_score || 0));

      // Save to optimized_resumes
      const { data: insertedRow } = await supabase.from("optimized_resumes").insert({
        user_id: user.id,
        original_resume_id: resume.id,
        optimized_content: data.data,
        ats_keywords: data.data.ats_keywords || [],
      }).select("id").single();

      toast({ title: "Resume optimized!", description: "Your ATS-optimized resume is ready." });

      if (insertedRow?.id) {
        // Don't navigate away — show results inline, but store the ID
        setResult({ ...data.data, savedId: insertedRow.id });
      }
    } catch (err: any) {
      console.error("Optimize error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const impactColor = (impact: string) =>
    impact === "high" ? "text-success bg-success/10 border-success/20" :
    impact === "medium" ? "text-warning bg-warning/10 border-warning/20" :
    "text-muted-foreground bg-surface-2 border-border/50";

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success border-success/30 bg-success/10" :
    score >= 60 ? "text-warning border-warning/30 bg-warning/10" :
    "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Resume Optimization
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Paste a job description and we'll optimize your resume with ATS-friendly keywords — without changing your actual content.
          </p>
        </motion.div>

        {!resumeLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !resume ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-8 text-center">
            <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No resume found. Upload one first.</p>
            <Button variant="hero" onClick={() => navigate("/upload")}>Upload Resume</Button>
          </motion.div>
        ) : !result ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Resume info */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Using: {resume.file_name}</p>
                  <p className="text-xs text-muted-foreground">Your primary resume will be optimized</p>
                </div>
              </div>
            </div>

            {/* Job description input */}
            <div className="glass rounded-xl p-6">
            <label className="text-sm font-medium mb-3 block">
                Paste the Job Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Paste the full job description here... Include responsibilities, qualifications, and requirements for the best optimization."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] bg-surface-2 border-border/30 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {jobDescription.length} characters • Minimum 20 required
              </p>
            </div>

            {/* Optimize button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleOptimize}
              disabled={loading || jobDescription.trim().length < 20}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Optimize for ATS
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Mismatch Warning */}
            {result.is_good_match === false && (
              <div className="rounded-xl p-6 border-2 border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-bold text-destructive mb-1">Not a Strong Match</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.mismatch_reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">Consider applying to roles that better match your background, or significantly upskill in the required areas first.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ATS Scores — Original vs Optimized */}
            {originalScore !== null && optimizedScore !== null && (
              <div className="glass rounded-xl p-6">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-5 text-center">ATS Score Comparison</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Current Resume */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Your Current Resume</p>
                    <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-3xl font-black border-2 ${scoreColor(originalScore)}`}>
                      {originalScore}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Before optimization</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <ArrowUpRight className="w-8 h-8 text-success" />
                      <span className="text-success font-bold text-sm">+{optimizedScore - originalScore} pts</span>
                    </div>
                  </div>

                  {/* Optimized Resume */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Optimized Resume</p>
                    <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-3xl font-black border-2 ${scoreColor(optimizedScore)}`}>
                      {optimizedScore}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">After optimization</p>
                  </div>
                </div>

                {/* Score bar visualization */}
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Current</span>
                      <span>{originalScore}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${originalScore >= 60 ? 'bg-success' : originalScore >= 40 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${originalScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Optimized</span>
                      <span>{optimizedScore}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${optimizedScore >= 60 ? 'bg-success' : optimizedScore >= 40 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${optimizedScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Skills */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> Optimized Skills
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
                <Target className="w-4 h-4 text-success" /> ATS Keywords to Include
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.ats_keywords?.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">{kw}</span>
                ))}
              </div>
            </div>

            {/* Keywords to Add Manually */}
            {result.keywords_to_add_manually?.length > 0 && (
              <div className="glass rounded-xl p-6 border border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" /> Keywords to Add Manually Before Applying
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Add these exact keywords into your resume (in context) to boost your ATS score:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords_to_add_manually.map((kw: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 font-bold">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-warning" /> Tips
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
              {result.savedId && (
                <Button variant="hero" className="flex-1" onClick={() => navigate(`/resume-preview?id=${result.savedId}`)}>
                  <FileText className="w-4 h-4 mr-2" /> Preview & Download
                </Button>
              )}
              <Button variant="hero-outline" className="flex-1" onClick={() => { setResult(null); setAtsScore(null); setOriginalScore(null); setOptimizedScore(null); setJobDescription(""); }}>
                <Sparkles className="w-4 h-4 mr-2" /> Optimize Another
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

export default StandaloneOptimizer;
