export interface ResumeData {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    duration?: string;
    bullets: string[];
  }[];
  skills: {
    category: string;
    skills: string[];
  }[];
  education?: {
    degree: string;
    institution: string;
    year?: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies?: string[];
  }[];
  atsKeywords?: string[];
}

export interface ResumeTemplateProps {
  data: ResumeData;
}

export type TemplateName = "modern-tech" | "minimal-ats" | "corporate-professional" | "original-enhanced";

export interface TemplateOption {
  id: TemplateName;
  label: string;
  description: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "modern-tech", label: "Modern Tech", description: "Clean, modern layout ideal for tech roles" },
  { id: "minimal-ats", label: "Minimal ATS", description: "Simple format optimized for ATS systems" },
  { id: "corporate-professional", label: "Corporate Professional", description: "Traditional layout for corporate roles" },
  { id: "original-enhanced", label: "Original + Keywords", description: "Your original resume format with ATS keywords added" },
];
