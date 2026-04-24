import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface OtpVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  /** When provided, the code is displayed on screen (demo/no-email mode). */
  displayCode?: string;
}

export const OtpVerification = ({ email, onVerify, onResend, onBack, loading, displayCode }: OtpVerificationProps) => {
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setCooldown(30);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    await onVerify(code);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Enter verification code</h2>
        <p className="text-xs text-muted-foreground">
          Verifying<br />
          <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      {displayCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center"
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Your verification code
          </p>
          <p className="text-2xl font-mono font-bold text-primary tracking-[0.4em]">
            {displayCode}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Demo mode — enter this code below
          </p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={loading}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          variant="hero"
          className="w-full"
          type="submit"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || loading}
          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </motion.div>
  );
};