import { config } from "../config.js";

/**
 * Optional LLM rephrasing (Gemini or Groq). The model only ever receives a
 * clue that was already computed from the board. If it adds any coordinate
 * that wasn't in the clue, or anything goes wrong, the original text is used.
 */

const SYSTEM_PROMPT =
  "You are a calm blindfold-chess coach. Rephrase the given clue as one short, encouraging sentence. " +
  "Never add squares, files, ranks, board sides, moves or any fact that is not in the clue. Never suggest moves.";

const COORDS = /\b([a-h][1-8]|[a-h]-file|(first|second|third|fourth|fifth|sixth|seventh|eighth) rank|kingside|queenside)\b/gi;
const coordsIn = (t) => new Set((t.match(COORDS) || []).map((c) => c.toLowerCase()));

export function isFaithful(output, clueText) {
  if (!output || output.length > 240) return false;
  const allowed = coordsIn(clueText);
  for (const c of coordsIn(output)) if (!allowed.has(c)) return false;
  return true;
}

async function callGemini(text, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", "x-goog-api-key": config.geminiApiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: `Clue: ${text}` }] }],
      generationConfig: { maxOutputTokens: 60, temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function callGroq(text, signal) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${config.groqApiKey}` },
    body: JSON.stringify({
      model: config.groqModel,
      max_tokens: 60,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Clue: ${text}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function activeProvider() {
  if (config.aiProvider === "gemini" && config.geminiApiKey) return callGemini;
  if (config.aiProvider === "groq" && config.groqApiKey) return callGroq;
  return null;
}

/** Returns { text, source: "ai" | "template" }. Never throws. */
export async function phrase(clueText) {
  const call = activeProvider();
  if (!call) return { text: clueText, source: "template" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);
  try {
    const out = await call(clueText, controller.signal);
    return isFaithful(out, clueText) ? { text: out, source: "ai" } : { text: clueText, source: "template" };
  } catch (err) {
    console.warn("AI rephrase failed, using template:", err.message);
    return { text: clueText, source: "template" };
  } finally {
    clearTimeout(timer);
  }
}
