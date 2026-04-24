import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import logoImg from "@/assets/jobpilot-logo.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { OtpVerification } from "@/components/auth/OtpVerification";

const DEMO_EMAIL = "demo@anyjobs.app";
const DEMO_PASSWORD = "DemoUser!2025";

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1: validate inputs, show OTP step (account is created AFTER OTP verify)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim()) return;
    setLoading(true);

    const code = generateCode();
    setGeneratedCode(code);
    setOtpStep(true);
    setLoading(false);
    toast({ title: "Code generated", description: "Enter the 6-digit code shown on screen." });
  };

  const handleVerifyOtp = async (code: string) => {
    setOtpLoading(true);
    if (code !== generatedCode) {
      setOtpLoading(false);
      toast({ title: "Invalid code", description: "The code you entered is incorrect.", variant: "destructive" });
      return;
    }

    // Code matched — create the account now
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.trim() },
      },
    });
    setOtpLoading(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Welcome!", description: "Account created successfully." });
    navigate("/dashboard");
  };

  const handleResendOtp = async () => {
    const code = generateCode();
    setGeneratedCode(code);
    toast({ title: "New code generated" });
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    let { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: "Demo User" },
        },
      });

      if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
        setDemoLoading(false);
        toast({ title: "Demo unavailable", description: signUpError.message, variant: "destructive" });
        return;
      }

      const retry = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      error = retry.error;
    }

    setDemoLoading(false);

    if (error) {
      toast({ title: "Demo unavailable", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Demo mode", description: "You're exploring with the demo account." });
      navigate("/dashboard");
    }
  };

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
            <img src={logoImg} alt="AnyJobs" className="w-12 h-12 object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your AI-powered job search</p>
          </div>

          <div className="glass rounded-xl p-6">
            {otpStep ? (
              <OtpVerification
                email={email.trim()}
                loading={otpLoading}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={() => setOtpStep(false)}
                displayCode={generatedCode}
              />
            ) : (
              <>
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
                  <Button variant="hero" className="w-full" disabled={loading || demoLoading} type="submit">
                    {loading ? "Sending code..." : "Create Account"}
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/40 px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleDemoLogin}
                  disabled={loading || demoLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {demoLoading ? "Loading demo..." : "Try Demo Account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Skip signup — explore AnyJobs instantly
                </p>
              </>
            )}
          </div>

          {!otpStep && (
            <p className="text-sm text-center text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
