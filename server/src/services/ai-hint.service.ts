import { env } from "../config/env.js";
import type { ApprovedClue } from "./hint-engine.service.js";

/**
 * Isolated LLM wrapper. It only ever receives an already-approved clue and
 * rephrases it. Any output that introduces chess coordinates not present in
 * the approved clue is rejected and the deterministic text is used instead.
 */

const COORD_PATTERN = /\b([a-h][1-8]|[a-h]-file|(first|second|third|fourth|fifth|sixth|seventh|eighth) rank|kingside|queenside)\b/gi;

function coordinates(text: string): Set<string> {
  return new Set((text.match(COORD_PATTERN) ?? []).map((t) => t.toLowerCase()));
}

function isFaithful(output: string, clue: ApprovedClue): boolean {
  const allowed = coordinates(clue.text);
  for (const c of coordinates(output)) if (!allowed.has(c)) return false;
  return output.length > 0 && output.length <= 240;
}

export const aiHintService = {
  isEnabled(): boolean {
    return Boolean(env.AI_API_KEY);
  },

  async phrase(clue: ApprovedClue): Promise<{ text: string; source: "ai" | "template" }> {
    if (!env.AI_API_KEY) return { text: clue.text, source: "template" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    try {
      const res = await fetch(`${env.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${env.AI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: env.AI_MODEL,
          temperature: 0.4,
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content:
                "You are a calm blindfold-chess visualization coach. Rephrase the given clue as one short, encouraging sentence. " +
                "Never add squares, files, ranks, sides of the board, moves or any fact not in the clue. Never give advice about what to play.",
            },
            {
              role: "user",
              content: JSON.stringify({ piece: clue.pieceLabel, allowedClue: clue.text, hintLevel: clue.level }),
            },
          ],
        }),
      });
      if (!res.ok) return { text: clue.text, source: "template" };
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const out = data.choices?.[0]?.message?.content?.trim() ?? "";
      return isFaithful(out, clue) ? { text: out, source: "ai" } : { text: clue.text, source: "template" };
    } catch {
      return { text: clue.text, source: "template" };
    } finally {
      clearTimeout(timer);
    }
  },
};
