import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, RotateCcw, Volume2, VolumeX, Sparkles, Copy, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Dastyor Food" },
      { name: "description", content: "Pichoq o'yini — Dastyor Food mini o'yini" },
      { property: "og:title", content: "Dastyor Food" },
    ],
  }),
  component: GamePage,
});

/* ===================== Constants & Math ===================== */
const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const DELTA = (12 * Math.PI) / 180;
const norm = (a: number) => ((a % TAU) + TAU) % TAU;
const angDiff = (a: number, b: number) => {
  const d = Math.abs(norm(a) - norm(b));
  return d > Math.PI ? TAU - d : d;
};

const CONFIG = {
  rewardScore: 10,
  promoCode: "BURGER10",
};

interface Palette {
  type: string;
  base: string;
  ring: string;
  core: string;
  topping?: string;
  icing?: string;
}

const PALETTES: Palette[] = [
  { type: "pizza", base: "#e0a23c", ring: "#b8742a", core: "#f5d57e", topping: "#b73a2b" },
  { type: "burger", base: "#d98b3a", ring: "#a85a1c", core: "#f2bd6d" },
  { type: "donut", base: "#d99a55", ring: "#a8631f", core: "#ecc085", icing: "#f27ab0" },
  { type: "pizza", base: "#d68a38", ring: "#9c4f24", core: "#efc873", topping: "#5f8f3a" },
  { type: "donut", base: "#d99a55", ring: "#a8631f", core: "#ecc085", icing: "#5a2f1c" },
  { type: "burger", base: "#cf7d2e", ring: "#9a4d17", core: "#eeb25c" },
];

function stageConfig(n: number) {
  return {
    stage: n,
    knives: Math.min(3 + 2 * n, 12),
    obstacles: Math.min(n - 1, 4),
    speed: Math.min(1.5 + 0.3 * n, 4.0),
    dir: n % 2 ? 1 : -1,
    wobble: Math.min(0.2 * (n - 1), 1.2),
    freq: 0.9 + 0.15 * n,
    palette: PALETTES[(n - 1) % PALETTES.length] ?? PALETTES[0],
  };
}

class KnifeObject {
  x: number;
  y: number;
  rot: number;
  vx: number;
  vy: number;
  vr: number;

  constructor(x = 0, y = 0, rot = 0, vx = 0, vy = 0, vr = 0) {
    this.x = x;
    this.y = y;
    this.rot = rot;
    this.vx = vx;
    this.vy = vy;
    this.vr = vr;
  }

  draw(ctx: CanvasRenderingContext2D, L: number) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    drawKnifeBlade(ctx, L);
    ctx.restore();
  }
}

function drawKnifeBlade(ctx: CanvasRenderingContext2D, L: number) {
  const w = L * 0.18;
  const bl = L * 0.58;

  // Steel blade
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, "#73808a");
  g.addColorStop(0.42, "#ffffff");
  g.addColorStop(0.58, "#e2e8f0");
  g.addColorStop(1, "#64748b");

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.15, L * 0.07, w / 2, L * 0.2);
  ctx.lineTo(w / 2, bl);
  ctx.lineTo(-w / 2, bl);
  ctx.lineTo(-w / 2, L * 0.2);
  ctx.quadraticCurveTo(-w * 0.15, L * 0.07, 0, 0);
  ctx.fillStyle = g;
  ctx.fill();

  // Bevel center line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, bl);
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Guard (Gold / Amber accent)
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(-w * 0.65, bl, w * 1.3, L * 0.05);

  // Handle (Apple Deep Red/Black)
  const hg = ctx.createLinearGradient(-w * 0.35, 0, w * 0.35, 0);
  hg.addColorStop(0, "#b91c1c");
  hg.addColorStop(0.5, "#dc2626");
  hg.addColorStop(1, "#991b1b");

  ctx.beginPath();
  ctx.roundRect(-w * 0.35, bl + L * 0.05, w * 0.7, L - bl - L * 0.05, [0, 0, 4, 4]);
  ctx.fillStyle = hg;
  ctx.fill();
}

class TargetObject {
  angle = 0;
  knives: number[] = [];
  t = 0;

  reset(obstacles = 0) {
    this.angle = 0;
    this.knives = [];
    this.t = 0;
    if (obstacles > 0) {
      const step = TAU / (obstacles + 1);
      for (let i = 0; i < obstacles; i++) {
        this.knives.push(norm((i + 1) * step + (Math.random() - 0.5) * 0.3));
      }
    }
  }

  update(dt: number, cfg: ReturnType<typeof stageConfig>) {
    this.t += dt;
    const speedMod = 1 + cfg.wobble * Math.sin(this.t * cfg.freq * TAU);
    this.angle = norm(this.angle + cfg.dir * cfg.speed * speedMod * dt);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    R: number,
    L: number,
    embed: number,
    palette: Palette,
  ) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.save();
    ctx.rotate(this.angle);

    // Realistic soft shadow
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    // Outer ring
    ctx.fillStyle = palette.ring;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Main base
    ctx.fillStyle = palette.base;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.92, 0, TAU);
    ctx.fill();

    // Food graphics
    if (palette.type === "donut") {
      ctx.fillStyle = palette.icing || "#f472b6";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.78, 0, TAU);
      ctx.fill();

      // Donut hole
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.28, 0, TAU);
      ctx.fill();
    } else if (palette.type === "burger") {
      ctx.fillStyle = "#fef08a";
      for (let i = 0; i < 14; i++) {
        const a = (i * TAU) / 14 + 0.2;
        const d = R * (0.35 + ((i % 3) * 0.15));
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, 4, 2, a, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8 + 0.35;
        const d = R * 0.52;
        ctx.fillStyle = palette.topping || "#b91c1c";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, R * 0.12, 0, TAU);
        ctx.fill();
      }
    }

    // Stuck knives
    ctx.save();
    for (const rel of this.knives) {
      ctx.save();
      ctx.rotate(rel - HALF_PI);
      ctx.translate(0, R - embed);
      drawKnifeBlade(ctx, L);
      ctx.restore();
    }
    ctx.restore();

    ctx.restore();

    // Specular highlight
    const light = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 2, 0, 0, R);
    light.addColorStop(0, "rgba(255,255,255,0.25)");
    light.addColorStop(0.5, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [knivesCount, setKnivesCount] = useState({ total: 7, remaining: 7 });
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number, dur: number, type: OscillatorType, slide = 0) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch {
      // Audio not permitted
    }
  };

  const engineRef = useRef<{
    score: number;
    stage: number;
    total: number;
    remaining: number;
    state: "playing" | "clearing" | "over";
    target: TargetObject;
    cfg: ReturnType<typeof stageConfig>;
    flying: KnifeObject | null;
    bounce: KnifeObject | null;
    shards: Array<{ x: number; y: number; vx: number; vy: number; rot: number; vr: number; r: number; color: string }>;
    shake: number;
    cx: number;
    cy: number;
    R: number;
    L: number;
    embed: number;
    speed: number;
    readyY: number;
    hitY: number;
    w: number;
    h: number;
    dpr: number;
    cool: number;
    last: number;
    timer: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dastyor_game_best");
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  const triggerBanner = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 1200);
  };

  const copyPromo = () => {
    if (!rewardCode) return;
    navigator.clipboard.writeText(rewardCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startNewGame = () => {
    setGameOver(false);
    setRewardCode(null);
    setCopied(false);
    const eng = engineRef.current;
    if (!eng) return;
    eng.score = 0;
    eng.stage = 1;
    eng.state = "playing";
    eng.cfg = stageConfig(1);
    eng.target.reset(eng.cfg.obstacles);
    eng.total = eng.cfg.knives;
    eng.remaining = eng.cfg.knives;
    eng.flying = null;
    eng.bounce = null;
    eng.shards = [];
    eng.shake = 0;
    setScore(0);
    setStage(1);
    setKnivesCount({ total: eng.total, remaining: eng.remaining });
    triggerBanner("1-Bosqich");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const eng = {
      score: 0,
      stage: 1,
      total: 7,
      remaining: 7,
      state: "playing" as const,
      target: new TargetObject(),
      cfg: stageConfig(1),
      flying: null as KnifeObject | null,
      bounce: null as KnifeObject | null,
      shards: [] as Array<{ x: number; y: number; vx: number; vy: number; rot: number; vr: number; r: number; color: string }>,
      shake: 0,
      cx: 0,
      cy: 0,
      R: 0,
      L: 0,
      embed: 0,
      speed: 0,
      readyY: 0,
      hitY: 0,
      w: 0,
      h: 0,
      dpr: 1,
      cool: 0,
      last: performance.now(),
      timer: 0,
    };
    engineRef.current = eng;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      eng.w = rect.width;
      eng.h = rect.height;
      eng.dpr = dpr;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      eng.cx = eng.w / 2;
      eng.cy = eng.h * 0.32;
      eng.R = Math.min(eng.w * 0.24, 95);
      eng.L = eng.R * 0.9;
      eng.embed = eng.L * 0.26;
      eng.speed = eng.h * 2.8;
      eng.readyY = eng.h * 0.82;
      eng.hitY = eng.cy + eng.R - eng.embed;
    };

    resize();
    window.addEventListener("resize", resize);

    eng.cfg = stageConfig(1);
    eng.target.reset(eng.cfg.obstacles);
    eng.total = eng.cfg.knives;
    eng.remaining = eng.cfg.knives;
    setKnivesCount({ total: eng.total, remaining: eng.remaining });

    let animationFrameId: number;

    const throwKnife = () => {
      if (eng.state !== "playing" || eng.flying || eng.remaining <= 0 || eng.cool > 0) return;
      eng.cool = 0.12;
      eng.flying = new KnifeObject(eng.cx, eng.readyY);
      eng.remaining -= 1;
      setKnivesCount({ total: eng.total, remaining: eng.remaining });
      playTone(520, 0.06, "triangle", -250);
    };

    const resolveHit = () => {
      if (!eng.flying) return;
      const hitAngle = norm(HALF_PI - eng.target.angle);
      const isClash = eng.target.knives.some((a) => angDiff(a, hitAngle) < DELTA);

      if (isClash) {
        playTone(110, 0.35, "sawtooth", -80);
        eng.shake = 22;
        eng.bounce = new KnifeObject(
          eng.flying.x,
          eng.flying.y,
          0,
          (Math.random() - 0.5) * 220,
          260,
          (Math.random() < 0.5 ? -1 : 1) * 14,
        );
        eng.flying = null;
        eng.state = "over";
        eng.timer = 0.8;
      } else {
        playTone(160, 0.08, "square", -60);
        eng.target.knives.push(hitAngle);
        eng.flying = null;
        eng.shake = 7;
        eng.score += 1;
        setScore(eng.score);

        if (eng.remaining === 0) {
          playTone(440, 0.3, "sine", 440);
          eng.state = "clearing";
          eng.timer = 0.5;

          const count = 22;
          for (let i = 0; i < count; i++) {
            const a = (i * TAU) / count;
            const spd = 120 + Math.random() * 200;
            eng.shards.push({
              x: eng.cx,
              y: eng.cy,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd - 60,
              rot: Math.random() * TAU,
              vr: (Math.random() - 0.5) * 12,
              r: 8 + Math.random() * 10,
              color: i % 2 ? eng.cfg.palette.base : eng.cfg.palette.ring,
            });
          }
        }
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - eng.last) / 1000, 1 / 30);
      eng.last = now;

      eng.cool = Math.max(0, eng.cool - dt);
      eng.shake *= Math.pow(0.0005, dt);

      if (eng.state === "playing") {
        eng.target.update(dt, eng.cfg);
      }

      if (eng.flying) {
        eng.flying.y -= eng.speed * dt;
        if (eng.flying.y <= eng.hitY) {
          eng.flying.y = eng.hitY;
          resolveHit();
        }
      }

      if (eng.bounce) {
        eng.bounce.vy += eng.h * 2.4 * dt;
        eng.bounce.x += eng.bounce.vx * dt;
        eng.bounce.y += eng.bounce.vy * dt;
        eng.bounce.rot += eng.bounce.vr * dt;
      }

      for (const s of eng.shards) {
        s.vy += eng.h * 2.2 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vr * dt;
      }
      eng.shards = eng.shards.filter((s) => s.y < eng.h + 60);

      if (eng.state !== "playing" && eng.timer > 0) {
        eng.timer -= dt;
        if (eng.timer <= 0) {
          if (eng.state === "clearing") {
            eng.stage += 1;
            eng.cfg = stageConfig(eng.stage);
            eng.target.reset(eng.cfg.obstacles);
            eng.total = eng.cfg.knives;
            eng.remaining = eng.cfg.knives;
            eng.state = "playing";
            setStage(eng.stage);
            setKnivesCount({ total: eng.total, remaining: eng.remaining });
            triggerBanner(`${eng.stage}-Bosqich`);
          } else {
            setGameOver(true);
            const currentBest = parseInt(localStorage.getItem("dastyor_game_best") || "0", 10);
            if (eng.score > currentBest) {
              localStorage.setItem("dastyor_game_best", eng.score.toString());
              setBestScore(eng.score);
            }
            if (eng.score >= CONFIG.rewardScore) {
              setRewardCode(CONFIG.promoCode);
            }
          }
        }
      }

      ctx.setTransform(eng.dpr, 0, 0, eng.dpr, 0, 0);
      ctx.clearRect(0, 0, eng.w, eng.h);

      ctx.save();
      if (eng.shake > 0.5) {
        ctx.translate((Math.random() - 0.5) * eng.shake, (Math.random() - 0.5) * eng.shake);
      }

      if (eng.state !== "clearing") {
        eng.target.draw(ctx, eng.cx, eng.cy, eng.R, eng.L, eng.embed, eng.cfg.palette);
      }

      if (eng.flying) {
        eng.flying.draw(ctx, eng.L);
      } else if (eng.state === "playing" && eng.remaining > 0) {
        new KnifeObject(eng.cx, eng.readyY).draw(ctx, eng.L);
      }

      if (eng.bounce) {
        eng.bounce.draw(ctx, eng.L);
      }

      for (const s of eng.shards) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color;
        ctx.fillRect(-s.r, -s.r * 0.6, s.r * 2, s.r * 1.2);
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      throwKnife();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-black select-none text-white font-sans">
      {/* iOS Status Bar & Dynamic Island Header */}
      <header className="pt-safe relative z-20 flex items-center justify-between px-4 pt-3 pb-2">
        <Link
          to="/home"
          aria-label="Orqaga"
          className="flex h-9 items-center gap-1 px-2.5 rounded-full bg-white/10 active:bg-white/20 backdrop-blur-xl border border-white/10 transition-colors text-white"
        >
          <ChevronLeft className="h-5 w-5 -ml-1 text-primary" />
          <span className="text-[13px] font-medium text-white/90">Menyu</span>
        </Link>

        {/* Apple Capsule HUD */}
        <div className="flex items-center gap-3 rounded-full bg-white/[0.08] px-4 py-1.5 backdrop-blur-2xl border border-white/10 shadow-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-medium text-white/50">Ball</span>
            <span className="text-base font-bold text-white tabular-nums">{score}</span>
          </div>
          <div className="h-3 w-px bg-white/20" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-medium text-white/50">Bosqich</span>
            <span className="text-base font-bold text-primary tabular-nums">{stage}</span>
          </div>
        </div>

        <button
          type="button"
          aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          onClick={() => setSoundEnabled((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20 backdrop-blur-xl border border-white/10 transition-colors text-white/80"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-white/40" />}
        </button>
      </header>

      {/* Main Game Surface */}
      <div className="relative flex-1 touch-none">
        <canvas ref={canvasRef} className="h-full w-full cursor-pointer touch-none" />

        {/* Stage Notification (iOS Banner) */}
        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center animate-in zoom-in-95 duration-200">
            <div className="rounded-full bg-white/15 border border-white/25 px-6 py-2.5 backdrop-blur-2xl shadow-2xl">
              <span className="text-lg font-bold tracking-tight text-white">
                {banner}
              </span>
            </div>
          </div>
        )}

        {/* iOS Vertical Knife Meter */}
        <div className="pointer-events-none absolute bottom-6 left-4 flex flex-col-reverse gap-1.5 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
          {Array.from({ length: knivesCount.total }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-4 w-1.5 rounded-full transition-all duration-300",
                idx < knivesCount.remaining
                  ? "bg-primary shadow-[0_0_6px_rgba(255,85,0,0.8)]"
                  : "bg-white/10",
              )}
            />
          ))}
        </div>
      </div>

      {/* Apple Subtle Gesture Hint */}
      <div className="pb-safe relative z-10 text-center pb-3 pointer-events-none">
        <p className="text-[11px] font-medium tracking-wide text-white/30">
          Otish uchun ekranga bosing
        </p>
      </div>

      {/* iOS Native Action Sheet / Modal: Game Over */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-[#1c1c1e]/95 border-t sm:border border-white/15 p-6 text-center shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom duration-300">
            
            {/* iOS Sheet Grabber on mobile */}
            <div className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

            <h3 className="text-xl font-bold tracking-tight text-white">Natija</h3>
            <p className="mt-1 text-xs text-white/50">Ushbu urinishdagi ko'rsatkichlaringiz</p>

            {/* Apple Grouped Inset Stats */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl bg-white/[0.06] border border-white/10 py-3">
              <div>
                <span className="text-[11px] font-medium text-white/50">To'plangan</span>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-white tabular-nums">{score}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-white/50">Bosqich</span>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-primary tabular-nums">{stage}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-white/50">Eng yaxshi</span>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">{bestScore}</p>
              </div>
            </div>

            {/* iOS Promo Card */}
            {rewardCode && (
              <div className="mt-4 rounded-2xl bg-white/[0.06] border border-primary/30 p-3.5 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Chegirma promokodi</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-black/40 px-3 py-2 border border-white/10">
                  <span className="font-mono text-sm font-bold tracking-wider text-white">
                    {rewardCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyPromo}
                    className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] font-medium text-white transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Nusxalandi" : "Nusxa olish"}</span>
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-white/40">
                  Buyurtma rasmiylashtirishda ushbu kod orqali chegirmaga ega bo'ling
                </p>
              </div>
            )}

            {/* Apple Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                variant="unstyled"
                size="unset"
                onClick={startNewGame}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-md active:opacity-80 transition-opacity"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Qaytadan boshlash</span>
              </Button>

              <Link
                to="/home"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-sm font-medium text-white/90 active:opacity-80 transition-all"
              >
                Asosiy menyuga qaytish
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
