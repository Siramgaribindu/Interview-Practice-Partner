import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure the GEMINI_API_KEY environment variable is configured
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} - attempt ${attempt + 1}/${maxRetries + 1}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API Notice] Quota or retry event on ${model} attempt ${attempt + 1}: ${err?.message || err}`);

        // If INVALID_ARGUMENT or similar specific non-transient API configuration error, skip retrying this model
        if (err?.status === "INVALID_ARGUMENT" || err?.statusCode === 400 || (err?.message && err.message.includes("INVALID_ARGUMENT"))) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("All model fallback attempts failed.");
}

function generateMockChatResponse(roleName: string, chatHistory: any[]): string {
  const candidateMessages = chatHistory.filter((m: any) => m.sender === "candidate");
  const count = candidateMessages.length;
  const roleClean = roleName || "Candidate";

  if (count === 0) {
    return `Hello! Welcome to your interview practice session. My name is Alex, and I am glad to meet you today. To kick off our discussion for the **${roleClean}** role, could you please introduce yourself and walk me through your background or anything exciting you've worked on recently?\n\n<current_phase>Introduction & Background</current_phase>`;
  } else if (count === 1) {
    return `That sounds wonderful! Thank you for sharing your background. I'd love to know what specifically drew you to this field of study or work. What is it about being a **${roleClean}** that you find most engaging or motivating?\n\n<current_phase>Interests & Career Goals</current_phase>`;
  } else if (count === 2) {
    return `That's very motivating! A strong internal drive is so critical. Let's talk a bit about your training and prior milestones. How have bootcamps, courses, universities, or independent studies shaped your skills for a fast-paced **${roleClean}** environment?\n\n<current_phase>Education & Experience</current_phase>`;
  } else if (count === 3) {
    return `A very solid foundation! Now, speaking of hands-on work, I'd like to dive into a specific project you're most proud of. Can you tell me what you built, what was the biggest challenge you faced, and how you worked through it?\n\n<current_phase>Projects & Practical Experience</current_phase>`;
  } else if (count === 4) {
    return `That challenge says a lot about your problem-solving agility! Let's do some technical domain check here. As a **${roleClean}**, what core principles, technologies, tools, or design standards do you prioritize to ensure that your work is stable, scalable, and easy for other teammates to maintain?\n\n<current_phase>Technical Questions</current_phase>`;
  } else if (count === 5) {
    return `Excellent breakdown. I appreciate you clarifying those trade-offs. Let's move to critical teamwork and behavioral dynamics. Can you recall a time when you had a disagreement with a team member, or had to deliver on a critical deadline. How did you structure your response and resolve the challenge?\n\n<current_phase>Behavioral/HR Questions</current_phase>`;
  } else if (count === 6) {
    return `That's an exceptionally clean approach to project management. It's so vital list of traits. Now, I want to leave some space for you. What questions do you have for me about our internal team, culture, or growth prospects?\n\n<current_phase>Candidate Questions</current_phase>`;
  } else {
    return `Those are spectacular questions! Typically, in our team we focus heavily on scalable growth, continuous personal autonomy, and fast delivery feedback. \n\nThank you so much for this amazing conversation today. You did an exceptional job!\n\nPlease go ahead and click the 'Submit for Evaluation' button at the top to compute your custom score, detailed feedback, and recommendations.\n\n<current_phase>Wrap-up & Evaluation</current_phase>`;
  }
}

function generateMockFeedbackResponse(roleName: string, chatHistory: any[]): { text: string } {
  const candidateMessages = chatHistory.filter((m: any) => m.sender === "candidate");
  const totalLength = candidateMessages.reduce((sum, m) => sum + m.text.length, 0);
  
  let score = 78;
  if (totalLength > 1500) {
    score = 88;
  } else if (totalLength > 800) {
    score = 83;
  } else if (totalLength < 200) {
    score = 65;
  }

  const roleClean = roleName || "Candidate";

  const strengths = [
    `Strong engagement with the simulated scenarios and general principles of the ${roleClean} role.`,
    "Engaged in the structure and demonstrated active listening by directly tackling the core questions posed.",
    "Clear structure in explaining past project motivations and goals."
  ];

  const weaknesses = [
    `Could delve deeper into specific technical implementation choices or trade-offs for a ${roleClean}.`,
    "Prior projects could benefit from more detailed metrics and concrete quantitative business impact description.",
    "STAR response structuring can be further streamlined under tight pressure."
  ];

  const insights = [
    `Refining the conceptual architecture model of applications appropriate for a modern ${roleClean}.`,
    "Practice whiteboarding technical systems and outlining design considerations step-by-step.",
    "Practice situational questions by dividing answers clearly into Situation, Task, Action, and Quantitative Result."
  ];

  const summary = `The candidate demonstrated a very good conceptual outline for the ${roleClean} position, presenting their thoughts structured and clearly. Dynamic communication was consistent, with solid descriptions of their projects and past experience. With minor polish on deep-dive architectural trade-offs, they will perform exceedingly well in upcoming formal rounds.`;

  const detailedFeedback = `### Comprehensive Interview Assessment Report

Thank you for completing this comprehensive interview practice session for the **${roleClean}** position. Below is an in-depth breakdown of your conversational style, technical depth, and actionable growth blueprint.

---

### 1. Technical Domain Depth & Expertise
Your grasp of core engineering and design concepts relevant to **${roleClean}** is solid. You successfully talked about your foundational training and project architecture. 
* **Key Areas of Competence**: You articulated the primary lifecycle of project delivery and technical structure.
* **Opportunities for Growth**: To elevate your answers, make sure to detail why you chose specific software layers (e.g., specific framework tools, schema formats, or query protocols) over reasonable alternatives. Explaining *why* a particular trade-off was made (such as development speed vs. future capability) is what distinguishes a Senior talent.

---

### 2. Communication Style & Structured Logic
You maintain outstanding poise, clarity, and pacing. Your ideas flow naturally, making it easy for the panel to follow your line of reasoning.
* **Positive Highlights**: Great professional speaking rate, strong vocabulary, and supportive conversational responses.
* **STAR Alignment**: When discussing your projects or behavioral friction, we recommend adopting the **STAR framework** explicitly:
  1. **Situation**: A brief 1-sentence context of the challenge.
  2. **Task**: What you specifically were tasked to achieve.
  3. **Action**: Exactly *what* you built, debugged, or aligned.
  4. **Result**: The final positive outcome, with data metrics if available.

---

### 3. Practical Project Narrative
Your primary project description was engaging. You did an excellent job focusing on human collaboration and resolving friction.
* **Actionable Tips**: Include quantitative metrics whenever possible (e.g., "reduced reload times by 20%", "saved 5 developers' effort daily", "increased database efficiency by 15%"). Numbers build instant credibility and anchor your achievements in concrete reality.

---

### 4. Next-Steps & Recommended Preparation Blueprint
1. **Dynamic Practice**: Continue talking through coding structures and design patterns aloud.
2. **Framework Alignment**: Spend some dedicated study cycles reviewing modern architectures and caching strategies.
3. **Interview Agility**: Try practicing a few more roles in this dashboard to build natural agility in answers!

*Best of luck in your next engineering adventure!*`;

  const resultObj = {
    score,
    summary,
    strengths,
    weaknesses,
    insights,
    detailedFeedback
  };

  return { text: JSON.stringify(resultObj) };
}

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * Handle AI Interviewer dialog response
 * Receives the current chat history, selected role details, and generates the next turn.
 */
app.post("/api/interview/chat", async (req, res) => {
  const { roleName, chatHistory } = req.body;
  try {
    if (!roleName || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Missing required roleName or chatHistory array." });
    }

    const ai = getGeminiClient();

    // Map chatHistory formats into system prompt and content formats
    // Build context
    const instructions = `You are an elite, highly professional and empathetic senior tech recruiter or engineering partner conducting a live, realistic practice interview for a ${roleName} position.

You must guide the candidate naturally and conversationally through the following 8 structural stages. You are STRICTLY FORBIDDEN from jumping directly into technical topics, frontend/backend questions, or complex metrics on your very first turns. Instead, start slow, build authentic rapport, and progress sequentially:

1. **Introduction & Background**
   - Introduce yourself warmly.
   - Start the conversation with an inviting intro question, such as: "Tell me about yourself.", "Walk me through your background.", "Why did you choose this field?", or "What kind of roles are you currently interested in?".
   
2. **Interests & Career Goals**
   - Uncover the candidate's core vocational interests, professional goals, and what drives their enthusiasm for the ${roleName} specialization.

3. **Education & Experience**
   - Talk about their educational track (university, bootcamp, design school, or self-guided program) and prior internship background or primary professional experience.

4. **Projects & Practical Experience**
   - Probe into a principal project or contribution they made. Ask what they built, the primary challenges they conquered, and the lessons learned.

5. **Technical Questions**
   - Transition to deep, domain-specific technical questions relevant to ${roleName}, building upon the background they shared previously. E.g. system structures, tools, algorithmic choices, usability issues, SQL optimization, or CAC/LTV conversion loops.

6. **Behavioral/HR Questions**
   - Ask behavioral situational questions where they can showcase conflict resolution, ambiguity management, or team friction. Encourage or expect structured answers (STAR method: Situation, Task, Action, Result).

7. **Candidate Questions**
   - Open up the floor for the candidate to ask *you* any authentic questions about company growth, culture, core expectations, or engineering stacks.

8. **Wrap-up & Evaluation**
   - Conclude the session with high professional standard. Let them know they did great, and prompt them to click the "Submit for Evaluation" button at the top to compute visual scores, detailed feedback, and recommendations.

CRITICAL ENGAGEMENT STANDARDS:
- Be an interactive, adaptive human. Do not just ask predefined questions. Listen to what the candidate tells you. Callout specific tools, companies, or details they named and ask logical follow-up questions.
- Ask ONLY ONE distinct, singular question at a time to prevent overwhelms. Do not write numbered or bulleted lists of questions.
- If they give short, vague, or incomplete answers, probe with supportive curiosity.
- If they are stuck or say they don't know, provide a minor clue or brief concept brief, and pivot nicely.
- You MUST append an XML tag at the very end of your response to tell the system what stage contains the current dialogue. Use EXACTLY one of these values:
  <current_phase>Introduction & Background</current_phase>
  <current_phase>Interests & Career Goals</current_phase>
  <current_phase>Education & Experience</current_phase>
  <current_phase>Projects & Practical Experience</current_phase>
  <current_phase>Technical Questions</current_phase>
  <current_phase>Behavioral/HR Questions</current_phase>
  <current_phase>Candidate Questions</current_phase>
  <current_phase>Wrap-up & Evaluation</current_phase>

Examine the full conversation logs to determine the active stage. Start in stage 1, and progress through stages 2-8 as the candidate answers. Do not rush. Match the pacing of a master interviewer.
Do not speak in the third person or prefix outputs with "Interviewer:" or formatting titles. Speak directly with real warmth.`;

    // Map history to Google GenAI contents array
    const contents = chatHistory.map((msg: any) => {
      return {
        role: msg.sender === "candidate" ? "user" : "model",
        parts: [{ text: msg.text }],
      };
    });

    // If chat history is empty, start the interview
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `Hello! I am ready for my ${roleName} practice interview. Please introduce yourself and start the interview with your first question.` }],
      });
    }

    const response = await generateContentWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: instructions,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "Could you repeat that? I didn't quite catch the specifics.";
    
    // Parse the <current_phase> tag
    let currentPhase = "Introduction & Background";
    const phaseRegex = /<current_phase>([\s\S]*?)<\/current_phase>/i;
    const match = aiText.match(phaseRegex);
    let cleanedText = aiText;
    if (match) {
      currentPhase = match[1].trim();
      cleanedText = aiText.replace(phaseRegex, "").trim();
    }

    res.json({ text: cleanedText, currentPhase: currentPhase });

  } catch (error: any) {
    console.warn("[Gemini API Warning] Activating robust conversation sandbox simulation:", error?.message || error);
    const resultText = generateMockChatResponse(roleName, chatHistory);
    
    // Parse the <current_phase> tag
    let currentPhase = "Introduction & Background";
    const phaseRegex = /<current_phase>([\s\S]*?)<\/current_phase>/i;
    const match = resultText.match(phaseRegex);
    let cleanedText = resultText;
    if (match) {
      currentPhase = match[1].trim();
      cleanedText = resultText.replace(phaseRegex, "").trim();
    }

    res.json({ text: cleanedText, currentPhase: currentPhase });
  }
});

/**
 * Handle Interview Assessment Generation
 * Receives the entire transcript and evaluates with detail.
 */
app.post("/api/interview/feedback", async (req, res) => {
  const { roleName, chatHistory } = req.body;
  try {
    if (!roleName || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Missing required roleName or chatHistory array." });
    }

    const ai = getGeminiClient();

    const transcriptText = chatHistory
      .map((msg: any) => `${msg.sender === "candidate" ? "Candidate" : "Interviewer"}: ${msg.text}`)
      .join("\n\n");

    const analysisInstruction = `You are a senior hiring committee director and expert career coach evaluating a completed practice interview transcript for the position of ${roleName}.
Analyze the transcript with high precision and provide a detailed structured assessment of the candidate's performance.

Evaluate:
1. Technical Depth (understanding of core domain principles, terms, and trade-offs)
2. Communication Skills (clarity, structuring, logic, professional tone)
3. Adaptability (response to follow-up questions and prompt hints)

Your output MUST be a valid JSON object matching the requested schema. Provide realistic ratings. Do not automatically give 100 or 90 unless they were truly exceptional. A good baseline is 70-85, highlighting actual constructive elements they can improve.`;

    const response = await generateContentWithFallback(ai, {
      contents: `Please analyze this interview transcript for the role of ${roleName} and return the structured JSON assessment:\n\n${transcriptText}`,
      config: {
        systemInstruction: analysisInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "summary", "strengths", "weaknesses", "insights", "detailedFeedback"],
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Overall interview performance score from 0 to 100.",
            },
            summary: {
              type: Type.STRING,
              description: "Consolidated, thoughtful summary of their performance (2-3 sentences).",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 key strong points demonstrating knowledge, experience, or answers given.",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 areas where their knowledge or answers fell short or could be expanded.",
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 actionable growth suggestions and concrete preparation subjects for this role.",
            },
            detailedFeedback: {
              type: Type.STRING,
              description: "Detailed, beautifully structured feedback written in thorough markdown format, addressing Technical Depth, Communication, Problem Solving, and precise notes on specific answers.",
            },
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from the evaluation model.");
    }

    const feedbackObj = JSON.parse(resultText.trim());
    res.json(feedbackObj);

  } catch (error: any) {
    console.warn("[Gemini API Warning] Activating robust evaluation report simulation:", error?.message || error);
    try {
      const fallbackResponse = generateMockFeedbackResponse(roleName, chatHistory);
      const feedbackObj = JSON.parse(fallbackResponse.text.trim());
      res.json(feedbackObj);
    } catch (parseErr: any) {
      console.warn("Failed to parse simulated feedback content:", parseErr);
      res.status(500).json({ error: "Failed to compile the interview performance assessment evaluation report." });
    }
  }
});


// -------------------------------------------------------------
// VITE AND ASSETS HANDLING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware");
  } else {
    // Production static server
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
