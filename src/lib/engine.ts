import { Chess, type Move } from "chess.js";

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evaluate(game: Chess): number {
  let score = 0;
  for (const row of game.board()) {
    for (const sq of row) {
      if (!sq) continue;
      const v = VALUES[sq.type] ?? 0;
      score += sq.color === "w" ? v : -v;
    }
  }
  return score;
}

function search(game: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) return maximizing ? -100000 - depth : 100000 + depth;
    if (game.isGameOver()) return 0;
    return evaluate(game);
  }
  const moves = game.moves({ verbose: true }) as Move[];
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      game.move(m);
      best = Math.max(best, search(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    game.move(m);
    best = Math.min(best, search(game, depth - 1, alpha, beta, true));
    game.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export type Difficulty = "casual" | "club" | "master";

const DEPTH: Record<Difficulty, number> = { casual: 1, club: 2, master: 3 };

export function chooseMove(fen: string, difficulty: Difficulty): string | null {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  if (difficulty === "casual" && Math.random() < 0.35) {
    return moves[Math.floor(Math.random() * moves.length)]!.san;
  }

  const maximizing = game.turn() === "w";
  let best: Move | null = null;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const m of moves) {
    game.move(m);
    const score = search(game, DEPTH[difficulty] - 1, -Infinity, Infinity, !maximizing);
    game.undo();
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return (best ?? moves[0]!).san;
}
