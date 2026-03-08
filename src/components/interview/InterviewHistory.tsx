import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp, ChevronRight } from "lucide-react";

export default function InterviewHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="text-center py-10 text-sm text-muted-foreground">Loading...</div>;

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No interview sessions yet. Start your first practice!</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    technical: "Technical",
    hr: "HR",
    behavioral: "Behavioral",
    system_design: "System Design",
  };

  return (
    <div className="space-y-3">
      {sessions.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card
            className="p-4 cursor-pointer hover:border-primary/40 transition-all border-border/30"
            onClick={() => navigate(s.status === "completed" ? `/interview-report/${s.id}` : `/interview/${s.id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{typeLabels[s.interview_type] || s.interview_type} — {s.job_role}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {s.status === "completed" ? "Completed" : "In Progress"}
                  </span>
                  {s.total_score && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {s.total_score}/10
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
