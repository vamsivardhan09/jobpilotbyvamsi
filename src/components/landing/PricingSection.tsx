import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic job matching.",
    features: ["3 resume uploads/month", "10 job matches/day", "Basic skill analysis", "Email support"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Full AI-powered career intelligence.",
    features: [
      "Unlimited resume uploads",
      "Unlimited job matches",
      "Resume optimization",
      "Skill gap analysis",
      "Daily job alerts",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and recruitment agencies.",
    features: [
      "Everything in Pro",
      "Team management",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-6 border ${
                plan.featured
                  ? "border-primary/40 bg-primary/5 glow-primary"
                  : "glass"
              }`}
            >
              <h3 className="font-semibold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <Button
                variant={plan.featured ? "hero" : "hero-outline"}
                className="w-full mb-6"
                asChild
              >
                <Link to="/register">{plan.cta}</Link>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
