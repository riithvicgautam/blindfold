import { Chess } from "chess.js";

/**
 * Computer opponent (Black). Small minimax with alpha-beta pruning.
 * Completely separate from the coach — no LLM ever chooses moves.
 */

/** @typedef {"casual" | "club" | "master"} Difficulty */

const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const DEPTH = { casual: 1, club: 2, master: 3 };

/** @param {Chess} game */
function evaluate(game) {
  let score = 0;
  for (const row of game.board()) {
    for (const sq of row) {
      if (!sq) continue;
      score += sq.color === "w" ? VALUES[sq.type] : -VALUES[sq.type];
    }
  }
  return score;
}

/** @param {Chess} game @param {number} depth @param {number} alpha @param {number} beta @param {boolean} maximizing @returns {number} */
function search(game, depth, alpha, beta, maximizing) {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) return maximizing ? -100000 - depth : 100000 + depth;
    if (game.isGameOver()) return 0;
    return evaluate(game);
  }
  let best = maximizing ? -Infinity : Infinity;
  for (const m of game.moves({ verbose: true })) {
    game.move(m);
    const score = search(game, depth - 1, alpha, beta, !maximizing);
    game.undo();
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * @param {string} fen
 * @param {Difficulty} difficulty
 * @returns {string | null} the chosen move in SAN
 */
export function chooseMove(fen, difficulty) {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty === "casual" && Math.random() < 0.35) {
    return moves[Math.floor(Math.random() * moves.length)].san;
  }

  const maximizing = game.turn() === "w";
  let best = moves[0];
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
  return best.san;
}
