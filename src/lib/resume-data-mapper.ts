import { ResumeData } from "@/components/resume-templates/types";

/**
 * Maps AI-optimized result + profile data into the ResumeData format
 * used by resume templates.
 */
export const mapToResumeData = (
  optimizedContent: any,
  profile: { full_name?: string; headline?: string } | null,
  resumeParsed: any | null
): ResumeData => {
  // Extract contact info from parsed resume data if available
  const contact = resumeParsed?.contact_info || resumeParsed?.contact || {};

  return {
    fullName: profile?.full_name || contact?.name || "Your Name",
    email: contact?.email || "",
    phone: contact?.phone || "",
    location: contact?.location || "",
    linkedin: contact?.linkedin || "",
    summary: optimizedContent?.optimized_summary || "",
    experience: (optimizedContent?.optimized_experience || []).map((exp: any) => ({
      title: exp.title || "",
      company: exp.company || "",
      duration: exp.duration || "",
      bullets: exp.bullets || [],
    })),
    skills: (optimizedContent?.optimized_skills_section || []).map((cat: any) => ({
      category: cat.category || "",
      skills: cat.skills || [],
    })),
    education: resumeParsed?.education || [],
    projects: resumeParsed?.projects || [],
    atsKeywords: optimizedContent?.ats_keywords || [],
  };
};
