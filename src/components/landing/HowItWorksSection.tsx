import { motion } from "framer-motion";
import { Upload, Cpu, Target, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Resume",
    description: "Drop your PDF or DOCX resume. Our AI parses it instantly to extract your complete professional profile.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analyzes & Searches",
    description: "The engine builds dynamic search queries from your skills and scours the internet for matching opportunities.",
  },
  {
    icon: Target,
    step: "03",
    title: "Get Matched Jobs",
    description: "View ranked jobs with compatibility scores. Each match shows skill overlap, gaps, and key insights.",
  },
  {
    icon: Download,
    step: "04",
    title: "Optimize & Apply",
    description: "Generate a tailored resume for any job with ATS-optimized keywords. Download and apply with confidence.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Four steps to your next role
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From resume upload to optimized application in minutes, not weeks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border/50 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-mono text-primary/60 mb-2 block">{step.step}</span>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
