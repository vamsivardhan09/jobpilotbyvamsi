import { useState, useRef, useCallback } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function useElevenLabsTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop any currently playing audio
    stop();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsSpeaking(true);
    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `TTS failed: ${response.status}`);
      }

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("TTS error:", e);
        setIsSpeaking(false);
        throw e;
      }
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
