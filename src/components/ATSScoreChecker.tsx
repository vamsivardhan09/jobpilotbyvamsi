import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  matched_keywords: string[];
  suggestions: string[];
  sections_found: string[];
  sections_missing: string[];
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Extract keywords from a job description
function extractJDKeywords(jd: string): string[] {
  const lower = jd.toLowerCase();
  const words = lower.split(/[\s,;|/()]+/).filter(w => w.length > 2);
  
  // Common tech terms and action verbs to look for
  const techTerms = [
    "javascript", "typescript", "python", "java", "c++", "c#", "react", "angular", "vue",
    "node.js", "nodejs", "express", "django", "flask", "spring", "sql", "nosql", "mongodb",
    "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes", "git",
    "html", "css", "tailwind", "next.js", "nextjs", "graphql", "redis", "figma",
    "machine learning", "data analysis", "tableau", "power bi", "excel",
    "agile", "scrum", "ci/cd", "cicd", "rest", "api", "microservices",
    "linux", "terraform", "jenkins", "jira", "confluence",
    "communication", "leadership", "problem solving", "teamwork", "collaboration",
    "project management", "product management", "devops", "fullstack", "full-stack",
    "frontend", "front-end", "backend", "back-end", "mobile", "ios", "android",
    "flutter", "react native", "swift", "kotlin", "go", "golang", "rust",
    "spark", "hadoop", "kafka", "elasticsearch", "nginx",
    "figma", "sketch", "photoshop", "illustrator",
    "salesforce", "sap", "oracle", "power bi", "looker",
  ];
  
  // Multi-word terms first
  const multiWord = [
    "machine learning", "data analysis", "power bi", "problem solving",
    "project management", "product management", "react native", "full-stack",
    "front-end", "back-end", "ci/cd", "rest api", "node.js", "next.js",
  ];
  
  const found = new Set<string>();
  
  for (const term of multiWord) {
    if (lower.includes(term)) found.add(term);
  }
  
  for (const term of techTerms) {
    if (!term.includes(" ") && lower.includes(term)) found.add(term);
  }
  
  // Also extract unique meaningful words from JD that appear frequently
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["the", "and", "for", "with", "you", "will", "are", "have", "this", "that", "from", "our", "your", "they", "what", "about", "would", "been", "should", "could", "their", "which", "each", "other", "into", "more", "some", "such", "than", "them", "then", "these", "those", "very", "also", "just", "being", "over", "both", "between", "after", "before", "during", "work", "working", "experience", "years", "year", "role", "position", "job", "company", "team", "ability", "skills", "skill", "required", "preferred", "strong", "knowledge", "understanding", "must", "including", "etc", "minimum", "plus"]);
  
  for (const w of words) {
    if (w.length > 3 && !stopWords.has(w) && /^[a-z]/.test(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }
  
  // Add high-frequency JD-specific words
  for (const [word, count] of Object.entries(wordFreq)) {
    if (count >= 2 && !found.has(word)) found.add(word);
  }
  
  return Array.from(found);
}

// Deterministic rule-based ATS scoring
function calculateATSScore(text: string, jdText?: string): ATSBreakdown {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Extract JD keywords if provided
  const jdKeywords = jdText ? extractJDKeywords(jdText) : [];
  const hasJD = jdKeywords.length > 0;

  // 1. Section completeness (10%)
  const sectionKeywords: Record<string, string[]> = {
    "Contact Info": ["email", "phone", "linkedin", "github", "@", "contact"],
    "Summary/Objective": ["summary", "objective", "professional summary", "about me", "profile", "career objective"],
    "Experience": ["experience", "work history", "employment", "worked at", "responsibilities", "work experience", "professional experience"],
    "Education": ["education", "degree", "university", "bachelor", "master", "b.tech", "b.e", "mca", "bca", "college", "school", "diploma"],
    "Skills": ["skills", "technical skills", "technologies", "proficient", "expertise", "competencies", "tools"],
    "Projects": ["projects", "project", "portfolio", "case study"],
  };
  const sectionsFound: string[] = [];
  const sectionsMissing: string[] = [];
  for (const [section, kws] of Object.entries(sectionKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) sectionsFound.push(section);
    else sectionsMissing.push(section);
  }
  const completenessScore = Math.round((sectionsFound.length / Object.keys(sectionKeywords).length) * 100);

  // 2. Keyword match (50% if JD provided, 30% otherwise)
  let keywordScore = 0;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];

  if (hasJD) {
    // Match JD keywords against resume
    for (const kw of jdKeywords) {
      if (lower.includes(kw)) matchedKeywords.push(kw);
      else missingKeywords.push(kw);
    }
    keywordScore = jdKeywords.length > 0
      ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
      : 50;
  } else {
    // Generic ATS keywords
    const atsKeywords = [
      "managed", "developed", "designed", "implemented", "led", "created",
      "improved", "optimized", "collaborated", "delivered", "analyzed",
      "built", "deployed", "maintained", "architected", "mentored",
      "agile", "scrum", "ci/cd", "rest api", "microservices",
      "javascript", "typescript", "python", "react", "node.js",
      "sql", "aws", "docker", "git", "linux", "java", "html", "css",
    ];
    matchedKeywords = atsKeywords.filter((kw) => lower.includes(kw));
    missingKeywords = ["managed", "developed", "implemented", "collaborated", "deployed",
      "agile", "ci/cd", "rest api", "led", "designed"].filter((kw) => !lower.includes(kw));
    keywordScore = Math.min(100, Math.round((matchedKeywords.length / 10) * 100));
  }

  // 3. Skills match (20%)
  let skillsScore = 0;
  if (hasJD) {
    // Skills = tech terms from JD found in resume
    const techInJD = jdKeywords.filter(kw => 
      ["javascript", "typescript", "python", "java", "react", "angular", "vue", "node.js",
       "sql", "aws", "docker", "kubernetes", "git", "html", "css", "mongodb", "postgresql",
       "redis", "graphql", "flutter", "swift", "kotlin", "go", "rust", "terraform",
       "machine learning", "data analysis", "figma", "power bi", "tableau",
       "c++", "c#", "django", "flask", "spring", "express", "next.js", "tailwind",
       "azure", "gcp", "linux", "elasticsearch", "kafka", "jenkins",
      ].includes(kw)
    );
    if (techInJD.length === 0) {
      skillsScore = 60; // No specific tech skills in JD
    } else {
      const matched = techInJD.filter(s => lower.includes(s));
      skillsScore = Math.round((matched.length / techInJD.length) * 100);
    }
  } else {
    const techSkills = [
      "javascript", "typescript", "python", "java", "c++", "c#", "react", "angular", "vue",
      "node.js", "express", "django", "flask", "spring", "sql", "nosql", "mongodb",
      "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes", "git",
      "html", "css", "tailwind", "next.js", "graphql", "redis", "figma",
      "machine learning", "data analysis", "tableau", "power bi", "excel",
      "communication", "leadership", "problem solving", "teamwork",
    ];
    const foundSkills = techSkills.filter((s) => lower.includes(s));
    skillsScore = Math.min(100, Math.round((foundSkills.length / 6) * 100));
  }

  // 4. Experience match (20%)
  let experienceScore = 40;
  const hasQuantified = /\d+\s*%|\$[\d,]+|saved|increased|reduced|improved by|grew|revenue|users|clients/i.test(text);
  if (hasQuantified) experienceScore += 30;
  const actionVerbs = ["led", "managed", "developed", "created", "built", "designed", "implemented", "delivered", "analyzed", "optimized"];
  const foundActions = actionVerbs.filter((v) => lower.includes(v)).length;
  experienceScore += Math.min(30, foundActions * 5);
  experienceScore = Math.min(100, experienceScore);

  // 5. Formatting (use remaining weight)
  let formatScore = 100;
  if (totalWords < 100) formatScore -= 40;
  else if (totalWords < 200) formatScore -= 25;
  else if (totalWords < 300) formatScore -= 10;
  if (totalWords > 2000) formatScore -= 15;
  if (!/\d{4}/.test(text)) formatScore -= 15;
  const bulletLines = text.split("\n").filter((l) => /^\s*[•\-·–—\*►▪]/.test(l.trim())).length;
  if (bulletLines < 3) formatScore -= 20;
  else if (bulletLines < 5) formatScore -= 10;
  if (!/[A-Z][a-z]/.test(text)) formatScore -= 10;
  if (/[\w.-]+@[\w.-]+\.\w+/.test(text)) formatScore += 5;
  formatScore = Math.max(0, Math.min(100, formatScore));

  // Weighted total — weights change based on whether JD is provided
  let total: number;
  if (hasJD) {
    // Keyword match vs JD: 50%, Skills: 20%, Experience: 20%, Sections: 10%
    total = Math.round(
      keywordScore * 0.50 +
      skillsScore * 0.20 +
      experienceScore * 0.20 +
      completenessScore * 0.10
    );
  } else {
    total = Math.round(
      keywordScore * 0.30 +
      formatScore * 0.20 +
      completenessScore * 0.20 +
      skillsScore * 0.15 +
      experienceScore * 0.15
    );
  }

  // Suggestions
  const suggestions: string[] = [];
  if (sectionsMissing.length > 0) suggestions.push(`Add missing sections: ${sectionsMissing.join(", ")}`);
  if (hasJD && missingKeywords.length > 3) {
    suggestions.push(`Add these JD keywords to your resume: ${missingKeywords.slice(0, 5).join(", ")}`);
  }
  if (!hasQuantified) suggestions.push("Add quantified achievements (e.g., 'increased performance by 30%')");
  if (!hasJD && matchedKeywords.length < 5) suggestions.push("Add more relevant technical skills to your resume");
  if (totalWords < 250) suggestions.push("Resume seems too short — aim for 400-800 words");
  if (bulletLines < 5) suggestions.push("Use more bullet points to describe your experience clearly");
  if (!(/[\w.-]+@[\w.-]+\.\w+/.test(text))) suggestions.push("Include your email address in the contact section");
  if (!lower.includes("linkedin")) suggestions.push("Add your LinkedIn profile URL");

  return {
    keyword_score: keywordScore,
    formatting_score: formatScore,
    completeness_score: completenessScore,
    skills_score: skillsScore,
    experience_score: experienceScore,
    total: Math.min(100, Math.max(0, total)),
    missing_keywords: missingKeywords.slice(0, 15),
    matched_keywords: matchedKeywords.slice(0, 15),
    suggestions: suggestions.slice(0, 6),
    sections_found: sectionsFound,
    sections_missing: sectionsMissing,
  };
}

// Improved PDF text extraction using multiple strategies
async function readFileAsText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const rawStr = new TextDecoder("latin1").decode(uint8Array);

    let textBlocks: string[] = [];
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let btMatch;
    while ((btMatch = btEtRegex.exec(rawStr)) !== null) {
      const block = btMatch[1];
      const parenRegex = /\(([^)]*)\)/g;
      let pm;
      while ((pm = parenRegex.exec(block)) !== null) {
        const decoded = pm[1]
          .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
          .replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
        if (decoded.trim().length > 0) textBlocks.push(decoded);
      }
      const hexRegex = /<([0-9A-Fa-f]+)>/g;
      let hm;
      while ((hm = hexRegex.exec(block)) !== null) {
        const hex = hm[1];
        let decoded = "";
        for (let i = 0; i < hex.length - 1; i += 2) {
          const code = parseInt(hex.substring(i, i + 2), 16);
          if (code >= 32 && code < 127) decoded += String.fromCharCode(code);
        }
        if (decoded.trim().length > 0) textBlocks.push(decoded);
      }
    }
    
    let text = textBlocks.join(" ").replace(/\s+/g, " ").trim();
    
    if (text.length < 50) {
      textBlocks = [];
      const allParenRegex = /\(([^)]{2,})\)/g;
      let m2;
      while ((m2 = allParenRegex.exec(rawStr)) !== null) {
        const s = m2[1].replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
        if (/[a-zA-Z]{2,}/.test(s)) textBlocks.push(s);
      }
      text = textBlocks.join(" ").replace(/\s+/g, " ").trim();
    }

    if (text.length < 50) {
      const readable: string[] = [];
      let current = "";
      for (let i = 0; i < uint8Array.length; i++) {
        const c = uint8Array[i];
        if (c >= 32 && c < 127) current += String.fromCharCode(c);
        else {
          if (current.length > 3 && /[a-zA-Z]{2,}/.test(current)) readable.push(current);
          current = "";
        }
      }
      if (current.length > 3) readable.push(current);
      text = readable.join(" ").replace(/\s+/g, " ").trim();
    }

    return text;
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
  const [jdText, setJdText] = useState("");
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
      if (text.trim().length < 30) {
        toast({ title: "Could not extract text", description: "The file may be image-based or scanned. Try a text-based PDF or DOCX.", variant: "destructive" });
        setAnalyzing(false);
        return;
      }
      const score = calculateATSScore(text, jdText.trim() || undefined);
      setResult(score);
    } catch (err: any) {
      toast({ title: "Error analyzing file", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setJdText("");
    setResult(null);
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive";
  const scoreBg = (s: number) =>
    s >= 80 ? "bg-success/10 border-success/30" : s >= 60 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

  const hasJD = jdText.trim().length > 10;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> ATS Score Checker
          </DialogTitle>
          <DialogDescription>
            Upload your resume and optionally paste a job description for targeted ATS scoring.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 pt-2">
            {/* Job Description — optional but recommended */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Job Description <span className="text-muted-foreground text-xs">(recommended for accurate scoring)</span>
              </label>
              <Textarea
                placeholder="Paste the job description here for targeted keyword matching..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="min-h-[100px] text-sm"
              />
              {hasJD && (
                <p className="text-xs text-success mt-1">✓ JD detected — scoring will match against job keywords</p>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                dragActive ? "border-primary bg-primary/5" : file ? "border-success/50 bg-success/5" : "border-border hover:border-primary/30"
              }`}
              onClick={() => document.getElementById("ats-file-input")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-success shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-foreground shrink-0">
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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                ATS Compatibility Score {hasJD ? "(vs Job Description)" : "(General)"}
              </p>
              <p className={`text-5xl font-black ${scoreColor(result.total)}`}>{result.total}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {result.total >= 80 ? "Excellent — your resume is ATS-friendly!" : result.total >= 60 ? "Good — some improvements recommended." : "Needs work — follow suggestions below."}
              </p>
            </div>

            {/* Section breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Score Breakdown</h4>
              {(hasJD ? [
                { label: "Keyword Match vs JD", score: result.keyword_score, weight: "50%" },
                { label: "Skills Match", score: result.skills_score, weight: "20%" },
                { label: "Experience Clarity", score: result.experience_score, weight: "20%" },
                { label: "Section Completeness", score: result.completeness_score, weight: "10%" },
              ] : [
                { label: "Keyword Match", score: result.keyword_score, weight: "30%" },
                { label: "Formatting", score: result.formatting_score, weight: "20%" },
                { label: "Section Completeness", score: result.completeness_score, weight: "20%" },
                { label: "Skills Relevance", score: result.skills_score, weight: "15%" },
                { label: "Experience Clarity", score: result.experience_score, weight: "15%" },
              ]).map((item) => (
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

            {/* Matched keywords */}
            {result.matched_keywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-success mb-2">Matched Keywords ({result.matched_keywords.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {result.missing_keywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-destructive mb-2">Missing Keywords ({result.missing_keywords.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sections found/missing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-success mb-2">Sections Found</h4>
                <div className="space-y-1">
                  {result.sections_found.map((s) => (
                    <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" /> {s}
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
                        <AlertTriangle className="w-3 h-3 text-destructive shrink-0" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
