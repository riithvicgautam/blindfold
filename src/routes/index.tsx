import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blindfold — Play chess without ever seeing the board" },
      {
        name: "description",
        content:
          "A calm, minimal way to train visualization. Play full games of chess in your head — moves arrive as messages, you reply in notation.",
      },
      { property: "og:title", content: "Blindfold" },
      {
        property: "og:description",
        content: "Can you play chess without ever seeing the board?",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    k: "01",
    t: "No board, ever",
    d: "There is nothing to look at. The position lives only in your memory.",
  },
  {
    k: "02",
    t: "Moves as conversation",
    d: "Each move arrives as a message, exactly as it would across a table.",
  },
  {
    k: "03",
    t: "Answer in notation",
    d: "Type e4, Nf3, O-O or Qxd5. Illegal moves are rejected, nothing is revealed.",
  },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] halo" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-secondary text-[13px] font-semibold text-primary">
            ♞
          </span>
          <span className="text-sm font-semibold tracking-tight">Blindfold</span>
        </div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/how-it-works"
            className="rounded-lg px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            to="/play"
            className="rounded-lg px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
          >
            Play
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pt-24 pb-28 text-center">
        <div className="animate-fade inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Visualization training, without a single square
        </div>

        <h1 className="animate-rise mt-8 text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          Can you play chess without ever seeing the board?
        </h1>

        <p className="animate-rise mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground [animation-delay:80ms]">
          Blindfold removes the one thing every player leans on. What is left is pure
          imagination — a full game, held entirely in your head.
        </p>

        <div className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3 [animation-delay:160ms]">
          <Link
            to="/play"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Start Playing
          </Link>
          <Link
            to="/how-it-works"
            className="rounded-xl border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
          >
            How it Works
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-32">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.k} className="bg-surface p-7">
              <span className="font-mono text-xs text-primary">{s.k}</span>
              <h2 className="mt-4 text-[15px] font-semibold tracking-tight">{s.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          Blindfold — train the board you cannot see.
        </div>
      </footer>
    </main>
  );
}
