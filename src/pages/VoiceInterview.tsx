import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useElevenLabsSTT } from "@/hooks/useElevenLabsSTT";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, MicOff, Volume2, VolumeX, Loader2,
  Send, PhoneOff, Bot, User
} from "lucide-react";
import VoiceWaveform from "@/components/interview/VoiceWaveform";
import AIAvatar from "@/components/interview/AIAvatar";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function VoiceInterview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const resumeContext = (location.state as any)?.resumeContext || "";

  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [muteAI, setMuteAI] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isConnecting } = useElevenLabsSTT();
  const { isSpeaking, speak, stop: stopSpeaking } = useElevenLabsTTS();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const maxQuestions = 8;

  // Load session
  useEffect(() => {
    if (!sessionId || !user) return;
    supabase.from("interview_sessions").select("*").eq("id", sessionId).single()
      .then(({ data }) => {
        if (data) {
          setSession(data);
          if (data.status === "completed") navigate(`/interview-report/${sessionId}`);
        }
      });
  }, [sessionId, user]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start interview
  useEffect(() => {
    if (session && messages.length === 0 && !isProcessing) {
      askNextQuestion([]);
    }
  }, [session]);

  const speakIfEnabled = useCallback(async (text: string) => {
    if (muteAI) return;
    try {
      await speak(text);
    } catch (e: any) {
      console.error("TTS failed, falling back to browser:", e);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [muteAI, speak]);

  const askNextQuestion = useCallback(async (history: Message[]) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-ai", {
        body: {
          action: "generate_question",
          interviewType: session?.interview_type,
          jobRole: session?.job_role,
          conversationHistory: history,
          resumeContext: resumeContext,
        },
      });

      if (error) throw error;
      const question = data?.question || "Can you tell me about yourself?";

      const newMsg: Message = { role: "assistant", content: question };
      setMessages(prev => [...prev, newMsg]);
      setQuestionCount(prev => prev + 1);

      await supabase.from("interview_questions").insert({
        session_id: sessionId,
        question_number: questionCount + 1,
        question_text: question,
      });

      await speakIfEnabled(question);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate question", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [session, sessionId, questionCount, speakIfEnabled, toast]);

  const handleSendAnswer = useCallback(async () => {
    const answer = transcript.trim();
    if (!answer) return;

    stopListening();
    stopSpeaking();
    resetTranscript();

    const userMsg: Message = { role: "user", content: answer };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    await supabase.from("interview_questions")
      .update({ answer_text: answer })
      .eq("session_id", sessionId)
      .eq("question_number", questionCount)
      .is("answer_text", null);

    if (questionCount >= maxQuestions) {
      endInterview(newHistory);
    } else {
      setIsProcessing(true);
      try {
        const { data } = await supabase.functions.invoke("interview-ai", {
          body: {
            action: "evaluate_answer",
            interviewType: session?.interview_type,
            jobRole: session?.job_role,
            conversationHistory: newHistory,
          },
        });

        if (data?.data?.score) {
          await supabase.from("interview_questions")
            .update({
              score: data.data.score,
              feedback: {
                strengths: data.data.strengths,
                improvements: data.data.improvements,
                suggested_answer: data.data.suggested_answer,
              },
            })
            .eq("session_id", sessionId)
            .eq("question_number", questionCount);
        }

        if (data?.data?.follow_up_question) {
          const followUp: Message = { role: "assistant", content: data.data.follow_up_question };
          const withFollowUp = [...newHistory, followUp];
          setMessages(withFollowUp);
          setQuestionCount(prev => prev + 1);

          await supabase.from("interview_questions").insert({
            session_id: sessionId,
            question_number: questionCount + 1,
            question_text: data.data.follow_up_question,
          });

          await speakIfEnabled(data.data.follow_up_question);
          setIsProcessing(false);
        } else {
          setIsProcessing(false);
          askNextQuestion(newHistory);
        }
      } catch {
        setIsProcessing(false);
        askNextQuestion(newHistory);
      }
    }
  }, [transcript, messages, questionCount, session, sessionId, speakIfEnabled]);

  const endInterview = async (history: Message[]) => {
    setIsEnding(true);
    stopSpeaking();
    stopListening();
    try {
      const { data } = await supabase.functions.invoke("interview-ai", {
        body: {
          action: "generate_report",
          interviewType: session?.interview_type,
          jobRole: session?.job_role,
          conversationHistory: history,
        },
      });

      const report = data?.data || {};
      await supabase.from("interview_sessions").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_score: report.total_score,
        communication_score: report.communication_score,
        technical_score: report.technical_score,
        confidence_score: report.confidence_score,
        problem_solving_score: report.problem_solving_score,
        strengths: report.strengths || [],
        improvements: report.improvements || [],
        recommended_topics: report.recommended_topics || [],
      }).eq("id", sessionId);

      navigate(`/interview-report/${sessionId}`);
    } catch (e: any) {
      toast({ title: "Error generating report", description: e.message, variant: "destructive" });
      setIsEnding(false);
    }
  };

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/30 glass px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{session.job_role} — {session.interview_type.replace("_", " ")} Interview</p>
          <p className="text-xs text-muted-foreground">Question {questionCount}/{maxQuestions}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setMuteAI(!muteAI); if (isSpeaking) stopSpeaking(); }}>
            {muteAI ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => endInterview(messages)} disabled={isEnding || messages.length < 2}>
            <PhoneOff className="w-4 h-4 mr-1" /> End
          </Button>
        </div>
      </div>

      {/* AI Avatar + Waveform */}
      <div className="flex flex-col items-center py-6 border-b border-border/10">
        <AIAvatar isSpeaking={isSpeaking} isProcessing={isProcessing} />
        <VoiceWaveform isActive={isListening || isSpeaking} type={isSpeaking ? "output" : "input"} />
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {isEnding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating your interview report...</p>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Live transcript */}
      {(isListening || transcript) && (
        <div className="px-4 py-2 border-t border-border/30 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground mb-1">{isListening ? "🔴 Listening..." : "Transcript:"}</p>
            <p className="text-sm">{transcript || "Start speaking..."}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-border/30 glass px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
          <Button
            variant={isListening ? "destructive" : "hero"}
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={async () => {
              if (isListening) {
                stopListening();
              } else {
                try {
                  stopSpeaking();
                  await startListening();
                } catch (e: any) {
                  toast({ title: "Microphone Error", description: e.message, variant: "destructive" });
                }
              }
            }}
            disabled={isProcessing || isConnecting || isEnding}
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {transcript.trim() && !isListening && (
            <Button variant="hero" size="lg" onClick={handleSendAnswer} disabled={isProcessing}>
              <Send className="w-5 h-5 mr-1" /> Send Answer
            </Button>
          )}
        </div>
        {isSpeaking && (
          <div className="max-w-2xl mx-auto mt-2 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-primary">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{ height: [8, 20, 8] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  />
                ))}
              </div>
              AI is speaking...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
