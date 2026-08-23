import { createFileRoute, Link } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseMove, type Difficulty } from "@/lib/engine";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Blindfold" },
      {
        name: "description",
        content:
          "Play a full game of chess with no board. Moves appear as messages and you reply in algebraic notation.",
      },
      { property: "og:title", content: "Play Blindfold" },
      {
        property: "og:description",
        content: "A boardless game of chess, played entirely in your head.",
      },
    ],
  }),
  component: PlayPage,
});

type Msg =
  | { id: number; kind: "move"; side: "w" | "b"; san: string; number: number }
  | { id: number; kind: "system"; text: string };

type NewMsg =
  | { kind: "move"; side: "w" | "b"; san: string; number: number }
  | { kind: "system"; text: string };

const DIFFICULTIES: { id: Difficulty; label: string; sub: string }[] = [
  { id: "casual", label: "Casual", sub: "Forgiving" },
  { id: "club", label: "Club", sub: "Balanced" },
  { id: "master", label: "Master", sub: "Unforgiving" },
];

function PlayPage() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, kind: "system", text: "New game. You are White — make your first move." },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("club");
  const [input, setInput] = useState("");
  const idRef = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const game = gameRef.current;

  const status = useMemo(() => {
    const g = new Chess(fen);
    if (g.isCheckmate()) return g.turn() === "w" ? "Black wins by checkmate" : "You win by checkmate";
    if (g.isStalemate()) return "Draw by stalemate";
    if (g.isDraw()) return "Draw";
    if (g.isCheck()) return g.turn() === "w" ? "You are in check" : "Black is in check";
    return "In progress";
  }, [fen]);

  const over = useMemo(() => new Chess(fen).isGameOver(), [fen]);

  const push = useCallback((m: NewMsg) => {
    setMessages((prev) => [...prev, { ...m, id: idRef.current++ } as Msg]);
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const reset = useCallback(() => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setHistory([]);
    setThinking(false);
    setError(null);
    setInput("");
    idRef.current = 1;
    setMessages([
      { id: 0, kind: "system", text: "New game. You are White — make your first move." },
    ]);
    inputRef.current?.focus();
  }, []);

  const resign = useCallback(() => {
    if (over) return;
    push({ kind: "system", text: "You resigned. Black wins." });
    gameRef.current.load(gameRef.current.fen());
    setFen(gameRef.current.fen());
  }, [over, push]);

  const submit = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value || thinking || over) return;

      let played;
      try {
        played = game.move(value);
      } catch {
        played = null;
      }
      if (!played) {
        setError(`"${value}" isn't a legal move here.`);
        return;
      }

      setError(null);
      setInput("");
      const num = Math.ceil(game.history().length / 2);
      push({ kind: "move", side: "w", san: played.san, number: num });
      setHistory(game.history());
      setFen(game.fen());

      if (game.isGameOver()) {
        push({ kind: "system", text: describeEnd(game) });
        return;
      }

      setThinking(true);
      const snapshot = game.fen();
      window.setTimeout(
        () => {
          const san = chooseMove(snapshot, difficulty);
          if (!san) {
            setThinking(false);
            return;
          }
          game.move(san);
          setThinking(false);
          push({ kind: "move", side: "b", san, number: Math.ceil(game.history().length / 2) });
          setHistory(game.history());
          setFen(game.fen());
          if (game.isGameOver()) push({ kind: "system", text: describeEnd(game) });
        },
        700 + Math.random() * 700,
      );
    },
    [difficulty, game, over, push, thinking],
  );

  const pairs = useMemo(() => {
    const rows: { n: number; w?: string; b?: string }[] = [];
    history.forEach((san, i) => {
      const n = Math.floor(i / 2);
      rows[n] ??= { n: n + 1 };
      if (i % 2 === 0) rows[n]!.w = san;
      else rows[n]!.b = san;
    });
    return rows;
  }, [history]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          ♞ Blindfold
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:block">
          No board is shown. Ever.
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* Left sidebar */}
        <aside className="hidden min-h-0 flex-col border-r border-border lg:flex">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Move history
            </h2>
            <span className="font-mono text-xs text-muted-foreground">{history.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {pairs.length === 0 ? (
              <p className="px-2 text-sm text-muted-foreground">No moves yet.</p>
            ) : (
              <ol className="space-y-0.5">
                {pairs.map((r) => (
                  <li
                    key={r.n}
                    className="grid grid-cols-[28px_1fr_1fr] items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-[13px] hover:bg-secondary"
                  >
                    <span className="text-muted-foreground">{r.n}.</span>
                    <span>{r.w}</span>
                    <span className="text-muted-foreground">{r.b ?? "…"}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="space-y-2 border-t border-border p-4">
            <button
              onClick={reset}
              className="w-full rounded-xl bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-raised"
            >
              New game
            </button>
            <button
              onClick={resign}
              disabled={over}
              className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              Resign
            </button>
          </div>
        </aside>

        {/* Center conversation */}
        <section className="flex min-h-0 flex-col">
          <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto flex max-w-xl flex-col gap-4">
              {messages.map((m) =>
                m.kind === "system" ? (
                  <p
                    key={m.id}
                    className="animate-fade self-center rounded-full border border-border bg-surface px-4 py-1.5 text-center text-xs text-muted-foreground"
                  >
                    {m.text}
                  </p>
                ) : (
                  <div
                    key={m.id}
                    className={`animate-rise flex flex-col gap-1.5 ${
                      m.side === "w" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {m.side === "w" ? "White" : "Black"} · {m.number}
                    </span>
                    <span
                      className={`rounded-2xl px-4 py-2.5 font-mono text-[15px] ${
                        m.side === "w"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-surface text-foreground"
                      }`}
                    >
                      {m.san}
                    </span>
                  </div>
                ),
              )}
              {thinking && (
                <div className="animate-fade flex flex-col items-start gap-1.5">
                  <span className="px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Black
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                    Black is thinking
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="animate-pulse-soft size-1.5 rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${i * 220}ms` }}
                        />
                      ))}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Command input */}
          <div className="shrink-0 border-t border-border px-6 py-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="mx-auto max-w-xl"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3 shadow-[var(--shadow-lift)] transition-colors focus-within:border-primary/50">
                <span className="font-mono text-sm text-primary">›</span>
                <input
                  ref={inputRef}
                  autoFocus
                  value={input}
                  disabled={over}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Type your move... (e.g. Nf3)"
                  className="min-w-0 flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
                <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                  Enter
                </kbd>
              </div>
              <p
                className={`mt-2 px-1 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
              >
                {error ??
                  (over ? "Game over — start a new game to continue." : "Algebraic notation only.")}
              </p>
            </form>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto border-l border-border p-5 lg:flex">
          <Field label="Current turn">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${over ? "bg-muted-foreground" : thinking ? "bg-muted-foreground" : "bg-primary"}`}
              />
              <span className="text-sm font-medium">
                {over ? "—" : thinking ? "Black" : "White (you)"}
              </span>
            </div>
          </Field>

          <Field label="Difficulty">
            <div className="grid gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    difficulty === d.id
                      ? "border-primary/40 bg-secondary"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.sub}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Players">
            <div className="space-y-2 text-sm">
              <Row left="You" right="White" />
              <Row left="Engine" right="Black" />
            </div>
          </Field>

          <Field label="Game status">
            <p className="text-sm text-muted-foreground">{status}</p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Move {Math.floor(history.length / 2) + 1}
            </p>
          </Field>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{left}</span>
      <span className="text-xs text-muted-foreground">{right}</span>
    </div>
  );
}

function describeEnd(g: Chess) {
  if (g.isCheckmate()) return g.turn() === "w" ? "Checkmate — Black wins." : "Checkmate — you win.";
  if (g.isStalemate()) return "Stalemate — the game is drawn.";
  if (g.isThreefoldRepetition()) return "Draw by threefold repetition.";
  if (g.isInsufficientMaterial()) return "Draw — insufficient material.";
  return "The game is drawn.";
}
