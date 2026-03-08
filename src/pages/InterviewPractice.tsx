import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, History, TrendingUp, ChevronRight, Code, Users, Brain, Server,
  Briefcase, Database, Layout, BarChart3, Cpu, Wrench
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
  const [step, setStep] = useState<"type" | "role" | "history">("type");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleStart = async () => {
    if (!user) return;
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
    navigate(`/interview/${data.id}`);
  };

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
              onClick={() => setStep(step === "history" ? "type" : "history")}
            >
              <History className="w-4 h-4 mr-1" />
              {step === "history" ? "New Interview" : "History"}
            </Button>
          </div>
        </motion.div>

        {step === "history" ? (
          <InterviewHistory />
        ) : step === "type" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                <Mic className="w-4 h-4 mr-1" /> Start Interview
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
