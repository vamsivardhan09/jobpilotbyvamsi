import { motion } from "framer-motion";

interface VoiceWaveformProps {
  isActive: boolean;
  type: "input" | "output";
}

export default function VoiceWaveform({ isActive, type }: VoiceWaveformProps) {
  if (!isActive) return null;

  const barCount = 24;
  const color = type === "output" ? "bg-primary" : "bg-accent";

  return (
    <div className="flex items-center justify-center gap-[2px] h-8 mt-2">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${color}`}
          animate={{
            height: isActive
              ? [4, Math.random() * 24 + 6, 4, Math.random() * 18 + 4, 4]
              : 4,
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8 + Math.random() * 0.5,
            delay: i * 0.03,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
