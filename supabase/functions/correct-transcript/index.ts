import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    if (!transcript || transcript.trim().length < 3) {
      return new Response(JSON.stringify({ corrected: transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a transcript correction tool for software engineering interviews. Fix ONLY obvious speech-to-text errors in technical terms. Do NOT rephrase, summarize, or change the meaning. Return ONLY the corrected text with no explanation.

Common corrections:
- "react js" → "React.js"
- "node js" → "Node.js"
- "next js" → "Next.js"
- "rest a p i" or "rest api" → "REST API"
- "javascript" → "JavaScript"
- "typescript" → "TypeScript"
- "mongo d b" → "MongoDB"
- "post gres" or "postgres q l" → "PostgreSQL"
- "docker" → "Docker"
- "kubernetes" → "Kubernetes"
- "graph q l" → "GraphQL"
- "c i c d" → "CI/CD"
- "a w s" → "AWS"
- "j w t" → "JWT"
- "o auth" → "OAuth"
- "web socket" → "WebSocket"
- "dev ops" → "DevOps"
- "my sequel" → "MySQL"
- "redis" → "Redis"
- "tailwind" → "Tailwind"
- "sue pro base" or "super base" → "Supabase"
- "fire base" → "Firebase"

If nothing needs correction, return the text as-is.`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI correction failed:", response.status);
      return new Response(JSON.stringify({ corrected: transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const corrected = data.choices?.[0]?.message?.content?.trim() || transcript;

    return new Response(JSON.stringify({ corrected }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Transcript correction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
