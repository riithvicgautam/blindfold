import { Chess } from "chess.js";

/**
 * Deterministic hint engine. chess.js is the only source of truth for where
 * pieces are. Every clue is computed here from the FEN — never by an LLM.
 */

const PIECE_WORDS = {
  pawn: "p", pawns: "p",
  knight: "n", knights: "n", horse: "n",
  bishop: "b", bishops: "b",
  rook: "r", rooks: "r", castle: "r",
  queen: "q", queens: "q",
  king: "k", kings: "k",
};
const PIECE_NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const FILES = "abcdefgh";
const RANKS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
export const MAX_LEVEL = 4;

const wingOf = (sq) => (FILES.indexOf(sq[0]) >= 4 ? "kingside" : "queenside");
const isLight = (sq) => (FILES.indexOf(sq[0]) + Number(sq[1])) % 2 === 1;
const owner = (color) => (color === "w" ? "your" : "your opponent's");
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function findPieces(game, type, color) {
  return game.board().flat().filter((c) => c && c.type === type && c.color === color);
}

/** A label that tells two same-type pieces apart (e.g. "kingside", "light-squared"). */
function selectorFor(piece, group, color) {
  if (new Set(group.map((g) => wingOf(g.square))).size === group.length) return wingOf(piece.square);
  if (new Set(group.map((g) => isLight(g.square))).size === group.length)
    return isLight(piece.square) ? "light-squared" : "dark-squared";
  const advance = (s) => (color === "w" ? Number(s[1]) : 9 - Number(s[1]));
  const sorted = [...group].sort((a, b) => advance(b.square) - advance(a.square));
  const i = sorted.findIndex((g) => g.square === piece.square);
  return i === 0 ? "most advanced" : i === sorted.length - 1 ? "least advanced" : null;
}

function parseColor(q) {
  return /\b(black|opponent|opponent's|their|enemy|engine)\b/.test(q) ? "b" : "w";
}

function parsePiece(q) {
  for (const word of q.split(/[^a-z]+/)) if (PIECE_WORDS[word]) return PIECE_WORDS[word];
  return null;
}

function parseSelector(q) {
  for (const s of ["light-squared", "dark-squared", "kingside", "queenside", "most advanced", "least advanced"]) {
    if (q.includes(s) || q.includes(s.replace("-", " "))) return s;
  }
  if (/\blight\b/.test(q)) return "light-squared";
  if (/\bdark\b/.test(q)) return "dark-squared";
  return null;
}

const isFollowUp = (q) => /\b(another|more|next|stronger|further|again)\b/.test(q) && !parsePiece(q);
const isCheckQuestion = (q) => /\b(in check|check\?|checked)\b/.test(q);

/** Progressive clue for one piece: wing → rank → file → exact square. */
function pieceClue(piece, selector, level, topicKey) {
  const label = `${owner(piece.color)} ${selector ? `${selector} ` : ""}${PIECE_NAMES[piece.type]}`;
  const sq = piece.square;
  const texts = {
    1: `${cap(label)} is on the ${wingOf(sq)}.`,
    2: `${cap(label)} is on the ${RANKS[Number(sq[1]) - 1]} rank.`,
    3: `${cap(label)} is on the ${sq[0]}-file.`,
    4: `${cap(label)} is on ${sq}.`,
  };
  return { pieceLabel: label, level, maxLevel: MAX_LEVEL, topicKey, text: texts[level] };
}

/**
 * Turn a question + the current FEN into a factual result.
 * `previous` ({ topicKey, level }) lets "another clue" go one level deeper.
 *
 * Returns one of:
 *   { kind: "hint", clue }               — a progressive clue (costs points)
 *   { kind: "info", text }               — a free fact (e.g. check status)
 *   { kind: "clarify", text, options }   — several pieces match
 *   { kind: "unknown", text }            — can't answer reliably
 */
export function generateHint({ fen, question, previous }) {
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return { kind: "unknown", text: "I couldn't read the current position." };
  }
  const q = String(question).toLowerCase();

  if (isCheckQuestion(q)) {
    const asksOpponent = parseColor(q) === "b";
    const inCheck = game.inCheck();
    const sideInCheck = game.turn(); // only the side to move can be in check
    const target = asksOpponent ? "b" : "w";
    const yes = inCheck && sideInCheck === target;
    return { kind: "info", text: `${cap(owner(target))} king is ${yes ? "" : "not "}in check.` };
  }

  let topicKey;
  let level = 1;
  if (isFollowUp(q)) {
    if (!previous) return { kind: "unknown", text: "Ask about a piece first — for example, “Where is my knight?”" };
    topicKey = previous.topicKey;
    level = previous.level + 1;
  } else {
    const type = parsePiece(q);
    if (!type) return { kind: "unknown", text: "I can only answer about pieces — try “Where is my queen?” or “Is my king in check?”" };
    topicKey = `${parseColor(q)}:${type}:${parseSelector(q) ?? ""}`;
    if (previous?.topicKey === topicKey) level = previous.level + 1;
  }
  level = Math.min(level, MAX_LEVEL);

  const [color, type, selector] = topicKey.split(":");
  const group = findPieces(game, type, color);
  const name = PIECE_NAMES[type];

  if (group.length === 0) return { kind: "unknown", text: `${cap(owner(color))} ${name} is no longer on the board.` };
  if (group.length === 1) return { kind: "hint", clue: pieceClue(group[0], null, level, topicKey) };

  const labelled = group.map((p) => ({ p, label: selectorFor(p, group, color) }));
  const chosen = selector && labelled.find((l) => l.label === selector);
  if (chosen) return { kind: "hint", clue: pieceClue(chosen.p, chosen.label, level, topicKey) };

  const labels = labelled.map((l) => l.label).filter(Boolean);
  if (type === "p" || labels.length < 2) {
    return { kind: "unknown", text: `${cap(owner(color))} ${name}s are too many to tell apart — ask about a different piece.` };
  }
  const who = color === "w" ? "my" : "my opponent's";
  return {
    kind: "clarify",
    text: `You have ${group.length} ${name}s. Which one — ${labels.map((l) => `the ${l} one`).join(" or ")}?`,
    options: labels.map((l) => `Where is ${who} ${l} ${name}?`),
  };
}
