import { z } from "zod";

export const coachHintSchema = z.object({
  fen: z.string().trim().min(10).max(120),
  question: z.string().trim().min(1, "Ask a question.").max(300),
  previous: z
    .object({ topicKey: z.string().max(60), level: z.number().int().min(0).max(10) })
    .optional(),
  hintsUsed: z.number().int().min(0).max(500).default(0),
  sessionId: z.string().uuid().optional(),
  responseMs: z.number().int().min(0).max(3_600_000).optional(),
});

export type CoachHintInput = z.infer<typeof coachHintSchema>;
