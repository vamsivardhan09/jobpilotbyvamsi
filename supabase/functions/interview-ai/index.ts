import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Clamp a score to 0-10 range
function clampScore(val: any, fallback = 5): number {
  const n = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(n)) return fallback;
  // If AI returned a 0-100 scale, normalize to 0-10
  if (n > 10) return Math.min(10, Math.round(n / 10));
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, interviewType, jobRole, conversationHistory, resumeContext } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_question") {
      systemPrompt = `You are a real interviewer having a natural conversation with a candidate. You've read their resume.

Rules:
- Keep every question to 1-2 sentences MAX. Be concise.
- Sound like a real person talking, not a robot or a textbook.
- Ask ONE question at a time. Wait for the answer.
- Do NOT explain what the candidate should say or how to structure their answer.
- Do NOT give tips, bullet points, or coaching during the interview.
- Use the resume naturally — mention projects or tech casually, not formally.
- Progress from intro → projects → technical → problem-solving → system design.
- If an answer is vague, ask a short follow-up to dig deeper. Don't lecture.
- Be warm but professional. Brief reactions are okay ("Got it.", "Interesting.", "Nice.").

${resumeContext ? `CANDIDATE'S RESUME:\n${resumeContext}` : ""}

CRITICAL: Output ONLY spoken words. No markdown, no asterisks, no labels, no bullet points. Short and conversational. Think of how a real person talks in an interview — not an essay.`;

      userPrompt = conversationHistory?.length
        ? `Previous conversation:\n${conversationHistory.map((m: any) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n")}\n\nAsk your next question. Keep it short — one or two sentences max. React briefly to what they said if appropriate, then ask. No explanations or tips.`
        : "Greet the candidate by first name. Casually mention one thing from their resume. Then ask them to tell you about themselves. Keep the whole greeting to 2-3 short sentences. No tips on how to answer.";

    } else if (action === "evaluate_answer") {
      systemPrompt = `You are an expert interview evaluator. Evaluate the candidate's answer strictly but fairly.
You MUST respond using the tool provided.
IMPORTANT: All scores must be on a 0-10 scale. Never exceed 10.
${resumeContext ? `Resume context: ${resumeContext}` : ""}`;

      userPrompt = `Interview type: ${interviewType}
Job role: ${jobRole}
Question: ${conversationHistory[conversationHistory.length - 2]?.content}
Answer: ${conversationHistory[conversationHistory.length - 1]?.content}

Evaluate this answer. Score on a scale of 0-10 (never exceed 10). Generate a follow-up question that digs deeper into the topic or pivots to another resume item.`;

    } else if (action === "generate_report") {
      systemPrompt = `You are an interview performance analyst. Generate a comprehensive interview report.
You MUST respond using the tool provided.
CRITICAL: All scores MUST be on a 0-10 scale. Never output scores above 10. Use decimals like 7.5 if needed.`;

      userPrompt = `Interview type: ${interviewType}
Job role: ${jobRole}
Full conversation:
${conversationHistory.map((m: any) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n")}

Generate a detailed performance report. All scores must be 0-10. Do not exceed 10 for any score.`;
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (action === "evaluate_answer") {
      body.tools = [{
        type: "function",
        function: {
          name: "return_evaluation",
          description: "Return structured evaluation of the interview answer",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number", description: "Score from 0 to 10. Must not exceed 10." },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              suggested_answer: { type: "string" },
              follow_up_question: { type: "string", description: "Next interview question based on resume and conversation" },
            },
            required: ["score", "strengths", "improvements", "suggested_answer", "follow_up_question"],
            additionalProperties: false,
          }
        }
      }];
      body.tool_choice = { type: "function", function: { name: "return_evaluation" } };
    }

    if (action === "generate_report") {
      body.tools = [{
        type: "function",
        function: {
          name: "return_report",
          description: "Return structured interview performance report. All scores 0-10.",
          parameters: {
            type: "object",
            properties: {
              total_score: { type: "number", description: "0-10" },
              communication_score: { type: "number", description: "0-10" },
              technical_score: { type: "number", description: "0-10" },
              confidence_score: { type: "number", description: "0-10" },
              problem_solving_score: { type: "number", description: "0-10" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              recommended_topics: { type: "array", items: { type: "string" } },
              overall_feedback: { type: "string" },
            },
            required: ["total_score", "communication_score", "technical_score", "confidence_score", "problem_solving_score", "strengths", "improvements", "recommended_topics", "overall_feedback"],
            additionalProperties: false,
          }
        }
      }];
      body.tool_choice = { type: "function", function: { name: "return_report" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();

    if (action === "generate_question") {
      const text = result.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ success: true, question: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;

      // Normalize scores to 0-10 range
      if (action === "evaluate_answer" && parsed.score !== undefined) {
        parsed.score = clampScore(parsed.score);
      }
      if (action === "generate_report") {
        parsed.total_score = clampScore(parsed.total_score);
        parsed.communication_score = clampScore(parsed.communication_score);
        parsed.technical_score = clampScore(parsed.technical_score);
        parsed.confidence_score = clampScore(parsed.confidence_score);
        parsed.problem_solving_score = clampScore(parsed.problem_solving_score);
      }

      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = result.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Also normalize if found in raw content
      if (parsed.total_score !== undefined) parsed.total_score = clampScore(parsed.total_score);
      if (parsed.communication_score !== undefined) parsed.communication_score = clampScore(parsed.communication_score);
      if (parsed.technical_score !== undefined) parsed.technical_score = clampScore(parsed.technical_score);
      if (parsed.confidence_score !== undefined) parsed.confidence_score = clampScore(parsed.confidence_score);
      if (parsed.problem_solving_score !== undefined) parsed.problem_solving_score = clampScore(parsed.problem_solving_score);
      if (parsed.score !== undefined) parsed.score = clampScore(parsed.score);
      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: { text: content } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Interview AI error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
