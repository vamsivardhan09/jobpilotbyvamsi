import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, experienceLevel, preferredRoles, location } = await req.json();

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(
        JSON.stringify({ error: "Skills array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const skillNames = skills.map((s: any) => typeof s === "string" ? s : s.name).join(", ");
    const rolesHint = preferredRoles?.length ? `Preferred roles: ${preferredRoles.join(", ")}.` : "";
    const levelHint = experienceLevel ? `Experience level: ${experienceLevel}.` : "";
    const locationHint = location ? `Preferred location: ${location}.` : "";

    const userPrompt = `Based on this candidate profile, generate 8-12 realistic job listings that would be good matches.

Skills: ${skillNames}
${levelHint}
${rolesHint}
${locationHint}

For each job, calculate a match_score (0-100) based on how well the candidate's skills match the job requirements.
Include a mix of high matches (80-95), medium matches (60-79), and a few stretch opportunities (40-59).
Make the jobs realistic with real-sounding companies, accurate salary ranges, and specific locations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a job matching engine. Generate realistic job listings based on candidate profiles. Return structured data only.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_job_matches",
              description: "Return a list of job matches for the candidate",
              parameters: {
                type: "object",
                properties: {
                  jobs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Job title" },
                        company: { type: "string", description: "Company name" },
                        location: { type: "string", description: "Job location" },
                        description: { type: "string", description: "2-3 sentence job description" },
                        salary_range: { type: "string", description: "Salary range like $120k-$160k" },
                        match_score: { type: "number", description: "Match score 0-100" },
                        required_skills: { type: "array", items: { type: "string" }, description: "Skills required for this job" },
                        matched_skills: { type: "array", items: { type: "string" }, description: "Candidate skills that match" },
                        missing_skills: { type: "array", items: { type: "string" }, description: "Skills the candidate is missing" },
                        apply_url: { type: "string", description: "A plausible job board URL" },
                      },
                      required: ["title", "company", "location", "description", "match_score", "required_skills", "matched_skills", "missing_skills"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["jobs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_job_matches" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ success: true, data: parsed.jobs || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No structured data returned from AI");
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: parsedData.jobs || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("discover-jobs error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to discover jobs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
