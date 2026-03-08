import { useState, useRef, useCallback } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

// ElevenLabs free tier is blocked — skip API calls entirely and use browser TTS
let elevenLabsFailed = true;

export function useElevenLabsTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speakWithBrowser = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"))
      || voices.find(v => v.lang.startsWith("en-"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, []);

  const speak = useCallback(async (text: string) => {
    stop();

    // If ElevenLabs previously failed, go straight to browser TTS
    if (elevenLabsFailed) {
      speakWithBrowser(text);
      return;
    }

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
        elevenLabsFailed = true;
        throw new Error(`TTS failed: ${response.status}`);
      }

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.warn("ElevenLabs TTS unavailable, using browser voice:", e.message);
      speakWithBrowser(text);
    }
  }, [speakWithBrowser]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
