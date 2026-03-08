import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build multiple search queries for comprehensive coverage
function buildSearchQueries(skillNames: string[], preferredRoles: string[], location: string): string[] {
  const queries: string[] = [];

  // Role-based queries (India-first)
  if (preferredRoles?.length) {
    for (const role of preferredRoles.slice(0, 2)) {
      queries.push(`${role} jobs India apply`);
      queries.push(`${role} jobs remote hiring`);
    }
  }

  // Skill-based queries
  const topSkills = skillNames.slice(0, 3);
  if (topSkills.length > 0) {
    queries.push(`${topSkills.join(" ")} developer jobs India apply`);
    queries.push(`${topSkills[0]} developer fresher hiring India`);
    queries.push(`${topSkills.join(" ")} jobs remote apply`);
  }

  // Location-specific if provided
  if (location && location.toLowerCase() !== "india") {
    queries.push(`${preferredRoles?.[0] || topSkills[0]} jobs ${location} apply`);
  }

  return queries.slice(0, 5); // Max 5 queries
}

// Search jobs using Serper API
async function searchJobs(query: string, serperKey: string): Promise<any[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": serperKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Serper error:", response.status, errorText);
    if (response.status === 429) throw new Error("Rate limit exceeded");
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();
  const results: any[] = [];

  // Extract from organic results
  for (const item of (data.organic || [])) {
    const link = item.link || "";
    // Filter for job-related URLs from known job platforms and career pages
    if (isJobUrl(link)) {
      results.push({
        title: item.title || "",
        snippet: item.snippet || "",
        link,
        source: extractSource(link),
      });
    }
  }

  return results;
}

function isJobUrl(url: string): boolean {
  const jobDomains = [
    "linkedin.com/jobs", "linkedin.com/in/", "indeed.com", "indeed.co.in",
    "naukri.com", "glassdoor.com", "glassdoor.co.in",
    "wellfound.com", "internshala.com",
    "lever.co", "greenhouse.io", "workday.com", "smartrecruiters.com",
    "jobs.lever.co", "boards.greenhouse.io",
    "careers.", "jobs.", "/careers", "/jobs", "/apply",
  ];
  const lowerUrl = url.toLowerCase();
  return jobDomains.some(domain => lowerUrl.includes(domain));
}

function extractSource(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
  if (lowerUrl.includes("indeed.com") || lowerUrl.includes("indeed.co.in")) return "Indeed";
  if (lowerUrl.includes("naukri.com")) return "Naukri";
  if (lowerUrl.includes("glassdoor")) return "Glassdoor";
  if (lowerUrl.includes("wellfound.com")) return "Wellfound";
  if (lowerUrl.includes("internshala.com")) return "Internshala";
  if (lowerUrl.includes("lever.co")) return "Lever";
  if (lowerUrl.includes("greenhouse.io")) return "Greenhouse";
  try { return new URL(url).hostname.replace("www.", ""); } catch { return "Company"; }
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Parse job info from search result title/snippet
function parseJobInfo(result: any): { title: string; company: string; location: string } {
  const raw = result.title || "";
  // Common patterns: "Job Title - Company | Location", "Job Title at Company - Location"
  let title = raw;
  let company = result.source || "Unknown";
  let location = "";

  // Try "Title - Company" pattern
  const dashParts = raw.split(" - ");
  if (dashParts.length >= 2) {
    title = dashParts[0].trim();
    const rest = dashParts.slice(1).join(" - ");
    // Remove platform names from company
    const cleaned = rest.replace(/\| (LinkedIn|Indeed|Glassdoor|Naukri|Wellfound|Internshala).*/i, "").trim();
    if (cleaned) company = cleaned;
  }

  // Try "Title at Company" pattern
  if (dashParts.length < 2 && raw.includes(" at ")) {
    const atParts = raw.split(" at ");
    title = atParts[0].trim();
    company = atParts.slice(1).join(" at ").replace(/\|.*/g, "").trim();
  }

  // Extract location from snippet
  const snippet = result.snippet || "";
  const locMatch = snippet.match(/(?:Location|location|📍|in)\s*:?\s*([^.·,\n]+(?:,\s*[^.·,\n]+)?)/i);
  if (locMatch) location = locMatch[1].trim();

  // Check for India/Remote indicators
  if (!location) {
    if (snippet.toLowerCase().includes("india") || result.link?.includes(".co.in")) location = "India";
    else if (snippet.toLowerCase().includes("remote")) location = "Remote";
  }

  return { title: title.substring(0, 120), company: company.substring(0, 100), location };
}

// Determine location priority: India=3, Remote=2, International=1
function locationPriority(location: string, url: string): number {
  const lower = (location + " " + url).toLowerCase();
  if (lower.includes("india") || lower.includes(".co.in") || lower.includes("naukri") || lower.includes("internshala")) return 3;
  if (lower.includes("remote") || lower.includes("anywhere")) return 2;
  return 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, experienceLevel, preferredRoles, location, page = 1 } = await req.json();

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(
        JSON.stringify({ error: "Skills array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
    if (!SERPER_API_KEY) throw new Error("SERPER_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillNames = skills.map((s: any) => typeof s === "string" ? s : s.name);
    const queries = buildSearchQueries(skillNames, preferredRoles || [], location || "India");

    console.log("Running Serper queries:", queries);

    // Run all search queries in parallel
    const allResults = await Promise.all(
      queries.map(q => searchJobs(q, SERPER_API_KEY).catch(err => {
        console.warn("Query failed:", q, err.message);
        return [];
      }))
    );

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueResults: any[] = [];
    for (const results of allResults) {
      for (const r of results) {
        if (!isValidUrl(r.link) || seen.has(r.link)) continue;
        seen.add(r.link);
        uniqueResults.push(r);
      }
    }

    console.log(`Found ${uniqueResults.length} unique job URLs`);

    if (uniqueResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: [],
        total: 0,
        suggestions: [
          "Try adding more skills to your resume",
          "Expand your preferred job roles",
          "Check if your skills are in-demand keywords",
        ],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse job info from results
    const jobCandidates = uniqueResults.map(r => ({
      ...parseJobInfo(r),
      apply_url: r.link,
      source: r.source,
      snippet: r.snippet,
      location_priority: locationPriority(parseJobInfo(r).location, r.link),
    }));

    // Use AI to score jobs against candidate skills
    const jobSummaries = jobCandidates.slice(0, 20).map((job, i) => ({
      index: i,
      title: job.title,
      company: job.company,
      location: job.location,
      snippet: (job.snippet || "").substring(0, 300),
      source: job.source,
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
            content: `You are a job matching engine. Given candidate skills and job listings from search results, analyze each job and determine skill match. For each job, extract the likely required skills from the title/snippet, determine which candidate skills match, identify missing skills, and assign a match score (0-100). Only assign scores above 70 for strong skill overlap. Be strict about relevance.`,
          },
          {
            role: "user",
            content: `Candidate skills: ${skillNames.join(", ")}
Experience level: ${experienceLevel || "not specified"}

Score these job listings:
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
                        is_relevant: { type: "boolean" },
                      },
                      required: ["index", "match_score", "matched_skills", "missing_skills", "required_skills", "is_relevant"],
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

    // Combine and filter
    const jobs = jobCandidates.slice(0, 20).map((job, i) => {
      const score = scoreMap[i];
      return {
        title: job.title,
        company: job.company,
        location: job.location || "Unknown",
        description: job.snippet || "",
        salary_range: null as string | null,
        match_score: score?.match_score ?? 50,
        required_skills: score?.required_skills ?? [],
        matched_skills: score?.matched_skills ?? [],
        missing_skills: score?.missing_skills ?? [],
        apply_url: job.apply_url,
        source: job.source,
        location_priority: job.location_priority,
        is_relevant: score?.is_relevant ?? true,
      };
    })
    // Filter out irrelevant results
    .filter(job => job.is_relevant !== false)
    // Sort: location priority desc, then match score desc
    .sort((a, b) => {
      if (b.location_priority !== a.location_priority) return b.location_priority - a.location_priority;
      return b.match_score - a.match_score;
    });

    // Paginate
    const pageSize = 15;
    const start = (page - 1) * pageSize;
    const paginatedJobs = jobs.slice(start, start + pageSize);

    return new Response(JSON.stringify({
      success: true,
      data: paginatedJobs,
      total: jobs.length,
      page,
      hasMore: start + pageSize < jobs.length,
    }), {
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
