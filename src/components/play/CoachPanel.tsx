import { useEffect, useRef, useState } from "react";

import { coachApi } from "@/lib/api/coach.service";

type Line = { id: number; who: "you" | "coach"; text: string; level?: number; maxLevel?: number };

const SUGGESTIONS = ["Where is my knight?", "What's around my king?", "Where is the black queen?"];

/**
 * Visualization coach. Hints are generated server-side from the current FEN;
 * any move resets the escalation chain so a stale hint is never reused.
 */
export function CoachPanel({ fen, disabled }: { fen: string; disabled?: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [previous, setPrevious] = useState<{ topicKey: string; level: number } | undefined>();
  const idRef = useRef(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const positionSince = useRef(Date.now());
  const startFen = useRef(fen);

  // New position → invalidate the current hint chain.
  useEffect(() => {
    setPrevious(undefined);
    positionSince.current = Date.now();
    // A brand-new game resets the hint counter too.
    if (fen.startsWith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w") && fen !== startFen.current) {
      setHintsUsed(0);
      setMultiplier(1);
      setLines([]);
    }
    startFen.current = fen;
  }, [fen]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, busy]);

  const add = (l: Omit<Line, "id">) => setLines((prev) => [...prev, { ...l, id: idRef.current++ }]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    add({ who: "you", text: q });
    setBusy(true);
    try {
      const reply = await coachApi.hint({
        fen,
        question: q,
        hintsUsed,
        responseMs: Date.now() - positionSince.current,
        ...(previous ? { previous } : {}),
      });
      setHintsUsed(reply.hintsUsed);
      setMultiplier(reply.scoreMultiplier);
      if (reply.kind === "hint") {
        setPrevious({ topicKey: reply.topicKey, level: reply.level });
        add({ who: "coach", text: reply.text, level: reply.level, maxLevel: reply.maxLevel });
      } else {
        add({ who: "coach", text: reply.text });
      }
    } catch {
      add({ who: "coach", text: "The coach is unreachable right now. Your game is unaffected." });
    } finally {
      setBusy(false);
    }
  }

  const canEscalate = previous !== undefined;

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Visualization coach
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {hintsUsed} hint{hintsUsed === 1 ? "" : "s"} · {Math.round(multiplier * 100)}%
        </span>
      </div>

      <div ref={feedRef} className="max-h-64 min-h-24 space-y-3 overflow-y-auto px-4 py-3">
        {lines.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Lost track of a piece? Ask for a clue. Clues start vague and only reveal the square at the end.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void ask(s)}
                  disabled={disabled || busy}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          lines.map((l) =>
            l.who === "you" ? (
              <p key={l.id} className="animate-fade text-right text-xs text-muted-foreground">
                {l.text}
              </p>
            ) : (
              <div key={l.id} className="animate-rise border-l-2 border-primary/60 pl-3">
                {l.level !== undefined && l.maxLevel !== undefined && (
                  <div className="mb-1 flex gap-1">
                    {Array.from({ length: l.maxLevel }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1 w-4 rounded-full ${i < l.level! ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm">{l.text}</p>
              </div>
            ),
          )
        )}
        {busy && <p className="animate-pulse-soft text-xs text-muted-foreground">Recalling the position…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="space-y-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || busy}
          maxLength={300}
          placeholder="Where is my bishop?"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled || busy || !input.trim()}
            className="flex-1 rounded-xl bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-raised disabled:opacity-40"
          >
            Ask
          </button>
          <button
            type="button"
            onClick={() => void ask("another clue")}
            disabled={disabled || busy || !canEscalate}
            className="flex-1 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            Stronger hint
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">Each hint lowers this game's score.</p>
      </form>
    </div>
  );
}
