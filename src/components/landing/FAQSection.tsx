import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does JobPilot find jobs?",
    a: "Our AI engine dynamically generates search queries based on your resume skills and experience. It scans job boards, company career pages, and aggregators across the internet to find relevant opportunities.",
  },
  {
    q: "What file formats are supported for resume upload?",
    a: "We currently support PDF and DOCX formats. Our parser extracts text, structure, and metadata to build your professional profile.",
  },
  {
    q: "How accurate is the compatibility score?",
    a: "Our matching algorithm compares your skills, experience level, and role preferences against job requirements. Scores above 70% indicate strong alignment, and our users report 95% accuracy in relevance.",
  },
  {
    q: "Can I customize the resume optimization?",
    a: "Yes. The AI generates suggestions for bullet points, keywords, and phrasing. You can accept, edit, or reject each recommendation before downloading the final version.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted in transit and at rest. We never share your resume or personal information with third parties. You can delete your data at any time.",
  },
  {
    q: "Do I need to pay to get started?",
    a: "No. Our free plan includes 3 resume uploads per month and 10 job matches per day. Upgrade to Pro for unlimited access and advanced features.",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-24">
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
};
