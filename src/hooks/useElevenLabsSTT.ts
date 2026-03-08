import { useState, useCallback, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";

interface UseElevenLabsSTTReturn {
  isListening: boolean;
  transcript: string;
  committedText: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  isConnecting: boolean;
}

export function useElevenLabsSTT(): UseElevenLabsSTTReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const committedRef = useRef("");
  const [committedText, setCommittedText] = useState("");

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    onCommittedTranscript: (data) => {
      committedRef.current += (committedRef.current ? " " : "") + data.text;
      setCommittedText(committedRef.current);
    },
  });

  const startListening = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (error || !data?.token) throw new Error(data?.error || "Failed to get STT token");

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      console.error("STT start error:", e);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, [scribe]);

  const stopListening = useCallback(() => {
    scribe.disconnect();
  }, [scribe]);

  const resetTranscript = useCallback(() => {
    committedRef.current = "";
    setCommittedText("");
  }, []);

  const fullTranscript = committedRef.current + (scribe.partialTranscript ? " " + scribe.partialTranscript : "");

  return {
    isListening: scribe.isConnected,
    transcript: fullTranscript.trim(),
    committedText,
    startListening,
    stopListening,
    resetTranscript,
    isConnecting,
  };
}
