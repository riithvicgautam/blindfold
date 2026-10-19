import { apiClient } from "./client";

/**
 * @typedef {{ hintsUsed: number, score: number, penalty: number }} Scoring
 * @typedef {(Scoring & { kind: "hint", text: string, source: "ai" | "template", topicKey: string, level: number, maxLevel: number })
 *   | (Scoring & { kind: "clarify", text: string, options: string[] })
 *   | (Scoring & { kind: "info" | "unknown", text: string })} CoachReply
 */

export const coachApi = {
  /**
   * @param {{ fen: string, question: string, previous?: { topicKey: string, level: number }, hintsUsed: number, score: number, sessionId?: string, responseMs?: number }} body
   * @returns {Promise<CoachReply>}
   */
  hint: (body) => apiClient.post("/coach/hint", body),
};
