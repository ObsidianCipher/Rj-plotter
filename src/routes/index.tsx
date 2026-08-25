import { createFileRoute } from "@tanstack/react-router";
import { PortraitPlot } from "@/components/PortraitPlot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dot-to-Dot Portrait Plotter | 60ms Coordinate Graph" },
      {
        name: "description",
        content:
          "Animated coordinate-graph plotter that draws a dot-to-dot portrait point by point at 60 ms intervals, with every facial feature preserved.",
      },
      { property: "og:title", content: "Dot-to-Dot Portrait Plotter" },
      {
        property: "og:description",
        content:
          "Watch a portrait get plotted on a 60 x 20 coordinate grid, one point every 60 milliseconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Coordinate graph animation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dot-to-dot portrait plotter
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Every point from the source graph is plotted in sequence, one point every 60 ms, on a
            60 x 20 grid — brow, eyes, nose, mouth, ears and collar kept exactly as drawn.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <PortraitPlot />
        </section>
      </div>
    </main>
  );
}
