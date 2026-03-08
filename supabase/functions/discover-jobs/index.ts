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

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const skillNames = skills.map((s: any) => typeof s === "string" ? s : s.name);

    // Build search query from preferred roles and skills
    const roleQuery = preferredRoles?.length
      ? preferredRoles.slice(0, 2).join(" OR ")
      : skillNames.slice(0, 3).join(" ");

    const locationQuery = location || "United States";

    // Fetch real jobs from JSearch API
    const searchParams = new URLSearchParams({
      query: roleQuery,
      page: "1",
      num_pages: "1",
      date_posted: "month",
    });

    if (location) {
      searchParams.set("query", `${roleQuery} in ${locationQuery}`);
    }

    console.log("Searching JSearch for:", searchParams.get("query"));

    const jsearchResponse = await fetch(
      `https://jsearch.p.rapidapi.com/search?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (!jsearchResponse.ok) {
      const errorText = await jsearchResponse.text();
      console.error("JSearch API error:", jsearchResponse.status, errorText);
      if (jsearchResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`JSearch API error: ${jsearchResponse.status}`);
    }

    const jsearchData = await jsearchResponse.json();
    const rawJobs = jsearchData.data || [];

    if (rawJobs.length === 0) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to score each job against the candidate's skills
    const jobSummaries = rawJobs.slice(0, 12).map((job: any, i: number) => ({
      index: i,
      title: job.job_title,
      company: job.employer_name,
      description: (job.job_description || "").substring(0, 500),
    }));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a skill matching engine. Given candidate skills and job listings, determine which candidate skills match each job and which skills are missing. Return structured data only.",
          },
          {
            role: "user",
            content: `Candidate skills: ${skillNames.join(", ")}
Experience level: ${experienceLevel || "not specified"}

Score these jobs (0-100 match score based on skill overlap):
${JSON.stringify(jobSummaries)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_scores",
              description: "Return match scores for each job",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number" },
                        match_score: { type: "number" },
                        matched_skills: { type: "array", items: { type: "string" } },
                        missing_skills: { type: "array", items: { type: "string" } },
                        required_skills: { type: "array", items: { type: "string" } },
                      },
                      required: ["index", "match_score", "matched_skills", "missing_skills", "required_skills"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["scores"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_scores" } },
      }),
    });

    let scoreMap: Record<number, any> = {};

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        for (const s of (parsed.scores || [])) {
          scoreMap[s.index] = s;
        }
      }
    } else {
      console.warn("AI scoring failed, using basic matching");
    }

    // Combine real job data with AI scores
    const jobs = rawJobs.slice(0, 12).map((job: any, i: number) => {
      const score = scoreMap[i];
      const salaryMin = job.job_min_salary;
      const salaryMax = job.job_max_salary;
      const salaryCurrency = job.job_salary_currency || "USD";
      const salaryPeriod = job.job_salary_period || "";

      let salaryRange = null;
      if (salaryMin && salaryMax) {
        salaryRange = `${salaryCurrency === "USD" ? "$" : salaryCurrency}${Math.round(salaryMin / 1000)}k-${Math.round(salaryMax / 1000)}k${salaryPeriod ? ` ${salaryPeriod}` : ""}`;
      } else if (salaryMin) {
        salaryRange = `From ${salaryCurrency === "USD" ? "$" : salaryCurrency}${Math.round(salaryMin / 1000)}k`;
      }

      return {
        title: job.job_title || "Unknown Title",
        company: job.employer_name || "Unknown Company",
        location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") || (job.job_is_remote ? "Remote" : "Unknown"),
        description: (job.job_description || "").substring(0, 300) + "...",
        salary_range: salaryRange,
        match_score: score?.match_score ?? 50,
        required_skills: score?.required_skills ?? [],
        matched_skills: score?.matched_skills ?? [],
        missing_skills: score?.missing_skills ?? [],
        apply_url: job.job_apply_link || null,
      };
    });

    // Sort by match score descending
    jobs.sort((a: any, b: any) => b.match_score - a.match_score);

    return new Response(JSON.stringify({ success: true, data: jobs }), {
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
