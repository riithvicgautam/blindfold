import { apiClient } from "./client";

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

export const coachApi = {
  hint: (body: {
    fen: string;
    question: string;
    previous?: { topicKey: string; level: number };
    hintsUsed: number;
    responseMs?: number;
  }) => apiClient.post<CoachReply>("/coach/hint", body),
};
