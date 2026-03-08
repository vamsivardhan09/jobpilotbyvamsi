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
  error: string | null;
}

export function useElevenLabsSTT(): UseElevenLabsSTTReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const committedRef = useRef("");
  const [committedText, setCommittedText] = useState("");
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad" as any,
    onCommittedTranscript: (data) => {
      committedRef.current += (committedRef.current ? " " : "") + data.text;
      setCommittedText(committedRef.current);
      setError(null);
      reconnectAttemptsRef.current = 0;
    },
  });

  const connectWithToken = useCallback(async () => {
    const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-scribe-token");
    if (fnError || !data?.token) throw new Error(data?.error || "Failed to get STT token");

    await scribe.connect({
      token: data.token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  }, [scribe]);

  const startListening = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await connectWithToken();
      reconnectAttemptsRef.current = 0;
    } catch (e) {
      console.error("STT start error:", e);
      setError("Failed to connect to speech recognition");
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, [connectWithToken]);

  const stopListening = useCallback(() => {
    reconnectAttemptsRef.current = maxReconnectAttempts; // prevent auto-reconnect
    scribe.disconnect();
    setError(null);
  }, [scribe]);

  const resetTranscript = useCallback(() => {
    committedRef.current = "";
    setCommittedText("");
    setError(null);
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
    error,
  };
}
