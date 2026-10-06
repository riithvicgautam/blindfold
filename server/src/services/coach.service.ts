import { env } from "../config/env.js";
import { analyticsRepository } from "../repositories/analytics.repository.js";
import type { CoachHintInput } from "../schemas/coach.schema.js";
import { aiHintService } from "./ai-hint.service.js";
import { generateHint } from "./hint-engine.service.js";

/** Deterministic score multiplier for the number of hints used in a game. */
export function scoreMultiplier(hintsUsed: number): number {
  const table = env.HINT_PENALTIES;
  return table[Math.min(hintsUsed, table.length - 1)] ?? 0;
}

export type CoachReply =
  | {
      kind: "hint";
      text: string;
      source: "ai" | "template";
      topicKey: string;
      level: number;
      maxLevel: number;
      hintsUsed: number;
      scoreMultiplier: number;
    }
  | { kind: "clarify"; text: string; options: string[]; hintsUsed: number; scoreMultiplier: number }
  | { kind: "unknown"; text: string; hintsUsed: number; scoreMultiplier: number };

export const coachService = {
  async hint(input: CoachHintInput, userId: string | undefined): Promise<CoachReply> {
    const result = generateHint(input);

    if (result.kind !== "hint") {
      return { ...result, hintsUsed: input.hintsUsed, scoreMultiplier: scoreMultiplier(input.hintsUsed) };
    }

    const { clue } = result;
    // Escalating past the cap does not cost another hint.
    const counted = !input.previous || input.previous.topicKey !== clue.topicKey || input.previous.level < clue.level;
    const hintsUsed = input.hintsUsed + (counted ? 1 : 0);
    const phrased = await aiHintService.phrase(clue);

    if (userId) {
      await analyticsRepository
        .createReviewEvent({
          userId,
          sessionId: input.sessionId ?? null,
          kind: "coach_hint",
          correct: false,
          hintUsed: true,
          responseMs: input.responseMs ?? 0,
          payload: {
            question: input.question.slice(0, 200),
            piece: clue.pieceLabel,
            topicKey: clue.topicKey,
            hintLevel: clue.level,
            hintsUsed,
            source: phrased.source,
          },
        })
        .catch(() => undefined); // persistence must never break gameplay
    }

    return {
      kind: "hint",
      text: phrased.text,
      source: phrased.source,
      topicKey: clue.topicKey,
      level: clue.level,
      maxLevel: clue.maxLevel,
      hintsUsed,
      scoreMultiplier: scoreMultiplier(hintsUsed),
    };
  },
};
