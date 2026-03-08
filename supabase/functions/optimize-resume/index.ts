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
    const { resumeText, jobTitle, jobCompany, jobDescription, requiredSkills, matchedSkills, missingSkills } = await req.json();

    if (!resumeText || resumeText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Resume text is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `You are an expert resume optimizer and ATS specialist. Be BRUTALLY HONEST about how well this resume matches the job.

Given this ORIGINAL RESUME:
${resumeText.substring(0, 6000)}

And this TARGET JOB:
Title: ${jobTitle || "Not specified"}
Company: ${jobCompany || "Not specified"}
Description: ${jobDescription || "Not specified"}
Required Skills: ${(requiredSkills || []).join(", ")}
Candidate's Matching Skills: ${(matchedSkills || []).join(", ")}
Skills to Highlight/Add: ${(missingSkills || []).join(", ")}

CRITICAL SCORING RULES:
- Calculate ats_match_score as a REALISTIC percentage (0-100) of how well the resume matches THIS SPECIFIC job
- If the resume is for a completely different field (e.g., software developer resume for data analyst job), score should be 20-40%
- If partially relevant but missing key skills, score should be 40-65%
- If well matched with minor gaps, score should be 65-85%
- Only score 85-100% if the resume is an excellent match
- Set is_good_match to false if score is below 50%
- If not a good match, explain WHY in mismatch_reason and suggest what kind of roles this resume IS suited for

Optimize the resume for this specific job. Focus on:
1. Rewriting the professional summary to target this role
2. Reordering and rewording experience bullets to emphasize relevant achievements
3. Adding ATS-friendly keywords from the job description
4. Highlighting matched skills prominently
5. Suggesting how to address missing skills (transferable experience, willingness to learn)
6. Quantifying achievements where possible
7. Provide actionable tips including specific keywords to manually add to their resume before applying`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert resume writer and ATS optimization specialist. Be honest and realistic about match quality. Return structured JSON only." },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_optimized_resume",
              description: "Return the optimized resume content with honest scoring",
              parameters: {
                type: "object",
                properties: {
                  ats_match_score: { type: "number", description: "Realistic ATS match score 0-100. Be honest - different field = 20-40, partial match = 40-65, good match = 65-85, excellent = 85-100" },
                  is_good_match: { type: "boolean", description: "True only if score >= 50 and resume is reasonably relevant to the job" },
                  mismatch_reason: { type: "string", description: "If not a good match, explain why and suggest better-suited roles. Empty string if good match." },
                  optimized_summary: { type: "string", description: "Rewritten professional summary targeting this job" },
                  optimized_experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        duration: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "company", "bullets"],
                      additionalProperties: false,
                    },
                  },
                  optimized_skills_section: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        skills: { type: "array", items: { type: "string" } },
                      },
                      required: ["category", "skills"],
                      additionalProperties: false,
                    },
                  },
                  ats_keywords: { type: "array", items: { type: "string" }, description: "Top ATS keywords to include" },
                  keywords_to_add_manually: { type: "array", items: { type: "string" }, description: "Specific keywords the user should add to their resume before applying" },
                  improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "What was improved" },
                        original: { type: "string", description: "Brief description of original" },
                        optimized: { type: "string", description: "Brief description of change" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["area", "original", "optimized", "impact"],
                      additionalProperties: false,
                    },
                  },
                  match_improvement: { type: "number", description: "Estimated match score improvement (0-20 points)" },
                  tips: { type: "array", items: { type: "string" }, description: "Actionable tips including specific keywords to add" },
                },
                required: ["ats_match_score", "is_good_match", "mismatch_reason", "optimized_summary", "optimized_experience", "optimized_skills_section", "ats_keywords", "keywords_to_add_manually", "improvements", "match_improvement", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_optimized_resume" } },
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
        return new Response(JSON.stringify({ success: true, data: JSON.parse(jsonMatch[0]) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No structured data returned from AI");
    }

    const parsedData = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("optimize-resume error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to optimize resume" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
