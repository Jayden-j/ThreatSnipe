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

const NODE_COUNT   = 70;
const CONNECT_DIST = 180;
const PACKET_COUNT = 14;
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

function makeNodes(w: number, h: number): NetNode[] {
  return Array.from({ length: NODE_COUNT }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-0.12, 0.12),
    vy: rand(-0.12, 0.12),
    r: rand(1.5, 3.5),
    kind: randomKind(),
    phase: rand(0, Math.PI * 2),
  }));
}

function nearestTarget(from: number, nodes: NetNode[]): number {
  const n = nodes[from];
  const pool: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i !== from && nodeDist(n, nodes[i]) < CONNECT_DIST) pool.push(i);
  }
  return pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : (from + 1) % nodes.length;
}

function makePackets(nodes: NetNode[]): Packet[] {
  return Array.from({ length: PACKET_COUNT }, () => {
    const from = Math.floor(Math.random() * nodes.length);
    return { from, to: nearestTarget(from, nodes), t: Math.random(), speed: rand(0.003, 0.007) };
  });
}

export function NetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const _canvas = canvasRef.current;
    if (!_canvas) return;
    const _ctx = _canvas.getContext("2d");
    if (!_ctx) return;

    // Explicit non-null typed refs for use inside closures
    const el: HTMLCanvasElement        = _canvas;
    const ctx: CanvasRenderingContext2D = _ctx;

    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0;
    let nodes: NetNode[] = [];
    let packets: Packet[] = [];
    let raf: number;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      el.width         = Math.round(w * dpr);
      el.height        = Math.round(h * dpr);
      el.style.width   = `${w}px`;
      el.style.height  = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes   = makeNodes(w, h);
      packets = makePackets(nodes);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    const start = performance.now();

    function frame(now: number) {
      ctx.clearRect(0, 0, w, h);
      const elapsed = now - start;

      // drift nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // scan beam
      const sx = ((elapsed % SCAN_PERIOD) / SCAN_PERIOD) * (w + 200) - 100;
      const beam = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      beam.addColorStop(0,   "transparent");
      beam.addColorStop(0.5, "rgba(99,102,241,0.04)");
      beam.addColorStop(1,   "transparent");
      ctx.fillStyle = beam;
      ctx.fillRect(sx - 120, 0, 240, h);

      // connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = nodeDist(nodes[i], nodes[j]);
          if (d > CONNECT_DIST) continue;
          const alpha  = (1 - d / CONNECT_DIST) * 0.14;
          const threat = nodes[i].kind === "threat" || nodes[j].kind === "threat";
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = threat
            ? `rgba(239,68,68,${(alpha * 1.8).toFixed(3)})`
            : `rgba(99,102,241,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // data packets
      ctx.shadowColor = "rgba(96,165,250,0.8)";
      ctx.shadowBlur  = 6;
      for (const p of packets) {
        p.t += p.speed;
        if (p.t >= 1) {
          p.from  = p.to;
          p.to    = nearestTarget(p.from, nodes);
          p.t     = 0;
          p.speed = rand(0.003, 0.007);
        }
        const a = nodes[p.from], b = nodes[p.to];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(96,165,250,0.95)";
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
          ctx.strokeStyle = `rgba(239,68,68,${(0.28 * (1 - pulse * 0.55)).toFixed(3)})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = `rgba(239,68,68,${(0.7 + pulse * 0.3).toFixed(3)})`;
          ctx.shadowColor = "rgba(239,68,68,0.7)";
          ctx.shadowBlur  = 10 + pulse * 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (n.kind === "warning") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = `rgba(251,191,36,${(0.5 + pulse * 0.3).toFixed(3)})`;
          ctx.shadowColor = "rgba(251,191,36,0.5)";
          ctx.shadowBlur  = 6 + pulse * 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (n.kind === "dim") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(99,102,241,0.20)";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle   = "rgba(99,102,241,0.55)";
          ctx.shadowColor = "rgba(99,102,241,0.4)";
          ctx.shadowBlur  = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
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
