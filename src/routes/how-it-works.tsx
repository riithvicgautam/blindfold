import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Blindfold" },
      {
        name: "description",
        content:
          "Learn algebraic notation, how blindfold games are played as a conversation, and how to build board visualization step by step.",
      },
      { property: "og:title", content: "How Blindfold works" },
      {
        property: "og:description",
        content: "Notation, conversation-style play, and how to train visualization.",
      },
    ],
  }),
  component: HowItWorks,
});

const notation = [
  ["e4", "Pawn to e4"],
  ["Nf3", "Knight to f3"],
  ["Bxc6", "Bishop captures on c6"],
  ["O-O", "Castle kingside"],
  ["exd5", "e-file pawn captures on d5"],
  ["Qh4+", "Queen to h4, check"],
  ["e8=Q", "Pawn promotes to a queen"],
];

const tips = [
  {
    t: "Anchor the colour of squares",
    d: "a1 is dark, h1 is light. Knowing square colour instantly prevents most blindfold blunders.",
  },
  {
    t: "Track pieces, not pictures",
    d: "Instead of a full board image, hold a short list: where each piece stands and what it attacks.",
  },
  {
    t: "Replay the move list",
    d: "The sidebar keeps every move. Reading it back rebuilds the position when you lose the thread.",
  },
  {
    t: "Start at Casual",
    d: "Short games with fewer tactics build confidence. Move to Club and Master as recall improves.",
  },
];

function HowItWorks() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          ♞ Blindfold
        </Link>
        <Link
          to="/play"
          className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Start Playing
        </Link>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-28 pt-14">
        <h1 className="animate-rise text-4xl font-semibold tracking-[-0.03em]">How it works</h1>
        <p className="animate-rise mt-5 text-lg leading-relaxed text-muted-foreground">
          A blindfold game is played entirely through language. Your opponent announces a move, you
          answer with one of your own, and the position exists only in the two of you.
        </p>

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Algebraic notation
          </h2>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {notation.map(([m, d]) => (
              <div key={m} className="flex items-center gap-5 px-5 py-3.5">
                <code className="w-24 shrink-0 font-mono text-sm text-primary">{m}</code>
                <span className="text-sm text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Training the board
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {tips.map((t) => (
              <div key={t.t} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="text-[15px] font-semibold tracking-tight">{t.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16 flex items-center justify-between rounded-2xl border border-border bg-surface p-7">
          <div>
            <p className="text-[15px] font-semibold tracking-tight">Ready to try a game?</p>
            <p className="mt-1 text-sm text-muted-foreground">You play White. Nothing is shown.</p>
          </div>
          <Link
            to="/play"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start Playing
          </Link>
        </div>
      </article>
    </main>
  );
}
