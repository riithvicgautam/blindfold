/**
 * Deterministic hint penalties. The score starts at 100 each game.
 *   level 1 (wing)   — broad      → -2
 *   level 2 (rank)   — specific   → -5
 *   level 3 (file)   — specific   → -5
 *   level 4 (square) — exact      → -10
 * Asking for the same clue again (already at the deepest level) is free.
 */
export const STARTING_SCORE = 100;
const PENALTY_BY_LEVEL = { 1: 2, 2: 5, 3: 5, 4: 10 };

export function penaltyFor(level, previous, topicKey) {
  const repeat = previous && previous.topicKey === topicKey && previous.level >= level;
  return repeat ? 0 : PENALTY_BY_LEVEL[level] ?? 0;
}

export function applyPenalty(score, penalty) {
  return Math.max(0, score - penalty);
}
