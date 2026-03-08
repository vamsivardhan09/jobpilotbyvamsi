import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface AIAvatarProps {
  isSpeaking: boolean;
  isProcessing: boolean;
}

export default function AIAvatar({ isSpeaking, isProcessing }: AIAvatarProps) {
  return (
    <div className="relative mb-3">
      {/* Outer pulse rings */}
      {isSpeaking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            style={{ width: 80, height: 80, top: -8, left: -8 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/15"
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
            style={{ width: 80, height: 80, top: -8, left: -8 }}
          />
        </>
      )}

      <motion.div
        className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30"
        animate={
          isSpeaking
            ? { scale: [1, 1.05, 1], borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.7)", "hsl(var(--primary) / 0.3)"] }
            : isProcessing
            ? { scale: [1, 1.02, 1] }
            : {}
        }
        transition={{ repeat: Infinity, duration: isSpeaking ? 0.8 : 1.5 }}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Bot className="w-7 h-7 text-primary" />
          </motion.div>
        ) : (
          <Bot className="w-7 h-7 text-primary" />
        )}
      </motion.div>
    </div>
  );
}
