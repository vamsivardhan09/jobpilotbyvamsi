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
    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Resume text is required and must be at least 20 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume analyst. Given resume text, extract structured data. Return ONLY valid JSON with no extra text.`;

    const userPrompt = `Analyze this resume and extract structured data:

${resumeText.substring(0, 8000)}

Return a JSON object with these fields:
{
  "full_name": "string",
  "headline": "short professional headline",
  "experience_level": "intern|junior|mid|senior|lead|principal",
  "skills": [
    { "name": "skill name", "category": "language|framework|tool|database|cloud|soft_skill|other", "proficiency": "beginner|intermediate|advanced|expert" }
  ],
  "preferred_roles": ["role1", "role2"],
  "experience_summary": "2-3 sentence summary of experience",
  "years_of_experience": number,
  "education": [{ "degree": "string", "institution": "string", "year": "string" }],
  "work_history": [{ "title": "string", "company": "string", "duration": "string", "highlights": ["string"] }]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_data",
              description: "Extract structured data from a resume",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  headline: { type: "string" },
                  experience_level: { type: "string", enum: ["intern", "junior", "mid", "senior", "lead", "principal"] },
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string", enum: ["language", "framework", "tool", "database", "cloud", "soft_skill", "other"] },
                        proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
                      },
                      required: ["name", "category", "proficiency"],
                      additionalProperties: false,
                    },
                  },
                  preferred_roles: { type: "array", items: { type: "string" } },
                  experience_summary: { type: "string" },
                  years_of_experience: { type: "number" },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        degree: { type: "string" },
                        institution: { type: "string" },
                        year: { type: "string" },
                      },
                      required: ["degree", "institution"],
                      additionalProperties: false,
                    },
                  },
                  work_history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        duration: { type: "string" },
                        highlights: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "company"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["full_name", "headline", "experience_level", "skills", "preferred_roles", "experience_summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ success: true, data: parsed }), {
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
    console.error("analyze-resume error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze resume" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
