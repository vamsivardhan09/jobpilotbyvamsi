import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-12 sm:p-16 text-center max-w-3xl mx-auto border-primary/20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to find your <span className="text-gradient">perfect match</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of professionals who let AI handle their job search.
            Upload your resume and get matched in minutes.
          </p>
          <Button variant="hero" size="lg" className="text-base px-8 h-12" asChild>
            <Link to="/register">
              Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";
