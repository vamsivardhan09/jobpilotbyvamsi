import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Career Intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your AI recruiter
            <br />
            <span className="text-gradient">finds the perfect job</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload your resume. Our AI scans the entire internet, matches you with
            high-compatibility jobs, and generates tailored resumes — automatically.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="lg" className="text-base px-8 h-12" asChild>
              <Link to="/register">
                Start Free <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 h-12" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: "10K+", label: "Jobs Matched" },
              { value: "95%", label: "Match Accuracy" },
              { value: "3x", label: "Faster Hiring" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 relative"
          >
            <div className="glass rounded-2xl p-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FloatingCard
                  icon={<Target className="w-5 h-5 text-primary" />}
                  title="Smart Matching"
                  description="AI compares your skills against job requirements"
                  delay={0.7}
                />
                <FloatingCard
                  icon={<Zap className="w-5 h-5 text-accent" />}
                  title="Instant Analysis"
                  description="Get compatibility scores in seconds"
                  delay={0.8}
                />
                <FloatingCard
                  icon={<Sparkles className="w-5 h-5 text-success" />}
                  title="Resume Optimizer"
                  description="Generate tailored resumes per job"
                  delay={0.9}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FloatingCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-surface-2 rounded-xl p-4 border border-border/50 text-left"
  >
    <div className="mb-2">{icon}</div>
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </motion.div>
);
