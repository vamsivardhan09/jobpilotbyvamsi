import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, History, ChevronRight, Code, Users, Brain, Server,
  Database, Layout, BarChart3, Cpu, Wrench, FileText, CheckCircle2, Loader2
} from "lucide-react";
import InterviewHistory from "@/components/interview/InterviewHistory";

const interviewTypes = [
  { id: "technical", label: "Technical", icon: Code, desc: "Data structures, algorithms, coding" },
  { id: "hr", label: "HR", icon: Users, desc: "Culture fit, salary, career goals" },
  { id: "behavioral", label: "Behavioral", icon: Brain, desc: "STAR method, past experiences" },
  { id: "system_design", label: "System Design", icon: Server, desc: "Architecture, scalability, trade-offs" },
];

const jobRoles = [
  { id: "Frontend Developer", icon: Layout },
  { id: "Backend Developer", icon: Server },
  { id: "Full Stack Developer", icon: Cpu },
  { id: "Data Analyst", icon: BarChart3 },
  { id: "Software Engineer", icon: Wrench },
  { id: "DevOps Engineer", icon: Database },
];

export default function InterviewPractice() {
  const [selectedType, setSelectedType] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [step, setStep] = useState<"resume" | "type" | "role" | "history">("resume");
  const [resume, setResume] = useState<any>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user has a resume
  useEffect(() => {
    if (!user) return;
    supabase.from("resumes").select("id, file_name, parsed_data, raw_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setResume(data[0]);
          setStep("type");
        }
        setLoadingResume(false);
      });
  }, [user]);

  const handleStart = async () => {
    if (!user) return;

    // Build resume context from parsed data
    let resumeContext = "";
    if (resume?.parsed_data) {
      const pd = resume.parsed_data as any;
      const skills = pd.skills?.map((s: any) => typeof s === "string" ? s : s.name).join(", ");
      const experience = pd.experience?.map((e: any) => `${e.title} at ${e.company}`).join("; ");
      resumeContext = `Skills: ${skills || "N/A"}. Experience: ${experience || "N/A"}.`;
    } else if (resume?.raw_text) {
      resumeContext = resume.raw_text.substring(0, 500);
    }

    const { data, error } = await supabase.from("interview_sessions").insert({
      user_id: user.id,
      interview_type: selectedType,
      job_role: selectedRole,
      status: "in_progress",
    }).select("id").single();

    if (error || !data) {
      toast({ title: "Error", description: "Failed to start interview", variant: "destructive" });
      return;
    }
    navigate(`/interview/${data.id}`, { state: { resumeContext } });
  };

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mic className="w-6 h-6 text-primary" /> Interview Practice
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Practice with an AI interviewer using your voice</p>
            </div>
            <Button
              variant={step === "history" ? "default" : "hero-outline"}
              size="sm"
              onClick={() => setStep(step === "history" ? (resume ? "type" : "resume") : "history")}
            >
              <History className="w-4 h-4 mr-1" />
              {step === "history" ? "New Interview" : "History"}
            </Button>
          </div>
        </motion.div>

        {step === "history" ? (
          <InterviewHistory />
        ) : step === "resume" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center border-border/30">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">Upload Your Resume First</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Upload and analyze your resume so the AI interviewer can ask personalized questions based on your skills and experience.
              </p>
              <Button variant="hero" onClick={() => navigate("/upload")}>
                <FileText className="w-4 h-4 mr-2" /> Upload Resume
              </Button>
            </Card>
          </motion.div>
        ) : step === "type" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {resume && (
              <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Resume: {resume.file_name}</p>
                    <p className="text-xs text-muted-foreground">AI will use this to personalize questions</p>
                  </div>
                </div>
              </Card>
            )}
            <h2 className="font-semibold mb-4 text-lg">Select Interview Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {interviewTypes.map((t) => (
                <Card
                  key={t.id}
                  className={`p-5 cursor-pointer transition-all hover:border-primary/50 ${selectedType === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/30"}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedType === t.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button disabled={!selectedType} onClick={() => setStep("role")}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-semibold mb-4 text-lg">Select Job Role</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobRoles.map((r) => (
                <Card
                  key={r.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${selectedRole === r.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/30"}`}
                  onClick={() => setSelectedRole(r.id)}
                >
                  <div className="flex items-center gap-3">
                    <r.icon className={`w-5 h-5 ${selectedRole === r.id ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">{r.id}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep("type")}>Back</Button>
              <Button disabled={!selectedRole} onClick={handleStart} variant="hero">
                <Mic className="w-4 h-4 mr-1" /> Start Live Voice Interview
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
