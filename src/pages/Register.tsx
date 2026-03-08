import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import logoImg from "@/assets/jobpilot-logo.png";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, ShieldCheck } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEmailSent(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      toast({ title: "Error", description: "Please enter the full 6-digit code.", variant: "destructive" });
      return;
    }
    setVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "signup",
    });

    setVerifying(false);

    if (error) {
      toast({ title: "Invalid code", description: error.message, variant: "destructive" });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else {
      toast({ title: "Verified!", description: "Your account is now active." });
      navigate("/dashboard");
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    setResending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code resent!", description: "Check your inbox for a new verification code." });
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Enter verification code</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="glass rounded-xl p-6 space-y-6">
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-bold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                ))}
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={verifying || otp.join("").length !== 6}
              >
                {verifying ? "Verifying..." : "Verify & Continue"}
              </Button>

              <div className="flex items-center gap-2 justify-center">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend"}
                </button>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-6">
              Already verified?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <img src={logoImg} alt="JobPilot" className="w-12 h-12 object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your AI-powered job search</p>
          </div>

          <div className="glass rounded-xl p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button variant="hero" className="w-full" disabled={loading} type="submit">
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
