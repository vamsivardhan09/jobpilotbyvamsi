import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, interviewType, jobRole, conversationHistory, resumeContext } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_question") {
      systemPrompt = `You are a professional, friendly technical interviewer conducting a realistic mock interview. You have thoroughly reviewed the candidate's resume.

Your interview style:
- Be warm, conversational, and encouraging — like a real senior interviewer at a top company
- Ask ONE question at a time, then wait for the answer
- After asking a question, briefly explain what the candidate should include in their answer (bullet points of key things to mention)
- Suggest an ideal answer length (e.g., "Keep your answer around 1-2 minutes")
- Reference specific items from the resume (project names, technologies, companies, skills)
- Mix question types: introduction, behavioral (STAR method), technical deep-dives, project discussions, problem-solving, system design
- Adapt follow-up questions based on the candidate's previous answers
- If the candidate gives a weak or vague answer, politely guide them on how to improve it before moving on
- Challenge the candidate with progressively harder questions
- Never ask multiple questions at once

${resumeContext ? `CANDIDATE'S RESUME:\n${resumeContext}` : ""}

IMPORTANT: Output ONLY your spoken words as an interviewer. No labels, no markdown formatting, no asterisks. Speak naturally as an interviewer would in a real conversation.
If this is the first question, greet the candidate BY NAME, mention something specific from their resume, then ask "Tell me about yourself" and explain what to include.`;

      userPrompt = conversationHistory?.length
        ? `Previous conversation:\n${conversationHistory.map((m: any) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n")}\n\nBased on what the candidate just said, either ask a relevant follow-up question or move to a new topic from their resume. After asking, briefly explain what a good answer should include. Speak naturally, no formatting.`
        : "Start the interview. Greet the candidate by name, mention something specific from their resume, then ask them to introduce themselves. Explain what they should include in their introduction (background, technologies, key projects, role they're looking for). Suggest keeping it to 1-2 minutes.";

    } else if (action === "evaluate_answer") {
      systemPrompt = `You are an expert interview evaluator. Evaluate the candidate's answer strictly but fairly.
You MUST respond using the tool provided.
${resumeContext ? `Resume context: ${resumeContext}` : ""}`;

      userPrompt = `Interview type: ${interviewType}
Job role: ${jobRole}
Question: ${conversationHistory[conversationHistory.length - 2]?.content}
Answer: ${conversationHistory[conversationHistory.length - 1]?.content}

Evaluate this answer. Generate a follow-up question that digs deeper into the topic or pivots to another resume item.`;

    } else if (action === "generate_report") {
      systemPrompt = `You are an interview performance analyst. Generate a comprehensive interview report.
You MUST respond using the tool provided.`;

      userPrompt = `Interview type: ${interviewType}
Job role: ${jobRole}
Full conversation:
${conversationHistory.map((m: any) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n")}

Generate a detailed performance report.`;
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
              score: { type: "number", description: "Score out of 10" },
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
          description: "Return structured interview performance report",
          parameters: {
            type: "object",
            properties: {
              total_score: { type: "number" },
              communication_score: { type: "number" },
              technical_score: { type: "number" },
              confidence_score: { type: "number" },
              problem_solving_score: { type: "number" },
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
      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = result.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return new Response(JSON.stringify({ success: true, data: JSON.parse(jsonMatch[0]) }), {
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
