import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

import { badRequest } from "../utils/errors.js";

/**
 * Deterministic hint engine. chess.js is the single source of truth:
 * every clue is derived from the current FEN here — never by the LLM.
 */

export type HintTopic = "piece" | "king_area";

export type ApprovedClue = {
  /** Machine-readable fact that is allowed to be revealed. */
  clueType: "wing" | "rank" | "file" | "square" | "count" | "neighbours" | "neighbour_squares";
  /** Human-readable deterministic phrasing (also the LLM-free fallback). */
  text: string;
  /** Plain description of the piece, e.g. "your knight". */
  pieceLabel: string;
  level: number;
  maxLevel: number;
  topicKey: string;
};

export type HintResult =
  | { kind: "hint"; clue: ApprovedClue }
  | { kind: "clarify"; text: string; options: string[] }
  | { kind: "unknown"; text: string };

const PIECE_WORDS: Record<string, PieceSymbol> = {
  pawn: "p", pawns: "p",
  knight: "n", knights: "n", horse: "n",
  bishop: "b", bishops: "b",
  rook: "r", rooks: "r", castle: "r",
  queen: "q", queens: "q",
  king: "k", kings: "k",
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

const MAX_LEVEL = 4;
const FILES = "abcdefgh";

type Located = { square: Square; type: PieceSymbol; color: Color };

function loadBoard(fen: string): Chess {
  try {
    return new Chess(fen);
  } catch {
    throw badRequest("The current position could not be read.");
  }
}

function wingOf(sq: Square): "kingside" | "queenside" {
  return FILES.indexOf(sq[0]!) >= 4 ? "kingside" : "queenside";
}

function isLight(sq: Square): boolean {
  const f = FILES.indexOf(sq[0]!);
  const r = Number(sq[1]);
  return (f + r) % 2 === 1;
}

function ordinal(n: number): string {
  return ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"][n - 1]!;
}

function findPieces(game: Chess, type: PieceSymbol, color: Color): Located[] {
  const out: Located[] = [];
  for (const row of game.board()) {
    for (const cell of row) if (cell && cell.type === type && cell.color === color) out.push(cell);
  }
  return out;
}

/** Selector labels that distinguish two or more same-type pieces. */
function selectorFor(p: Located, group: Located[], color: Color): string {
  const wings = new Set(group.map((g) => wingOf(g.square)));
  if (wings.size === group.length) return wingOf(p.square);
  const shades = new Set(group.map((g) => isLight(g.square)));
  if (shades.size === group.length) return isLight(p.square) ? "light-squared" : "dark-squared";
  const advance = (s: Square) => (color === "w" ? Number(s[1]) : 9 - Number(s[1]));
  const sorted = [...group].sort((a, b) => advance(b.square) - advance(a.square));
  const idx = sorted.findIndex((g) => g.square === p.square);
  return idx === 0 ? "most advanced" : idx === sorted.length - 1 ? "least advanced" : `#${idx + 1}`;
}

function parseColor(q: string): Color {
  if (/\b(black|opponent|opponent's|their|enemy|his|engine)\b/.test(q)) return "b";
  return "w";
}

function parsePiece(q: string): PieceSymbol | null {
  for (const word of q.split(/[^a-z]+/)) {
    const hit = PIECE_WORDS[word];
    if (hit) return hit;
  }
  return null;
}

const isFollowUp = (q: string) =>
  /\b(another|more|next|stronger|further|again|one more)\b/.test(q) && !parsePiece(q);

const isKingArea = (q: string) =>
  /\b(around|near|next to|close to|surround|beside)\b/.test(q) && /\bking\b/.test(q);

function owner(color: Color) {
  return color === "w" ? "your" : "Black's";
}

function pieceClue(p: Located, selector: string | null, level: number, topicKey: string): ApprovedClue {
  const label = `${owner(p.color)} ${selector && !selector.startsWith("#") ? `${selector} ` : ""}${PIECE_NAMES[p.type]}`;
  const cap = label[0]!.toUpperCase() + label.slice(1);
  const base = { pieceLabel: label, level, maxLevel: MAX_LEVEL, topicKey };
  switch (level) {
    case 1:
      return { ...base, clueType: "wing", text: `${cap} is on the ${wingOf(p.square)}.` };
    case 2:
      return { ...base, clueType: "rank", text: `${cap} is on the ${ordinal(Number(p.square[1]))} rank.` };
    case 3:
      return { ...base, clueType: "file", text: `${cap} is on the ${p.square[0]}-file.` };
    default:
      return { ...base, clueType: "square", level: MAX_LEVEL, text: `${cap} is on ${p.square}.` };
  }
}

function kingAreaClue(game: Chess, color: Color, level: number, topicKey: string): ApprovedClue {
  const king = findPieces(game, "k", color)[0]!;
  const f = FILES.indexOf(king.square[0]!);
  const r = Number(king.square[1]);
  const near: Located[] = [];
  for (let df = -1; df <= 1; df++)
    for (let dr = -1; dr <= 1; dr++) {
      if (!df && !dr) continue;
      const nf = f + df, nr = r + dr;
      if (nf < 0 || nf > 7 || nr < 1 || nr > 8) continue;
      const cell = game.get(`${FILES[nf]}${nr}` as Square);
      if (cell) near.push({ ...cell, square: `${FILES[nf]}${nr}` as Square });
    }
  const label = `${owner(color)} king`;
  const base = { pieceLabel: label, level, maxLevel: 3, topicKey };
  const describe = (p: Located) => `${p.color === color ? "own" : "enemy"} ${PIECE_NAMES[p.type]}`;
  if (near.length === 0)
    return { ...base, clueType: "count", level: 3, text: `No pieces stand next to ${label}.` };
  if (level <= 1)
    return { ...base, clueType: "count", text: `${near.length} piece${near.length > 1 ? "s are" : " is"} touching ${label}.` };
  if (level === 2)
    return { ...base, clueType: "neighbours", text: `Next to ${label}: ${near.map(describe).join(", ")}.` };
  return {
    ...base,
    clueType: "neighbour_squares",
    level: 3,
    text: `Next to ${label}: ${near.map((p) => `${describe(p)} on ${p.square}`).join(", ")}.`,
  };
}

/**
 * Interpret a question against the current position and produce an approved clue.
 * `previous` lets "another clue" escalate the same topic; the client resets it
 * after every move so a hint is never reused across positions.
 */
export function generateHint(input: {
  fen: string;
  question: string;
  previous?: { topicKey: string; level: number } | undefined;
}): HintResult {
  const game = loadBoard(input.fen);
  const q = input.question.toLowerCase();

  // Resolve topic: explicit follow-up reuses the previous topic.
  let topicKey: string;
  let level = 1;
  if (isFollowUp(q) && input.previous) {
    topicKey = input.previous.topicKey;
    level = input.previous.level + 1;
  } else {
    const color = parseColor(q);
    if (isKingArea(q)) {
      topicKey = `area:${color}`;
    } else {
      const type = parsePiece(q);
      if (!type) {
        if (isFollowUp(q))
          return { kind: "unknown", text: "Ask about a piece first — for example, “Where is my knight?”" };
        return { kind: "unknown", text: "Name a piece, like “Where is my queen?” or “What's around my king?”" };
      }
      topicKey = `piece:${color}:${type}:${matchSelector(q) ?? ""}`;
      if (input.previous && input.previous.topicKey === topicKey) level = input.previous.level + 1;
    }
  }

  if (topicKey.startsWith("area:")) {
    const color = topicKey.split(":")[1] as Color;
    return { kind: "hint", clue: kingAreaClue(game, color, Math.min(level, 3), topicKey) };
  }

  const [, colorRaw, typeRaw, selectorRaw] = topicKey.split(":");
  const color = colorRaw as Color;
  const type = typeRaw as PieceSymbol;
  const group = findPieces(game, type, color);
  const name = PIECE_NAMES[type];

  if (group.length === 0)
    return { kind: "unknown", text: `${owner(color)[0]!.toUpperCase()}${owner(color).slice(1)} ${name} is no longer on the board.` };

  if (group.length === 1) return { kind: "hint", clue: pieceClue(group[0]!, null, Math.min(level, MAX_LEVEL), topicKey) };

  const labelled = group.map((p) => ({ p, label: selectorFor(p, group, color) }));
  const chosen = selectorRaw ? labelled.find((l) => l.label === selectorRaw || l.label.includes(selectorRaw)) : undefined;
  if (!chosen) {
    if (type === "p")
      return { kind: "unknown", text: `${owner(color)} pawns are too many to track one by one — ask about a specific piece.` };
    const options = labelled.map((l) => l.label).filter((l) => !l.startsWith("#"));
    return {
      kind: "clarify",
      text: `Which ${name} — ${options.map((o) => `the ${o} one`).join(" or ")}?`,
      options: options.map((o) => `Where is my ${o} ${name}?`.replace("my", color === "w" ? "my" : "Black's")),
    };
  }
  return { kind: "hint", clue: pieceClue(chosen.p, chosen.label, Math.min(level, MAX_LEVEL), topicKey) };
}

function matchSelector(q: string): string | null {
  for (const s of ["light-squared", "dark-squared", "kingside", "queenside", "most advanced", "least advanced"]) {
    if (q.includes(s) || q.includes(s.replace("-", " "))) return s;
  }
  if (/\blight\b/.test(q)) return "light-squared";
  if (/\bdark\b/.test(q)) return "dark-squared";
  return null;
}
