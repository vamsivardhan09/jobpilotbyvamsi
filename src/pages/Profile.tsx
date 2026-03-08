import logoImg from "@/assets/jobpilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase, ArrowLeft, User, MapPin, Code2, Target,
  Save, Loader2, Plus, X, GraduationCap,
} from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "intern", label: "Intern / Entry Level" },
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "mid", label: "Mid-Level (2-5 years)" },
  { value: "senior", label: "Senior (5-10 years)" },
  { value: "lead", label: "Lead / Staff (10+ years)" },
  { value: "executive", label: "Executive / Director" },
];

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Skills from DB
  const [skills, setSkills] = useState<{ id: string; name: string; category: string | null; proficiency: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("skills").select("id, name, category, proficiency").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setHeadline(profileRes.data.headline || "");
        setExperienceLevel(profileRes.data.experience_level || "");
        setPreferredRoles(profileRes.data.preferred_roles || []);
        setPreferredLocations(profileRes.data.preferred_locations || []);
      }
      setSkills(skillsRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        headline: headline.trim(),
        experience_level: experienceLevel,
        preferred_roles: preferredRoles,
        preferred_locations: preferredLocations,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const addTag = (list: string[], setList: (v: string[]) => void, value: string, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput("");
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    language: "Languages",
    framework: "Frameworks",
    database: "Databases",
    tool: "Tools",
    soft_skill: "Soft Skills",
    other: "Other",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src={logoImg} alt="JobPilot" className="w-7 h-7 object-contain" />
            JobPilot
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-primary" /> My Profile
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Manage your career preferences to get better job matches.
          </p>
        </motion.div>

        {/* Personal Info */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full Stack Developer" className="mt-1" />
            </div>
          </div>
        </motion.section>

        {/* Experience Level */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" /> Experience Level
          </h2>
          <Select value={experienceLevel} onValueChange={setExperienceLevel}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.section>

        {/* Preferred Roles */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Preferred Roles
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {preferredRoles.map((role, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {role}
                <button onClick={() => removeTag(preferredRoles, setPreferredRoles, i)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(preferredRoles, setPreferredRoles, newRole, setNewRole))}
              placeholder="Add a role (e.g. Frontend Developer)"
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => addTag(preferredRoles, setPreferredRoles, newRole, setNewRole)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </motion.section>

        {/* Preferred Locations */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Preferred Locations
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {preferredLocations.map((loc, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {loc}
                <button onClick={() => removeTag(preferredLocations, setPreferredLocations, i)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(preferredLocations, setPreferredLocations, newLocation, setNewLocation))}
              placeholder="Add a location (e.g. Bengaluru, Remote)"
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => addTag(preferredLocations, setPreferredLocations, newLocation, setNewLocation)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </motion.section>

        {/* Skills (read-only, from resume) */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" /> Extracted Skills
          </h2>
          <p className="text-xs text-muted-foreground mb-4">These skills were automatically extracted from your uploaded resumes.</p>
          {Object.keys(skillsByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills extracted yet. <Link to="/upload" className="text-primary hover:underline">Upload a resume</Link> to get started.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{categoryLabels[cat] || cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <Badge key={s.id} variant="outline" className="border-primary/30 text-primary">
                        {s.name}
                        {s.proficiency && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">({s.proficiency})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Save */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-end mb-12">
          <Button variant="hero" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
