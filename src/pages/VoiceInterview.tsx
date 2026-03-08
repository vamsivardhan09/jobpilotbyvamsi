import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useElevenLabsSTT } from "@/hooks/useElevenLabsSTT";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, MicOff, Volume2, VolumeX, Loader2,
  PhoneOff, Bot, User, AlertCircle, ArrowLeft
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
  const [useElevenLabs, setUseElevenLabs] = useState(true);

  // ElevenLabs hooks
  const elevenSTT = useElevenLabsSTT();
  const elevenTTS = useElevenLabsTTS();

  // Browser fallback hooks
  const browserSTT = useSpeechRecognition();
  const browserTTS = useSpeechSynthesis();

  // Active STT/TTS - try ElevenLabs, fallback to browser
  const isListening = useElevenLabs ? elevenSTT.isListening : browserSTT.isListening;
  const transcript = useElevenLabs ? elevenSTT.transcript : browserSTT.transcript;
  const isSpeaking = useElevenLabs ? elevenTTS.isSpeaking : browserTTS.isSpeaking;
  const isConnecting = useElevenLabs ? elevenSTT.isConnecting : false;
  const sttError = useElevenLabs ? elevenSTT.error : browserSTT.error;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const maxQuestions = 10;
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef("");
  const isProcessingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const questionCountRef = useRef(0);
  const aiSpeakingRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const correctionCacheRef = useRef<Map<string, string>>(new Map());

  // Clamp score to 0-10
  const clampScore = (val: any): number => {
    const n = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(n)) return 5;
    if (n > 10) return Math.min(10, Math.round(n / 10));
    return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
  };

  // AI transcript correction
  const correctTranscript = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim().length < 5) return text;
    
    const cached = correctionCacheRef.current.get(text.trim());
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke("correct-transcript", {
        body: { transcript: text },
      });
      if (error || !data?.corrected) return text;
      correctionCacheRef.current.set(text.trim(), data.corrected);
      return data.corrected;
    } catch {
      return text;
    }
  }, []);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { aiSpeakingRef.current = isSpeaking; }, [isSpeaking]);

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

  // Start interview when session loads
  useEffect(() => {
    if (session && !interviewStartedRef.current) {
      interviewStartedRef.current = true;
      askNextQuestion([]);
    }
  }, [session]);

  // ---- CONTINUOUS LISTENING: detect silence and auto-send ----
  useEffect(() => {
    if (!isListening || isSpeaking || isProcessingRef.current) return;

    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(() => {
        const currentTranscript = lastTranscriptRef.current.trim();
        if (currentTranscript && !isProcessingRef.current && !aiSpeakingRef.current) {
          handleAutoSubmit(currentTranscript);
        }
      }, 2500);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, isListening, isSpeaking]);

  const speakText = useCallback(async (text: string) => {
    if (muteAI) return;
    try {
      if (useElevenLabs) {
        await elevenTTS.speak(text);
      } else {
        browserTTS.speak(text);
      }
    } catch {
      browserTTS.speak(text);
    }
  }, [muteAI, useElevenLabs, elevenTTS, browserTTS]);

  const stopAllSpeaking = useCallback(() => {
    elevenTTS.stop();
    browserTTS.stop();
  }, [elevenTTS, browserTTS]);

  const startMic = useCallback(async () => {
    if (useElevenLabs) {
      elevenSTT.resetTranscript();
    } else {
      browserSTT.resetTranscript();
    }
    lastTranscriptRef.current = "";

    try {
      if (useElevenLabs) {
        await elevenSTT.startListening();
      } else {
        browserSTT.startListening();
      }
    } catch (e: any) {
      console.warn("ElevenLabs STT failed, falling back to browser:", e);
      setUseElevenLabs(false);
      browserSTT.startListening();
    }
  }, [useElevenLabs, elevenSTT, browserSTT]);

  const stopMic = useCallback(() => {
    if (useElevenLabs) {
      elevenSTT.stopListening();
    } else {
      browserSTT.stopListening();
    }
  }, [useElevenLabs, elevenSTT, browserSTT]);

  const askNextQuestion = useCallback(async (history: Message[]) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-ai", {
        body: {
          action: "generate_question",
          interviewType: session?.interview_type || "comprehensive",
          jobRole: session?.job_role || "Software Engineer",
          conversationHistory: history,
          resumeContext,
        },
      });

      if (error) throw error;
      const question = data?.question || "Tell me about yourself.";

      const newMsg: Message = { role: "assistant", content: question };
      const updatedHistory = [...history, newMsg];
      setMessages(updatedHistory);
      setQuestionCount(prev => prev + 1);

      await supabase.from("interview_questions").insert({
        session_id: sessionId,
        question_number: questionCountRef.current + 1,
        question_text: question,
      });

      await speakText(question);

      setTimeout(() => {
        if (!isProcessingRef.current) {
          startMic();
        }
      }, 500);
    } catch (e: any) {
      console.error("Question generation error:", e);
      toast({ title: "Error", description: e.message || "Failed to generate question", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [session, sessionId, resumeContext, speakText, startMic, toast]);

  const handleAutoSubmit = useCallback(async (answerText: string) => {
    if (isProcessingRef.current) return;

    stopMic();
    stopAllSpeaking();

    if (useElevenLabs) {
      elevenSTT.resetTranscript();
    } else {
      browserSTT.resetTranscript();
    }
    lastTranscriptRef.current = "";

    // Apply AI transcript correction
    const correctedText = await correctTranscript(answerText);

    const userMsg: Message = { role: "user", content: correctedText };
    const currentMessages = messagesRef.current;
    const newHistory = [...currentMessages, userMsg];
    setMessages(newHistory);

    // Save answer
    await supabase.from("interview_questions")
      .update({ answer_text: correctedText })
      .eq("session_id", sessionId)
      .eq("question_number", questionCountRef.current)
      .is("answer_text", null);

    if (questionCountRef.current >= maxQuestions) {
      endInterview(newHistory);
      return;
    }

    // Evaluate and ask next
    setIsProcessing(true);
    try {
      const { data } = await supabase.functions.invoke("interview-ai", {
        body: {
          action: "evaluate_answer",
          interviewType: session?.interview_type || "comprehensive",
          jobRole: session?.job_role || "Software Engineer",
          conversationHistory: newHistory,
          resumeContext,
        },
      });

      if (data?.data?.score !== undefined) {
        const normalizedScore = clampScore(data.data.score);
        await supabase.from("interview_questions")
          .update({
            score: normalizedScore,
            feedback: {
              strengths: data.data.strengths || [],
              improvements: data.data.improvements || [],
              suggested_answer: data.data.suggested_answer || "",
            },
          })
          .eq("session_id", sessionId)
          .eq("question_number", questionCountRef.current);
      }

      setIsProcessing(false);

      if (data?.data?.follow_up_question) {
        const followUp: Message = { role: "assistant", content: data.data.follow_up_question };
        const withFollowUp = [...newHistory, followUp];
        setMessages(withFollowUp);
        setQuestionCount(prev => prev + 1);

        await supabase.from("interview_questions").insert({
          session_id: sessionId,
          question_number: questionCountRef.current + 1,
          question_text: data.data.follow_up_question,
        });

        await speakText(data.data.follow_up_question);
        setTimeout(() => startMic(), 500);
      } else {
        askNextQuestion(newHistory);
      }
    } catch (e: any) {
      console.error("Evaluation error:", e);
      setIsProcessing(false);
      askNextQuestion(newHistory);
    }
  }, [session, sessionId, resumeContext, stopMic, stopAllSpeaking, useElevenLabs, elevenSTT, browserSTT, speakText, startMic, askNextQuestion, correctTranscript]);

  const endInterview = async (history: Message[]) => {
    setIsEnding(true);
    stopAllSpeaking();
    stopMic();
    try {
      const { data } = await supabase.functions.invoke("interview-ai", {
        body: {
          action: "generate_report",
          interviewType: session?.interview_type || "comprehensive",
          jobRole: session?.job_role || "Software Engineer",
          conversationHistory: history,
          resumeContext,
        },
      });

      const report = data?.data || {};
      // Normalize all scores
      await supabase.from("interview_sessions").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_score: clampScore(report.total_score),
        communication_score: clampScore(report.communication_score),
        technical_score: clampScore(report.technical_score),
        confidence_score: clampScore(report.confidence_score),
        problem_solving_score: clampScore(report.problem_solving_score),
        strengths: report.strengths || [],
        improvements: report.improvements || [],
        recommended_topics: report.recommended_topics || [],
      }).eq("id", sessionId);

      navigate(`/interview-report/${sessionId}`);
    } catch (e: any) {
      console.error("Report generation error:", e);
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
      {/* Header - mobile responsive */}
      <div className="border-b border-border/30 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 w-8 h-8" onClick={() => navigate("/interview")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Mock Interview</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Q{questionCount}/{maxQuestions} • {isListening ? "🔴 Listening" : isSpeaking ? "🔊 Speaking" : isProcessing ? "⏳ Thinking" : "Ready"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9" onClick={() => { setMuteAI(!muteAI); if (isSpeaking) stopAllSpeaking(); }}>
            {muteAI ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 sm:w-9 sm:h-9"
            onClick={() => { isListening ? stopMic() : startMic(); }}
            disabled={isProcessing || isConnecting || isEnding}
          >
            {isListening ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs px-2 sm:px-3" onClick={() => endInterview(messages)} disabled={isEnding || messages.length < 2}>
            <PhoneOff className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">End</span>
          </Button>
        </div>
      </div>

      {/* AI Avatar + Waveform - responsive sizing */}
      <div className="flex flex-col items-center py-4 sm:py-6 border-b border-border/10">
        <AIAvatar isSpeaking={isSpeaking} isProcessing={isProcessing} />
        <VoiceWaveform isActive={isListening || isSpeaking} type={isSpeaking ? "output" : "input"} />
        {isListening && (
          <p className="text-xs text-primary mt-2 animate-pulse">Speak naturally — I'm listening...</p>
        )}
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-3 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && !isEnding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {isEnding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 sm:py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating your interview report...</p>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Live transcript bar - mobile friendly */}
      {(isListening || transcript || sttError) && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border/30 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            {sttError && (
              <p className="text-xs text-amber-500 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {sttError}
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              {isListening && <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
              {isListening ? "Listening..." : "Your answer:"}
            </p>
            <p className="text-sm break-words">{transcript || "Start speaking..."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
