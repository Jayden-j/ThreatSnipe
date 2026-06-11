"use client";

import { useEffect, useRef } from "react";

type NodeKind = "normal" | "threat" | "warning" | "dim";

interface NetNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: NodeKind;
  phase: number;
}

interface Packet {
  from: number;
  to: number;
  t: number;
  speed: number;
}

const SCAN_PERIOD  = 9000;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function nodeDist(a: NetNode, b: NetNode) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomKind(): NodeKind {
  const r = Math.random();
  if (r < 0.10) return "threat";
  if (r < 0.18) return "warning";
  if (r < 0.40) return "dim";
  return "normal";
}

function makeNodes(w: number, h: number, count: number): NetNode[] {
  return Array.from({ length: count }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-0.12, 0.12),
    vy: rand(-0.12, 0.12),
    r: rand(1.5, 3.5),
    kind: randomKind(),
    phase: rand(0, Math.PI * 2),
  }));
}

function nearestTarget(from: number, nodes: NetNode[], dist: number): number {
  const n = nodes[from];
  const pool: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i !== from && nodeDist(n, nodes[i]) < dist) pool.push(i);
  }
  return pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : (from + 1) % nodes.length;
}

function makePackets(nodes: NetNode[], count: number, dist: number): Packet[] {
  return Array.from({ length: count }, () => {
    const from = Math.floor(Math.random() * nodes.length);
    return { from, to: nearestTarget(from, nodes, dist), t: Math.random(), speed: rand(0.003, 0.007) };
  });
}

// ── per-frame color tokens ────────────────────────────────────────────────────

interface Palette {
  lineNormal: (a: number) => string;
  lineThreat: (a: number) => string;
  scanBeam:   string;
  packet:     string;
  packetGlow: string;
  packetBlur: number;
  normal:     string;
  normalGlow: string;
  normalBlur: number;
  dim:        string;
  warning:    (o: number) => string;
  warningGlow: string;
  warningBlur: (p: number) => number;
  threat:     (o: number) => string;
  threatRing: (o: number) => string;
  threatGlow: string;
  threatBlur: (p: number) => number;
}

function palette(dark: boolean): Palette {
  if (dark) {
    return {
      lineNormal:  (a) => `rgba(99,102,241,${a.toFixed(3)})`,
      lineThreat:  (a) => `rgba(239,68,68,${(a * 1.8).toFixed(3)})`,
      scanBeam:    "rgba(99,102,241,0.04)",
      packet:      "rgba(96,165,250,0.95)",
      packetGlow:  "rgba(96,165,250,0.8)",
      packetBlur:  6,
      normal:      "rgba(99,102,241,0.55)",
      normalGlow:  "rgba(99,102,241,0.4)",
      normalBlur:  4,
      dim:         "rgba(99,102,241,0.20)",
      warning:     (o) => `rgba(251,191,36,${o.toFixed(3)})`,
      warningGlow: "rgba(251,191,36,0.5)",
      warningBlur: (p) => 6 + p * 4,
      threat:      (o) => `rgba(239,68,68,${o.toFixed(3)})`,
      threatRing:  (o) => `rgba(239,68,68,${o.toFixed(3)})`,
      threatGlow:  "rgba(239,68,68,0.7)",
      threatBlur:  (p) => 10 + p * 6,
    };
  }
  // Light mode: deeper/more opaque values, reduced blur so glows don't wash out
  return {
    lineNormal:  (a) => `rgba(79,70,229,${(a * 1.6).toFixed(3)})`,
    lineThreat:  (a) => `rgba(185,28,28,${(a * 2.4).toFixed(3)})`,
    scanBeam:    "rgba(79,70,229,0.07)",
    packet:      "rgba(37,99,235,0.85)",
    packetGlow:  "rgba(37,99,235,0.25)",
    packetBlur:  3,
    normal:      "rgba(79,70,229,0.65)",
    normalGlow:  "rgba(79,70,229,0.2)",
    normalBlur:  3,
    dim:         "rgba(99,102,241,0.28)",
    warning:     (o) => `rgba(180,83,9,${(o * 0.85).toFixed(3)})`,
    warningGlow: "rgba(180,83,9,0.2)",
    warningBlur: (p) => 3 + p * 2,
    threat:      (o) => `rgba(185,28,28,${(o * 0.9).toFixed(3)})`,
    threatRing:  (o) => `rgba(185,28,28,${(o * 0.65).toFixed(3)})`,
    threatGlow:  "rgba(185,28,28,0.3)",
    threatBlur:  (p) => 5 + p * 3,
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export function NetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const _canvas = canvasRef.current;
    if (!_canvas) return;
    const _ctx = _canvas.getContext("2d");
    if (!_ctx) return;

    const el: HTMLCanvasElement         = _canvas;
    const ctx: CanvasRenderingContext2D = _ctx;

    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;
    let nodeCount   = 70;
    let connectDist = 180;
    let packetCount = 14;
    let nodes: NetNode[] = [];
    let packets: Packet[] = [];
    let raf: number;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      el.width        = Math.round(w * dpr);
      el.height       = Math.round(h * dpr);
      el.style.width  = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Scale density with viewport area (~1 node per 16 000 px²), clamped [18, 80]
      nodeCount   = Math.round(Math.min(Math.max((w * h) / 16_000, 18), 72));
      // Connection distance: 13% of width, clamped [95, 180]
      connectDist = Math.round(Math.min(Math.max(w * 0.13, 95), 180));
      // Packets proportional to node count
      packetCount = Math.max(4, Math.round(nodeCount * 0.20));
      nodes   = makeNodes(w, h, nodeCount);
      packets = makePackets(nodes, packetCount, connectDist);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    const start = performance.now();

    function frame(now: number) {
      ctx.clearRect(0, 0, w, h);
      const elapsed = now - start;
      const dark    = document.documentElement.classList.contains("dark");
      const c       = palette(dark);

      // drift nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // scan beam
      const sx   = ((elapsed % SCAN_PERIOD) / SCAN_PERIOD) * (w + 200) - 100;
      const beam = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      beam.addColorStop(0,   "transparent");
      beam.addColorStop(0.5, c.scanBeam);
      beam.addColorStop(1,   "transparent");
      ctx.fillStyle = beam;
      ctx.fillRect(sx - 120, 0, 240, h);

      // connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = nodeDist(nodes[i], nodes[j]);
          if (d > connectDist) continue;
          const alpha  = (1 - d / connectDist) * 0.14;
          const threat = nodes[i].kind === "threat" || nodes[j].kind === "threat";
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = threat ? c.lineThreat(alpha) : c.lineNormal(alpha);
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        }
      }

      // data packets
      ctx.shadowColor = c.packetGlow;
      ctx.shadowBlur  = c.packetBlur;
      for (const p of packets) {
        p.t += p.speed;
        if (p.t >= 1) {
          p.from  = p.to;
          p.to    = nearestTarget(p.from, nodes, connectDist);
          p.t     = 0;
          p.speed = rand(0.003, 0.007);
        }
        const a = nodes[p.from], b = nodes[p.to];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = c.packet;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // nodes
      const sec = elapsed / 1000;
      for (const n of nodes) {
        const pulse = Math.sin(sec * 1.5 + n.phase) * 0.5 + 0.5;

        if (n.kind === "threat") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 4 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = c.threatRing(0.28 * (1 - pulse * 0.55));
          ctx.lineWidth   = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = c.threat(0.7 + pulse * 0.3);
          ctx.shadowColor = c.threatGlow;
          ctx.shadowBlur  = c.threatBlur(pulse);
          ctx.fill();
          ctx.shadowBlur  = 0;
        } else if (n.kind === "warning") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = c.warning(0.5 + pulse * 0.3);
          ctx.shadowColor = c.warningGlow;
          ctx.shadowBlur  = c.warningBlur(pulse);
          ctx.fill();
          ctx.shadowBlur  = 0;
        } else if (n.kind === "dim") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = c.dim;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = c.normal;
          ctx.shadowColor = c.normalGlow;
          ctx.shadowBlur  = c.normalBlur;
          ctx.fill();
          ctx.shadowBlur  = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
