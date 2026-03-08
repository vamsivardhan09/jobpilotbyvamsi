import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback } from "react";
import JSZip from "jszip";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Upload, FileText, X, CheckCircle2, Loader2,
  ArrowLeft, Brain, AlertTriangle
} from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ResumeUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Only PDF and DOCX files are supported.";
    if (f.size > MAX_SIZE) return "File must be under 10MB.";
    return null;
  };

  const handleFile = (f: File) => {
    const error = validateFile(f);
    if (error) {
      toast({ title: "Invalid file", description: error, variant: "destructive" });
      return;
    }
    setFile(f);
    setAnalysisResult(null);
    setStep("upload");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file || !user) return;
    setUploading(true);
    setStep("analyzing");

    try {
      // 1. Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 2. Read file as text for AI analysis
      const text = await readFileAsText(file);

      if (!text || text.trim().length < 20) {
        throw new Error("Could not extract text from file. Please try a different file.");
      }

      setUploading(false);
      setAnalyzing(true);

      // 3. Call AI analysis
      const { data: analysisData, error: fnError } = await supabase.functions.invoke(
        "analyze-resume",
        { body: { resumeText: text } }
      );

      if (fnError) throw new Error(fnError.message);
      if (!analysisData?.success) throw new Error(analysisData?.error || "Analysis failed");

      const result = analysisData.data;
      setAnalysisResult(result);

      // 4. Save resume record
      const { data: resumeRecord, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: filePath,
          raw_text: text.substring(0, 50000),
          parsed_data: result,
          is_primary: true,
        })
        .select()
        .single();

      if (dbError) console.error("DB save error:", dbError);

      // 5. Save skills
      if (result.skills?.length && resumeRecord) {
        const skillRows = result.skills.map((s: any) => ({
          user_id: user.id,
          resume_id: resumeRecord.id,
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
        }));

        await supabase.from("skills").insert(skillRows);
      }

      // 6. Update profile
      if (result.full_name || result.headline || result.experience_level || result.preferred_roles) {
        await supabase
          .from("profiles")
          .update({
            full_name: result.full_name || undefined,
            headline: result.headline || undefined,
            experience_level: result.experience_level || undefined,
            preferred_roles: result.preferred_roles || undefined,
          })
          .eq("user_id", user.id);
      }

      setStep("results");
      toast({ title: "Resume analyzed!", description: `Found ${result.skills?.length || 0} skills.` });
    } catch (error: any) {
      console.error("Upload/analyze error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setStep("upload");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            JobMind
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-2">Upload Resume</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Upload your PDF or DOCX resume and our AI will extract your skills and experience.
          </p>
        </motion.div>

        {step === "upload" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 hover:border-primary/30 hover:bg-surface-2"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={onFileChange}
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Click to change
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-destructive hover:underline flex items-center gap-1 mt-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-2 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Drop your resume here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF or DOCX • Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                <Button variant="hero" className="w-full h-12 text-base" onClick={handleUploadAndAnalyze}>
                  <Brain className="w-5 h-5 mr-2" /> Analyze Resume with AI
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === "analyzing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {uploading ? "Uploading resume..." : "AI is analyzing your resume..."}
            </h2>
            <p className="text-sm text-muted-foreground">
              {uploading
                ? "Securely storing your file."
                : "Extracting skills, experience, and career insights. This may take a moment."}
            </p>
          </motion.div>
        )}

        {step === "results" && analysisResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success header */}
            <div className="glass rounded-xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Resume Analyzed Successfully</h2>
              <p className="text-sm text-muted-foreground">
                Found {analysisResult.skills?.length || 0} skills and {analysisResult.work_history?.length || 0} work experiences.
              </p>
            </div>

            {/* Profile summary */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-3">Profile Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{analysisResult.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Headline</span>
                  <span className="font-medium">{analysisResult.headline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium capitalize">{analysisResult.experience_level}</span>
                </div>
                {analysisResult.years_of_experience && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium">{analysisResult.years_of_experience} years</span>
                  </div>
                )}
              </div>
              {analysisResult.experience_summary && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{analysisResult.experience_summary}</p>
              )}
            </div>

            {/* Skills */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-3">Extracted Skills ({analysisResult.skills?.length})</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.skills?.map((skill: any, i: number) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      skill.proficiency === "expert"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : skill.proficiency === "advanced"
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-surface-2 text-muted-foreground border-border/50"
                    }`}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred roles */}
            {analysisResult.preferred_roles?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Recommended Roles</h3>
                <div className="space-y-2">
                  {analysisResult.preferred_roles.map((role: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work history */}
            {analysisResult.work_history?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-3">Work History</h3>
                <div className="space-y-4">
                  {analysisResult.work_history.map((job: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company} {job.duration ? `• ${job.duration}` : ""}</p>
                      {job.highlights?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {job.highlights.slice(0, 3).map((h: string, j: number) => (
                            <li key={j} className="text-xs text-muted-foreground">• {h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="hero-outline" className="flex-1" onClick={() => { setFile(null); setAnalysisResult(null); setStep("upload"); }}>
                Upload Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Simple text extraction from file
async function readFileAsText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    // For PDF, we read as array buffer and extract text patterns
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = "";

    // Extract readable text from PDF binary
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(bytes);

    // Extract text between parentheses (PDF text objects)
    const textMatches = rawText.match(/\(([^)]+)\)/g);
    if (textMatches) {
      text = textMatches
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 1 && /[a-zA-Z]/.test(t))
        .join(" ");
    }

    // Also try BT/ET blocks
    const btMatches = rawText.match(/BT[\s\S]*?ET/g);
    if (btMatches) {
      for (const block of btMatches) {
        const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g);
        if (tjMatches) {
          text += " " + tjMatches.map((m) => m.replace(/\)\s*Tj/, "").replace(/\(/, "")).join(" ");
        }
      }
    }

    return text.replace(/\s+/g, " ").trim();
  }

  // For DOCX, extract from XML
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(new Uint8Array(buffer));

    // Extract text content from XML tags
    const textParts: string[] = [];
    const tagRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = tagRegex.exec(rawText)) !== null) {
      textParts.push(match[1]);
    }

    return textParts.join(" ").replace(/\s+/g, " ").trim();
  }

  // Fallback: read as text
  return await file.text();
}

export default ResumeUpload;
