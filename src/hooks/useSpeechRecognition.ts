import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

// Technical vocabulary for speech recognition hints
const TECH_VOCABULARY = [
  "React", "React.js", "Node.js", "JavaScript", "TypeScript", "Python",
  "REST API", "GraphQL", "Docker", "Kubernetes", "MongoDB", "PostgreSQL",
  "Next.js", "Express", "Vue.js", "Angular", "Svelte", "Tailwind CSS",
  "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub", "DevOps",
  "microservices", "serverless", "WebSocket", "OAuth", "JWT",
  "Redux", "Zustand", "Prisma", "Supabase", "Firebase",
  "HTML", "CSS", "SASS", "Webpack", "Vite", "npm", "yarn",
  "API", "SDK", "CLI", "ORM", "SQL", "NoSQL", "Redis",
  "Linux", "Nginx", "Apache", "Terraform", "Ansible",
];

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    // Add grammar/phrase hints if supported
    const SpeechGrammarList =
      (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (SpeechGrammarList) {
      const grammar = `#JSGF V1.0; grammar tech; public <tech> = ${TECH_VOCABULARY.join(" | ")};`;
      const grammarList = new SpeechGrammarList();
      grammarList.addFromString(grammar, 1);
      recognition.grammars = grammarList;
    }

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const t = result[0].transcript;
        if (result.isFinal) {
          finalTranscriptRef.current += t + " ";
        } else {
          interim += t;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);

      if (event.error === "no-speech") {
        // Silently restart on no-speech
        return;
      }

      if (event.error === "audio-capture") {
        setError("Microphone not available");
        shouldRestartRef.current = false;
        setIsListening(false);
        return;
      }

      if (event.error === "not-allowed") {
        setError("Microphone permission denied");
        shouldRestartRef.current = false;
        setIsListening(false);
        return;
      }

      // For network or other transient errors, auto-restart
      if (shouldRestartRef.current) {
        setError("Listening again...");
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current) {
            try {
              recognition.start();
            } catch {
              // Already running or can't restart
            }
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setError(null);
            } catch {
              setIsListening(false);
              shouldRestartRef.current = false;
            }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Stop existing
    if (recognitionRef.current) {
      shouldRestartRef.current = false;
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    finalTranscriptRef.current = "";
    setError(null);

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setError("Failed to start listening");
      shouldRestartRef.current = false;
    }
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  }, []);

  return { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, error };
}
