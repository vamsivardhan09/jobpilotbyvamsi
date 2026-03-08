import logoImg from "@/assets/jobpilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, ArrowLeft, Loader2, Download, Eye,
  Palette, CheckCircle2,
} from "lucide-react";
import ResumeTemplate, { TEMPLATE_OPTIONS, TemplateName, ResumeData } from "@/components/resume-templates";
import { generateResumePDF, buildPDFFileName } from "@/lib/pdf-generator";
import { mapToResumeData } from "@/lib/resume-data-mapper";

const ResumePreview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const optimizedId = searchParams.get("id");
  const resumeRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [template, setTemplate] = useState<TemplateName>("modern-tech");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");

  useEffect(() => {
    if (!user || !optimizedId) return;
    const load = async () => {
      // Fetch optimized resume
      const { data: opt } = await supabase
        .from("optimized_resumes")
        .select("*")
        .eq("id", optimizedId)
        .eq("user_id", user.id)
        .single();

      if (!opt) {
        toast({ title: "Optimized resume not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Fetch job match info
      let jobData: any = null;
      if (opt.job_match_id) {
        const { data } = await supabase.from("job_matches").select("title, company").eq("id", opt.job_match_id).single();
        jobData = data;
      }
      setJobTitle(jobData?.title || "");
      setJobCompany(jobData?.company || "");

      // Fetch profile + original resume parsed data
      const [profileRes, resumeRes] = await Promise.all([
        supabase.from("profiles").select("full_name, headline").eq("user_id", user.id).single(),
        opt.original_resume_id
          ? supabase.from("resumes").select("parsed_data").eq("id", opt.original_resume_id).single()
          : Promise.resolve({ data: null }),
      ]);

      const mapped = mapToResumeData(
        opt.optimized_content,
        profileRes.data,
        resumeRes.data?.parsed_data
      );
      setResumeData(mapped);
      setLoading(false);
    };
    load();
  }, [user, optimizedId]);

  const handleDownload = async () => {
    if (!resumeRef.current || !resumeData) return;
    setDownloading(true);
    try {
      const fileName = buildPDFFileName(resumeData.fullName, jobTitle);
      await generateResumePDF(resumeRef.current, fileName);
      toast({ title: "PDF downloaded!", description: fileName });
    } catch (err: any) {
      console.error("PDF error:", err);
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Resume not found.</p>
        <Button variant="hero-outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header + Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Resume Preview
              </h1>
              {jobTitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  Optimized for <span className="text-foreground font-medium">{jobTitle}</span>
                  {jobCompany && <span> at {jobCompany}</span>}
                </p>
              )}
            </div>
            <Button
              variant="hero"
              size="lg"
              onClick={handleDownload}
              disabled={downloading}
              className="shrink-0"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Download PDF</>
              )}
            </Button>
          </div>

          {/* Template selector */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Choose Template</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    template === t.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/30 bg-surface-2 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {template === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Resume render area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-border/30 rounded-xl overflow-hidden shadow-lg"
        >
          <div ref={resumeRef}>
            <ResumeTemplate template={template} data={resumeData} />
          </div>
        </motion.div>

        {/* Bottom actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="hero" className="flex-1" onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="hero-outline" className="flex-1" onClick={() => navigate("/jobs")}>
            Back to Jobs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
