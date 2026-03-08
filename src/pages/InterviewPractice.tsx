import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, History, FileText, CheckCircle2, Loader2, Upload,
  Code, Briefcase, GraduationCap, Sparkles, ArrowRight, X
} from "lucide-react";
import InterviewHistory from "@/components/interview/InterviewHistory";

export default function InterviewPractice() {
  const [step, setStep] = useState<"upload" | "analyzing" | "ready" | "history">("upload");
  const [resume, setResume] = useState<any>(null);
  const [parsedInfo, setParsedInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for existing resume
  useEffect(() => {
    if (!user) return;
    supabase.from("resumes").select("id, file_name, parsed_data, raw_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0 && data[0].parsed_data) {
          setResume(data[0]);
          setParsedInfo(data[0].parsed_data);
          setStep("ready");
        }
        setLoading(false);
      });
  }, [user]);

  const handleFile = useCallback(async (file: File) => {
    if (!user) return;
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a PDF or DOCX file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 10MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    setStep("analyzing");

    try {
      // Extract text
      const text = await readFileAsText(file);
      if (text.length < 50) throw new Error("Could not extract enough text from resume");

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("resumes").upload(filePath, file);

      // Analyze with AI
      const { data: analysis, error: aiError } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeText: text },
      });
      if (aiError) throw aiError;

      const parsed = analysis?.data || {};

      // Save to DB
      const { data: resumeRow } = await supabase.from("resumes").insert({
        user_id: user.id,
        file_name: file.name,
        file_url: filePath,
        raw_text: text,
        parsed_data: parsed,
        is_primary: true,
      }).select("id, file_name, parsed_data, raw_text").single();

      if (resumeRow) {
        setResume(resumeRow);
        setParsedInfo(parsed);
        setStep("ready");
        toast({ title: "Resume analyzed!", description: "Ready to start your mock interview" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to analyze resume", variant: "destructive" });
      setStep("upload");
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const handleStartInterview = async () => {
    if (!user || !resume) return;

    // Build resume context
    let resumeContext = "";
    const pd = parsedInfo || resume.parsed_data;
    if (pd) {
      const name = pd.full_name || pd.name || "";
      const skills = pd.skills?.map((s: any) => typeof s === "string" ? s : s.name).join(", ");
      const experience = pd.experience?.map((e: any) =>
        `${e.title || e.role || ""} at ${e.company || ""}${e.duration ? ` (${e.duration})` : ""}`
      ).join("; ");
      const projects = pd.projects?.map((p: any) =>
        `${p.name || p.title || ""}: ${p.description || ""}`
      ).join("; ");
      const education = pd.education?.map((e: any) =>
        `${e.degree || ""} from ${e.institution || e.school || ""}`
      ).join("; ");
      resumeContext = `Name: ${name}. Skills: ${skills || "N/A"}. Experience: ${experience || "N/A"}. Projects: ${projects || "N/A"}. Education: ${education || "N/A"}.`;
    } else if (resume.raw_text) {
      resumeContext = resume.raw_text.substring(0, 1000);
    }

    const { data, error } = await supabase.from("interview_sessions").insert({
      user_id: user.id,
      interview_type: "comprehensive",
      job_role: pd?.experience?.[0]?.title || "Software Engineer",
      status: "in_progress",
    }).select("id").single();

    if (error || !data) {
      toast({ title: "Error", description: "Failed to start interview", variant: "destructive" });
      return;
    }
    navigate(`/interview/${data.id}`, { state: { resumeContext, parsedInfo: pd } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mic className="w-6 h-6 text-primary" /> Mock Interview
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Practice with an AI interviewer that reads your resume</p>
            </div>
            <Button
              variant={step === "history" ? "default" : "outline"}
              size="sm"
              onClick={() => setStep(step === "history" ? (parsedInfo ? "ready" : "upload") : "history")}
            >
              <History className="w-4 h-4 mr-1" />
              {step === "history" ? "New Interview" : "History"}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "history" ? (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <InterviewHistory />
            </motion.div>

          ) : step === "upload" ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card
                className={`p-12 text-center border-2 border-dashed transition-all cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => document.getElementById("resume-input")?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-semibold text-lg mb-2">Upload Your Resume</h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Drop your PDF or DOCX resume here, or click to browse. The AI will analyze it and conduct a personalized mock interview.
                </p>
                <p className="text-xs text-muted-foreground">PDF or DOCX • Max 10MB</p>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </Card>
            </motion.div>

          ) : step === "analyzing" ? (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="p-12 text-center border-border/30">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <h2 className="font-semibold text-lg mb-2">Analyzing Your Resume</h2>
                <p className="text-sm text-muted-foreground">Extracting skills, projects, and experience...</p>
              </Card>
            </motion.div>

          ) : step === "ready" ? (
            <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Success card */}
              <Card className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg mb-1">Resume Analyzed Successfully</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {resume?.file_name} — AI will personalize questions based on your background
                    </p>

                    {/* Extracted info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {parsedInfo?.skills && parsedInfo.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Code className="w-3 h-3" /> Skills & Technologies
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(parsedInfo.skills as any[]).slice(0, 12).map((s: any, i: number) => (
                              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {typeof s === "string" ? s : s.name}
                              </span>
                            ))}
                            {parsedInfo.skills.length > 12 && (
                              <span className="text-xs text-muted-foreground">+{parsedInfo.skills.length - 12} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {parsedInfo?.experience && parsedInfo.experience.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Experience
                          </p>
                          <div className="space-y-1">
                            {(parsedInfo.experience as any[]).slice(0, 3).map((e: any, i: number) => (
                              <p key={i} className="text-xs text-foreground">
                                {e.title || e.role} {e.company ? `at ${e.company}` : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedInfo?.projects && parsedInfo.projects.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Projects
                          </p>
                          <div className="space-y-1">
                            {(parsedInfo.projects as any[]).slice(0, 3).map((p: any, i: number) => (
                              <p key={i} className="text-xs text-foreground">{p.name || p.title}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedInfo?.education && parsedInfo.education.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Education
                          </p>
                          <div className="space-y-1">
                            {(parsedInfo.education as any[]).slice(0, 2).map((e: any, i: number) => (
                              <p key={i} className="text-xs text-foreground">
                                {e.degree} {e.institution || e.school ? `— ${e.institution || e.school}` : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Change resume */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => { setResume(null); setParsedInfo(null); setStep("upload"); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Start button */}
              <Button
                variant="hero"
                size="lg"
                className="w-full h-16 text-lg rounded-xl"
                onClick={handleStartInterview}
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Live Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                The AI will greet you by name and ask questions based on your resume. Speak naturally — no buttons needed.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

async function readFileAsText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = "";
    let inText = false;
    let paren = 0;
    for (let i = 0; i < bytes.length; i++) {
      const ch = String.fromCharCode(bytes[i]);
      if (!inText && ch === "(") { inText = true; paren = 1; continue; }
      if (inText) {
        if (ch === "(") paren++;
        else if (ch === ")") { paren--; if (paren === 0) { inText = false; text += " "; continue; } }
        else if (ch === "\\") { i++; continue; }
        text += ch;
      }
    }
    return text.replace(/\s+/g, " ").trim();
  }

  if (file.name.endsWith(".docx")) {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(file);
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return "";
    return docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  return file.text();
}
