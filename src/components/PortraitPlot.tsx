import { useEffect, useMemo, useRef, useState } from "react";
import data from "@/data/portrait.json";

type Pt = [number, number];

const X_MAX = 60;
const Y_MAX = 20;
const INTERVAL_MS = 60;

/** Flatten every stroke point into one ordered plotting sequence. */
function buildSequence(strokes: Pt[][], isDot: boolean[][]) {
  const seq: { x: number; y: number; stroke: number; dot: boolean }[] = [];
  strokes.forEach((s, i) =>
    s.forEach(([x, y], j) => seq.push({ x, y, stroke: i, dot: isDot[i]?.[j] ?? false })),
  );
  return seq;
}

export function PortraitPlot() {
  const strokes = data.strokes as Pt[][];
  const isDot = data.isDot as boolean[][];
  const sequence = useMemo(() => buildSequence(strokes, isDot), [strokes, isDot]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setWidth(canvas.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const dotsShown = useMemo(
    () =>
      sequence
        .slice(0, count)
        .filter((p) => p.dot)
        .map((p) => [p.x, p.y] as Pt),
    [sequence, count],
  );


  // advance one point every 60ms
  useEffect(() => {
    if (!playing) return;
    if (count >= sequence.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [playing, count, sequence.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssW = width || canvas.getBoundingClientRect().width;
    const cssH = cssW * 0.86; // keeps the source graph's proportions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const padL = 34;
    const padB = 26;
    const padT = 10;
    const padR = 10;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const sx = (x: number) => padL + (x / X_MAX) * plotW;
    const sy = (y: number) => padT + plotH - (y / Y_MAX) * plotH;

    const css = getComputedStyle(document.documentElement);
    const grid = `oklch(${css.getPropertyValue("--chart-grid").trim()})`;
    const axis = `oklch(${css.getPropertyValue("--chart-axis").trim()})`;
    const ink = `oklch(${css.getPropertyValue("--chart-ink").trim()})`;
    const live = `oklch(${css.getPropertyValue("--chart-live").trim()})`;

    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = grid;
    ctx.beginPath();
    for (let x = 0; x <= X_MAX; x += 2) {
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(Y_MAX));
    }
    for (let y = 0; y <= Y_MAX; y += 2) {
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(X_MAX), sy(y));
    }
    ctx.stroke();

    // axes
    ctx.strokeStyle = axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(Y_MAX));
    ctx.lineTo(sx(0), sy(0));
    ctx.lineTo(sx(X_MAX), sy(0));
    ctx.stroke();

    ctx.fillStyle = axis;
    ctx.font = "10px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    for (let x = 0; x <= X_MAX; x += 4) ctx.fillText(String(x), sx(x), sy(0) + 14);
    ctx.textAlign = "right";
    for (let y = 0; y <= Y_MAX; y += 2) ctx.fillText(String(y), sx(0) - 6, sy(y) + 3);

    // drawn portion
    const shown = sequence.slice(0, count);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    let prevStroke = -1;
    ctx.beginPath();
    for (const p of shown) {
      if (p.stroke !== prevStroke) {
        ctx.moveTo(sx(p.x), sy(p.y));
        prevStroke = p.stroke;
      } else {
        ctx.lineTo(sx(p.x), sy(p.y));
      }
    }
    ctx.stroke();

    // plotted markers
    ctx.fillStyle = ink;
    const lastPlotted = shown.length ? shown[shown.length - 1] : null;
    for (const [x, y] of dotsShown) {
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // the pen head
    if (lastPlotted && count < sequence.length) {
      ctx.fillStyle = live;
      ctx.beginPath();
      ctx.arc(sx(lastPlotted.x), sy(lastPlotted.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [count, sequence, dotsShown, width]);

  const done = count >= sequence.length;

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg bg-card" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            if (done) {
              setCount(0);
              setPlaying(true);
            } else setPlaying((p) => !p);
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {done ? "Replay" : playing ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => {
            setCount(sequence.length);
            setPlaying(false);
          }}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Show full plot
        </button>
        <p className="text-sm text-muted-foreground tabular-nums">
          {count} / {sequence.length} points · {INTERVAL_MS} ms per point
        </p>
      </div>
    </div>
  );
}
