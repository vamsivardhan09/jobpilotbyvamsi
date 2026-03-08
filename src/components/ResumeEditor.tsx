import { useState } from "react";
import { ResumeData } from "@/components/resume-templates/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Trash2, Save, X, GripVertical,
  User, FileText, Briefcase, Code, GraduationCap, FolderOpen,
} from "lucide-react";

interface ResumeEditorProps {
  data: ResumeData;
  onSave: (data: ResumeData) => void;
  onCancel: () => void;
}

const ResumeEditor = ({ data, onSave, onCancel }: ResumeEditorProps) => {
  const [form, setForm] = useState<ResumeData>(JSON.parse(JSON.stringify(data)));

  const updateField = (field: keyof ResumeData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Experience helpers
  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", duration: "", bullets: [""] }],
    }));
  };
  const removeExperience = (i: number) => {
    setForm((prev) => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
  };
  const updateExperience = (i: number, field: string, value: any) => {
    setForm((prev) => {
      const exp = [...prev.experience];
      exp[i] = { ...exp[i], [field]: value };
      return { ...prev, experience: exp };
    });
  };
  const addBullet = (expIdx: number) => {
    setForm((prev) => {
      const exp = [...prev.experience];
      exp[expIdx] = { ...exp[expIdx], bullets: [...exp[expIdx].bullets, ""] };
      return { ...prev, experience: exp };
    });
  };
  const removeBullet = (expIdx: number, bulletIdx: number) => {
    setForm((prev) => {
      const exp = [...prev.experience];
      exp[expIdx] = { ...exp[expIdx], bullets: exp[expIdx].bullets.filter((_, j) => j !== bulletIdx) };
      return { ...prev, experience: exp };
    });
  };
  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    setForm((prev) => {
      const exp = [...prev.experience];
      const bullets = [...exp[expIdx].bullets];
      bullets[bulletIdx] = value;
      exp[expIdx] = { ...exp[expIdx], bullets };
      return { ...prev, experience: exp };
    });
  };

  // Skills helpers
  const addSkillCategory = () => {
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { category: "", skills: [""] }],
    }));
  };
  const removeSkillCategory = (i: number) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }));
  };
  const updateSkillCategory = (i: number, field: string, value: any) => {
    setForm((prev) => {
      const skills = [...prev.skills];
      if (field === "skillsText") {
        skills[i] = { ...skills[i], skills: (value as string).split(",").map((s: string) => s.trim()).filter(Boolean) };
      } else {
        skills[i] = { ...skills[i], [field]: value };
      }
      return { ...prev, skills };
    });
  };

  // Education helpers
  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      education: [...(prev.education || []), { degree: "", institution: "", year: "" }],
    }));
  };
  const removeEducation = (i: number) => {
    setForm((prev) => ({ ...prev, education: (prev.education || []).filter((_, idx) => idx !== i) }));
  };
  const updateEducation = (i: number, field: string, value: string) => {
    setForm((prev) => {
      const edu = [...(prev.education || [])];
      edu[i] = { ...edu[i], [field]: value };
      return { ...prev, education: edu };
    });
  };

  // Projects helpers
  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), { name: "", description: "", technologies: [] }],
    }));
  };
  const removeProject = (i: number) => {
    setForm((prev) => ({ ...prev, projects: (prev.projects || []).filter((_, idx) => idx !== i) }));
  };
  const updateProject = (i: number, field: string, value: any) => {
    setForm((prev) => {
      const projects = [...(prev.projects || [])];
      if (field === "techText") {
        projects[i] = { ...projects[i], technologies: (value as string).split(",").map((s: string) => s.trim()).filter(Boolean) };
      } else {
        projects[i] = { ...projects[i], [field]: value };
      }
      return { ...prev, projects };
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h2 className="text-lg font-bold">Edit Resume</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button variant="hero" size="sm" onClick={() => onSave(form)}>
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-8">

          {/* Contact Info */}
          <Section icon={<User className="w-4 h-4" />} title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={form.phone || ""} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <Input value={form.location || ""} onChange={(e) => updateField("location", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">LinkedIn</label>
                <Input value={form.linkedin || ""} onChange={(e) => updateField("linkedin", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Summary */}
          <Section icon={<FileText className="w-4 h-4" />} title="Professional Summary">
            <Textarea
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              rows={4}
              className="resize-none"
            />
          </Section>

          {/* Experience */}
          <Section
            icon={<Briefcase className="w-4 h-4" />}
            title="Experience"
            onAdd={addExperience}
            addLabel="Add Experience"
          >
            {form.experience.map((exp, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3 space-y-3 relative">
                <button
                  onClick={() => removeExperience(i)}
                  className="absolute top-2 right-2 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                    <Input value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Company</label>
                    <Input value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                    <Input value={exp.duration || ""} onChange={(e) => updateExperience(i, "duration", e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Bullet Points</label>
                    <button onClick={() => addBullet(i)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exp.bullets.map((b, j) => (
                      <div key={j} className="flex gap-2 items-start">
                        <span className="text-muted-foreground text-xs mt-2.5 shrink-0">•</span>
                        <Textarea
                          value={b}
                          onChange={(e) => updateBullet(i, j, e.target.value)}
                          rows={2}
                          className="flex-1 resize-none text-sm"
                        />
                        {exp.bullets.length > 1 && (
                          <button onClick={() => removeBullet(i, j)} className="text-destructive/60 hover:text-destructive mt-1.5 shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Skills */}
          <Section
            icon={<Code className="w-4 h-4" />}
            title="Skills"
            onAdd={addSkillCategory}
            addLabel="Add Category"
          >
            {form.skills.map((cat, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3 space-y-2 relative">
                <button
                  onClick={() => removeSkillCategory(i)}
                  className="absolute top-2 right-2 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="pr-6">
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Input value={cat.category} onChange={(e) => updateSkillCategory(i, "category", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
                  <Input
                    value={cat.skills.join(", ")}
                    onChange={(e) => updateSkillCategory(i, "skillsText", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </Section>

          {/* Education */}
          <Section
            icon={<GraduationCap className="w-4 h-4" />}
            title="Education"
            onAdd={addEducation}
            addLabel="Add Education"
          >
            {(form.education || []).map((edu, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3 relative">
                <button
                  onClick={() => removeEducation(i)}
                  className="absolute top-2 right-2 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Degree</label>
                    <Input value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Institution</label>
                    <Input value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                    <Input value={edu.year || ""} onChange={(e) => updateEducation(i, "year", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Projects */}
          <Section
            icon={<FolderOpen className="w-4 h-4" />}
            title="Projects"
            onAdd={addProject}
            addLabel="Add Project"
          >
            {(form.projects || []).map((proj, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3 space-y-2 relative">
                <button
                  onClick={() => removeProject(i)}
                  className="absolute top-2 right-2 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="pr-6">
                  <label className="text-xs text-muted-foreground mb-1 block">Project Name</label>
                  <Input value={proj.name} onChange={(e) => updateProject(i, "name", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <Textarea
                    value={proj.description}
                    onChange={(e) => updateProject(i, "description", e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Technologies (comma-separated)</label>
                  <Input
                    value={(proj.technologies || []).join(", ")}
                    onChange={(e) => updateProject(i, "techText", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </Section>

        </div>
      </ScrollArea>
    </div>
  );
};

// Section wrapper
const Section = ({
  icon,
  title,
  children,
  onAdd,
  addLabel,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {onAdd && (
        <Button variant="ghost" size="sm" onClick={onAdd} className="text-xs h-7">
          <Plus className="w-3 h-3 mr-1" /> {addLabel}
        </Button>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

export default ResumeEditor;
