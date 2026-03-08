import { forwardRef } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does the AI job matching work?",
    a: "Our AI analyzes your resume, extracts skills and experience, then searches major job boards to find positions that match your profile. It scores each job based on skill overlap and relevance.",
  },
  {
    q: "Is my resume data secure?",
    a: "Yes. Your data is encrypted in transit and at rest. We never share your personal information with employers without your explicit consent.",
  },
  {
    q: "How accurate is the ATS optimizer?",
    a: "Our optimizer uses the same algorithms that top ATS systems use to parse resumes, ensuring your resume passes automated screening with high success rates.",
  },
  {
    q: "Can I practice for specific roles?",
    a: "Absolutely! Our AI interview coach adapts to any role — from software engineering to product management, data science, and more.",
  },
  {
    q: "What job boards do you search?",
    a: "We search across LinkedIn, Indeed, Naukri, Glassdoor, and other major platforms to find the best matches for your profile.",
  },
];

export const FAQSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section id="faq" className="py-24" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass rounded-xl px-6 border border-border/50"
              >
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
});

FAQSection.displayName = "FAQSection";
