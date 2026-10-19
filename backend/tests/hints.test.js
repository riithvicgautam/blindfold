import assert from "node:assert/strict";
import { test } from "node:test";

import { isFaithful } from "../services/ai.js";
import { generateHint } from "../services/hints.js";
import { applyPenalty, penaltyFor } from "../services/penalties.js";

// White knight on f3 only (other knight traded), black king e8, white king e1.
const ONE_KNIGHT = "4k3/8/8/8/8/5N2/8/4K3 w - - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("progressive hints reveal knight on f3 step by step", () => {
  const steps = [];
  let previous;
  for (let i = 0; i < 4; i++) {
    const r = generateHint({ fen: ONE_KNIGHT, question: i === 0 ? "Where is my knight?" : "another clue", previous });
    assert.equal(r.kind, "hint");
    steps.push(r.clue.text);
    previous = { topicKey: r.clue.topicKey, level: r.clue.level };
  }
  assert.deepEqual(steps, [
    "Your knight is on the kingside.",
    "Your knight is on the third rank.",
    "Your knight is on the f-file.",
    "Your knight is on f3.",
  ]);
});

test("two knights → asks which one", () => {
  const r = generateHint({ fen: START, question: "Where is my knight?" });
  assert.equal(r.kind, "clarify");
  assert.equal(r.options.length, 2);
  const chosen = generateHint({ fen: START, question: "Where is my kingside knight?" });
  assert.equal(chosen.kind, "hint");
  assert.equal(chosen.clue.text, "Your kingside knight is on the kingside.");
});

test("opponent's king question", () => {
  const r = generateHint({ fen: ONE_KNIGHT, question: "Where is my opponent's king?" });
  assert.equal(r.clue.text, "Your opponent's king is on the kingside.");
});

test("check question answers from the position", () => {
  const inCheck = "4k3/8/8/8/8/8/4q3/4K3 w - - 0 1";
  assert.equal(generateHint({ fen: inCheck, question: "Is my king in check?" }).text, "Your king is in check.");
  assert.equal(generateHint({ fen: START, question: "Is my king in check?" }).text, "Your king is not in check.");
});

test("unanswerable questions are honest", () => {
  assert.equal(generateHint({ fen: START, question: "What should I play?" }).kind, "unknown");
  assert.equal(generateHint({ fen: ONE_KNIGHT, question: "Where is my queen?" }).kind, "unknown");
  assert.equal(generateHint({ fen: "garbage fen string", question: "Where is my king?" }).kind, "unknown");
});

test("penalties: broad 2, specific 5, exact 10, repeat free", () => {
  assert.equal(penaltyFor(1), 2);
  assert.equal(penaltyFor(2), 5);
  assert.equal(penaltyFor(3), 5);
  assert.equal(penaltyFor(4), 10);
  assert.equal(penaltyFor(4, { topicKey: "w:n:", level: 4 }, "w:n:"), 0);
  assert.equal(applyPenalty(5, 10), 0);
});

test("LLM output adding a new square is rejected", () => {
  assert.equal(isFaithful("Nice — your knight sits on the kingside.", "Your knight is on the kingside."), true);
  assert.equal(isFaithful("Your knight is on g5 on the kingside.", "Your knight is on the kingside."), false);
});
