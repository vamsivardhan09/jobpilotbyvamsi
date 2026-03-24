import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertTriangle, Target,
  BarChart3, X,
} from "lucide-react";
import JSZip from "jszip";

interface ATSBreakdown {
  keyword_score: number;
  formatting_score: number;
  completeness_score: number;
  skills_score: number;
  experience_score: number;
  total: number;
  missing_keywords: string[];
  suggestions: string[];
  sections_found: string[];
  sections_missing: string[];
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Deterministic rule-based ATS scoring — NO AI calls needed
function calculateATSScore(text: string): ATSBreakdown {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const totalWords = words.length;

  // 1. Section completeness (20%)
  const sectionKeywords: Record<string, string[]> = {
    "Contact Info": ["email", "phone", "linkedin", "github", "@"],
    "Summary/Objective": ["summary", "objective", "professional summary", "about me", "profile"],
    "Experience": ["experience", "work history", "employment", "worked at", "responsibilities"],
    "Education": ["education", "degree", "university", "bachelor", "master", "b.tech", "b.e", "mca", "bca"],
    "Skills": ["skills", "technical skills", "technologies", "proficient", "expertise"],
    "Projects": ["projects", "project", "developed", "built", "implemented"],
  };
  const sectionsFound: string[] = [];
  const sectionsMissing: string[] = [];
  for (const [section, kws] of Object.entries(sectionKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) sectionsFound.push(section);
    else sectionsMissing.push(section);
  }
  const completenessScore = Math.round((sectionsFound.length / Object.keys(sectionKeywords).length) * 100);

  // 2. Keyword density (30%) — common ATS keywords
  const atsKeywords = [
    "managed", "developed", "designed", "implemented", "led", "created",
    "improved", "optimized", "collaborated", "delivered", "analyzed",
    "built", "deployed", "maintained", "architected", "mentored",
    "agile", "scrum", "ci/cd", "rest api", "microservices",
    "javascript", "typescript", "python", "react", "node.js",
    "sql", "aws", "docker", "git", "linux",
  ];
  const foundKeywords = atsKeywords.filter((kw) => lower.includes(kw));
  const missingKeywords = atsKeywords
    .filter((kw) => !lower.includes(kw))
    .filter((kw) => ["managed", "developed", "implemented", "collaborated", "deployed", "agile", "ci/cd", "rest api"].includes(kw));
  const keywordScore = Math.min(100, Math.round((foundKeywords.length / 12) * 100));

  // 3. Formatting (20%) — measurable heuristics
  let formatScore = 100;
  if (totalWords < 150) formatScore -= 30; // Too short
  if (totalWords > 2000) formatScore -= 15; // Too long
  if (!/\d{4}/.test(text)) formatScore -= 15; // No years/dates
  if (text.split("\n").filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("·")).length < 3) formatScore -= 20; // No bullet points
  if (!/[A-Z][a-z]/.test(text)) formatScore -= 10; // No proper capitalization
  formatScore = Math.max(0, Math.min(100, formatScore));

  // 4. Skills relevance (15%)
  const techSkills = [
    "javascript", "typescript", "python", "java", "c++", "react", "angular", "vue",
    "node.js", "express", "django", "flask", "spring", "sql", "nosql", "mongodb",
    "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes", "git",
    "html", "css", "tailwind", "next.js", "graphql", "redis",
  ];
  const foundSkills = techSkills.filter((s) => lower.includes(s));
  const skillsScore = Math.min(100, Math.round((foundSkills.length / 8) * 100));

  // 5. Experience clarity (15%)
  let experienceScore = 50; // baseline
  const hasQuantified = /\d+%|\$\d|saved|increased|reduced|improved by/i.test(text);
  if (hasQuantified) experienceScore += 25;
  const hasActionVerbs = ["led", "managed", "developed", "created", "built", "designed"].filter((v) => lower.includes(v)).length;
  experienceScore += Math.min(25, hasActionVerbs * 5);
  experienceScore = Math.min(100, experienceScore);

  // Weighted total
  const total = Math.round(
    keywordScore * 0.3 +
    formatScore * 0.2 +
    completenessScore * 0.2 +
    skillsScore * 0.15 +
    experienceScore * 0.15
  );

  // Suggestions
  const suggestions: string[] = [];
  if (sectionsMissing.length > 0) suggestions.push(`Add missing sections: ${sectionsMissing.join(", ")}`);
  if (!hasQuantified) suggestions.push("Add quantified achievements (e.g., 'increased performance by 30%')");
  if (foundSkills.length < 5) suggestions.push("Add more relevant technical skills");
  if (missingKeywords.length > 3) suggestions.push("Use more action verbs like 'developed', 'implemented', 'deployed'");
  if (totalWords < 200) suggestions.push("Resume seems too short — aim for 400-800 words");
  if (text.split("\n").filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-")).length < 5) {
    suggestions.push("Use more bullet points to describe your experience");
  }

  return {
    keyword_score: keywordScore,
    formatting_score: formatScore,
    completeness_score: completenessScore,
    skills_score: skillsScore,
    experience_score: experienceScore,
    total: Math.min(100, Math.max(0, total)),
    missing_keywords: missingKeywords.slice(0, 10),
    suggestions,
    sections_found: sectionsFound,
    sections_missing: sectionsMissing,
  };
}

async function readFileAsText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = "";
    for (let i = 0; i < uint8Array.length - 1; i++) {
      if (uint8Array[i] === 0x28) {
        let str = "";
        let j = i + 1;
        while (j < uint8Array.length && uint8Array[j] !== 0x29) {
          str += String.fromCharCode(uint8Array[j]);
          j++;
        }
        if (str.length > 1 && /[a-zA-Z]/.test(str)) text += str + " ";
        i = j;
      }
    }
    return text || file.text();
  }
  if (file.name.endsWith(".docx")) {
    const zip = await JSZip.loadAsync(file);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";
    return docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return file.text();
}

export function ATSScoreChecker({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSBreakdown | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.endsWith(".docx") && !f.name.endsWith(".pdf")) {
      toast({ title: "Unsupported format", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
  }, [toast]);

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const text = await readFileAsText(file);
      if (text.trim().length < 50) {
        toast({ title: "Could not extract text", description: "The file may be image-based. Try a text-based PDF.", variant: "destructive" });
        setAnalyzing(false);
        return;
      }
      // Deterministic scoring — no API call
      const score = calculateATSScore(text);
      setResult(score);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive";
  const scoreBg = (s: number) =>
    s >= 80 ? "bg-success/10 border-success/30" : s >= 60 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> ATS Score Checker
          </DialogTitle>
          <DialogDescription>
            Upload your resume to get an instant ATS compatibility score with detailed breakdown.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 pt-2">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragActive ? "border-primary bg-primary/5" : file ? "border-success/50 bg-success/5" : "border-border hover:border-primary/30"
              }`}
              onClick={() => document.getElementById("ats-file-input")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-success" />
                  <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop your resume here or click to browse</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PDF or DOCX • Max 10MB</p>
                </>
              )}
              <input id="ats-file-input" type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <Button variant="hero" className="w-full" onClick={analyze} disabled={!file || analyzing}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><BarChart3 className="w-4 h-4 mr-2" /> Check ATS Score</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Total score */}
            <div className={`rounded-xl p-6 text-center border-2 ${scoreBg(result.total)}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">ATS Compatibility Score</p>
              <p className={`text-5xl font-black ${scoreColor(result.total)}`}>{result.total}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {result.total >= 80 ? "Excellent — your resume is ATS-friendly!" : result.total >= 60 ? "Good — some improvements recommended." : "Needs work — follow suggestions below."}
              </p>
            </div>

            {/* Section breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Score Breakdown</h4>
              {[
                { label: "Keyword Match", score: result.keyword_score, weight: "30%" },
                { label: "Formatting", score: result.formatting_score, weight: "20%" },
                { label: "Section Completeness", score: result.completeness_score, weight: "20%" },
                { label: "Skills Relevance", score: result.skills_score, weight: "15%" },
                { label: "Experience Clarity", score: result.experience_score, weight: "15%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label} <span className="text-muted-foreground/50">({item.weight})</span></span>
                    <span className={`font-bold ${scoreColor(item.score)}`}>{item.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${item.score >= 80 ? "bg-success" : item.score >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Sections found/missing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-success mb-2">Sections Found</h4>
                <div className="space-y-1">
                  {result.sections_found.map((s) => (
                    <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-success" /> {s}
                    </div>
                  ))}
                </div>
              </div>
              {result.sections_missing.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-destructive mb-2">Missing Sections</h4>
                  <div className="space-y-1">
                    {result.sections_missing.map((s) => (
                      <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3 text-destructive" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Missing keywords */}
            {result.missing_keywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2">Missing ATS Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2">Improvement Suggestions</h4>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <Target className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="hero-outline" className="flex-1" onClick={reset}>
                Check Another
              </Button>
              <Button variant="hero" className="flex-1" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
