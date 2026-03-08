import { motion } from "framer-motion";
import { Brain, Search, FileText, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Analysis",
    description: "Upload your resume and our AI extracts skills, experience, and career trajectory to build your professional profile.",
    color: "text-primary",
  },
  {
    icon: Search,
    title: "Global Job Discovery",
    description: "Our engine searches across the entire internet to find jobs that match your unique skill set and preferences.",
    color: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Compatibility Scoring",
    description: "Get precise match scores comparing your profile against job requirements. Only see jobs above your threshold.",
    color: "text-success",
  },
  {
    icon: FileText,
    title: "Resume Optimization",
    description: "Generate ATS-optimized resumes tailored to specific job descriptions with the right keywords and phrasing.",
    color: "text-warning",
  },
  {
    icon: Shield,
    title: "Skill Gap Analysis",
    description: "Identify missing skills for your target roles and get personalized learning recommendations.",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "Smart Job Alerts",
    description: "Receive daily notifications when new high-match jobs appear. Never miss an opportunity again.",
    color: "text-accent",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to land your dream job
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From resume parsing to job matching, our AI handles the entire job search pipeline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
