import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Trophy, TrendingUp, AlertTriangle, BookOpen,
  MessageSquare, Loader2, CheckCircle, XCircle
} from "lucide-react";

export default function InterviewReport() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !user) return;
    Promise.all([
      supabase.from("interview_sessions").select("*").eq("id", sessionId).single(),
      supabase.from("interview_questions").select("*").eq("session_id", sessionId).order("question_number"),
    ]).then(([sRes, qRes]) => {
      setSession(sRes.data);
      setQuestions(qRes.data ?? []);
      setLoading(false);
    });
  }, [sessionId, user]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!session) return <div className="text-center py-16 text-muted-foreground">Session not found</div>;

  const scores = [
    { label: "Overall", value: session.total_score, color: "text-primary" },
    { label: "Communication", value: session.communication_score, color: "text-blue-500" },
    { label: "Technical", value: session.technical_score, color: "text-green-500" },
    { label: "Confidence", value: session.confidence_score, color: "text-yellow-500" },
    { label: "Problem Solving", value: session.problem_solving_score, color: "text-purple-500" },
  ];

  const typeLabels: Record<string, string> = {
    technical: "Technical", hr: "HR", behavioral: "Behavioral", system_design: "System Design",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/interview")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Interviews
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" /> Interview Report
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {typeLabels[session.interview_type]} — {session.job_role} • {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
            {scores.map((s) => {
              // Normalize score display: clamp to 0-10
              const displayVal = s.value != null ? Math.max(0, Math.min(10, Math.round(s.value * 10) / 10)) : null;
              return (
                <Card key={s.label} className="p-3 sm:p-4 text-center border-border/30">
                  <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{displayVal ?? "—"}<span className="text-xs text-muted-foreground">/10</span></p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{s.label}</p>
                  {displayVal != null && <Progress value={(displayVal / 10) * 100} className="mt-2 h-1.5" />}
                </Card>
              );
            })}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="p-5 border-border/30">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" /> Strengths
              </h3>
              <ul className="space-y-2">
                {(session.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
                {(!session.strengths || session.strengths.length === 0) && (
                  <li className="text-sm text-muted-foreground">No data</li>
                )}
              </ul>
            </Card>
            <Card className="p-5 border-border/30">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-orange-500" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {(session.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
                {(!session.improvements || session.improvements.length === 0) && (
                  <li className="text-sm text-muted-foreground">No data</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Recommended Topics */}
          {session.recommended_topics?.length > 0 && (
            <Card className="p-5 border-border/30 mb-8">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" /> Recommended Practice Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {session.recommended_topics.map((t: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Question breakdown */}
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" /> Question Breakdown
          </h3>
          <div className="space-y-3">
            {questions.filter(q => q.answer_text).map((q) => (
              <Card key={q.id} className="p-4 border-border/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium">Q{q.question_number}: {q.question_text}</p>
                  {q.score && <span className="text-sm font-bold text-primary shrink-0">{q.score}/10</span>}
                </div>
                <p className="text-xs text-muted-foreground mb-2"><strong>Your answer:</strong> {q.answer_text}</p>
                {q.feedback && (
                  <div className="text-xs space-y-1 border-t border-border/20 pt-2 mt-2">
                    {q.feedback.strengths?.length > 0 && (
                      <p className="text-green-600">✓ {q.feedback.strengths.join(", ")}</p>
                    )}
                    {q.feedback.improvements?.length > 0 && (
                      <p className="text-orange-500">△ {q.feedback.improvements.join(", ")}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="hero" onClick={() => navigate("/interview")}>Practice Again</Button>
            <Button variant="hero-outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
