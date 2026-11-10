import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Pichoq o'yini — Dastyor Food" },
      { name: "description", content: "Pichoq o'yinini o'ynab, taomlarga chegirma promokodlarini yutib oling!" },
      { property: "og:title", content: "Pichoq o'yini — Dastyor Food" },
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
  rewardMessage: "BURGER10",
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

  // Blade gradient
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, "#85939e");
  g.addColorStop(0.42, "#ffffff");
  g.addColorStop(0.58, "#dce5ea");
  g.addColorStop(1, "#73808a");

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.15, L * 0.07, w / 2, L * 0.2);
  ctx.lineTo(w / 2, bl);
  ctx.lineTo(-w / 2, bl);
  ctx.lineTo(-w / 2, L * 0.2);
  ctx.quadraticCurveTo(-w * 0.15, L * 0.07, 0, 0);
  ctx.fillStyle = g;
  ctx.fill();

  // Full-length bevel
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, bl);
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Guard
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(-w * 0.65, bl, w * 1.3, L * 0.06);

  // Handle
  const hg = ctx.createLinearGradient(-w * 0.35, 0, w * 0.35, 0);
  hg.addColorStop(0, "#991b1b");
  hg.addColorStop(0.5, "#ef4444");
  hg.addColorStop(1, "#7f1d1d");

  ctx.beginPath();
  ctx.roundRect(-w * 0.35, bl + L * 0.06, w * 0.7, L - bl - L * 0.06, [0, 0, 4, 4]);
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

    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    // Outer crust / ring
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

    // Food decoration
    if (palette.type === "donut") {
      ctx.fillStyle = palette.icing || "#f472b6";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.78, 0, TAU);
      ctx.fill();

      // Donut hole
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.28, 0, TAU);
      ctx.fill();
    } else if (palette.type === "burger") {
      // Sesame seeds
      ctx.fillStyle = "#fef08a";
      for (let i = 0; i < 14; i++) {
        const a = (i * TAU) / 14 + 0.2;
        const d = R * (0.35 + ((i % 3) * 0.15));
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, 4, 2, a, 0, TAU);
        ctx.fill();
      }
    } else {
      // Pizza slices & pepperoni
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

    ctx.restore(); // end rotation

    // Highlight reflection
    const light = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 2, 0, 0, R);
    light.addColorStop(0, "rgba(255,255,255,0.3)");
    light.addColorStop(0.5, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(0,0,0,0.25)");
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
      // Audio not permitted yet
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

  const startNewGame = () => {
    setGameOver(false);
    setRewardCode(null);
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
        // Clash & Fail
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
        // Successful hit
        playTone(160, 0.08, "square", -60);
        eng.target.knives.push(hitAngle);
        eng.flying = null;
        eng.shake = 7;
        eng.score += 1;
        setScore(eng.score);

        if (eng.remaining === 0) {
          // Stage cleared
          playTone(440, 0.3, "sine", 440);
          eng.state = "clearing";
          eng.timer = 0.5;

          // Break into shards
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

      // Update
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
            // Next Stage
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
            // Game Over
            setGameOver(true);
            const currentBest = parseInt(localStorage.getItem("dastyor_game_best") || "0", 10);
            if (eng.score > currentBest) {
              localStorage.setItem("dastyor_game_best", eng.score.toString());
              setBestScore(eng.score);
            }
            if (eng.score >= CONFIG.rewardScore) {
              setRewardCode(CONFIG.rewardMessage);
            }
          }
        }
      }

      // Draw
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
    <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-[#0c131a] select-none text-white font-sans">
      {/* iPhone Dynamic Island / Top Header */}
      <header className="pt-safe relative z-20 flex items-center justify-between px-5 pt-3 pb-2">
        <Link
          to="/home"
          aria-label="Chiqish"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:scale-95 transition-all text-white/90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* HUD: Score & Stage in iPhone glass capsule */}
        <div className="flex items-center gap-4 rounded-full bg-white/10 px-5 py-1.5 backdrop-blur-lg border border-white/15 shadow-lg">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Ball</span>
            <p className="text-lg font-extrabold leading-none tracking-tight text-amber-400">{score}</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Bosqich</span>
            <p className="text-lg font-extrabold leading-none tracking-tight text-white">{stage}</p>
          </div>
        </div>

        <button
          type="button"
          aria-label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          onClick={() => setSoundEnabled((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:scale-95 transition-all text-white/90"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4 text-white/50" />}
        </button>
      </header>

      {/* Main Game Canvas */}
      <div className="relative flex-1 touch-none">
        <canvas ref={canvasRef} className="h-full w-full cursor-pointer touch-none" />

        {/* Stage Clear Banner */}
        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center animate-in zoom-in-95 duration-300">
            <div className="rounded-full bg-white/15 border border-white/30 px-6 py-2 backdrop-blur-xl shadow-2xl">
              <span className="font-display text-xl font-black tracking-wide text-white drop-shadow">
                {banner}
              </span>
            </div>
          </div>
        )}

        {/* Remaining Knives Counter (iPhone style left bar) */}
        <div className="pointer-events-none absolute bottom-8 left-5 flex flex-col-reverse gap-1.5">
          {Array.from({ length: knivesCount.total }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-5 w-2 rounded-xs transition-all duration-200",
                idx < knivesCount.remaining
                  ? "bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : "bg-white/15 scale-75 opacity-30",
              )}
            />
          ))}
        </div>
      </div>

      {/* Tap Instruction Indicator */}
      <div className="pb-safe relative z-10 text-center pb-4 pointer-events-none">
        <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
          Ekranni bosing — Pichoq otiladi
        </p>
      </div>

      {/* iPhone Glass Panel: Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xs rounded-[32px] border border-white/20 bg-gradient-to-b from-[#1e293b]/90 to-[#0f172a]/95 p-6 text-center shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4 shadow-inner">
              <Trophy className="h-7 w-7" />
            </div>

            <h2 className="font-display text-2xl font-black text-white">O'yin tugadi</h2>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-3 border border-white/10">
              <div>
                <span className="text-[10px] text-white/50 block font-medium">Ball</span>
                <strong className="text-xl font-extrabold text-amber-400">{score}</strong>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] text-white/50 block font-medium">Bosqich</span>
                <strong className="text-xl font-extrabold text-white">{stage}</strong>
              </div>
              <div>
                <span className="text-[10px] text-white/50 block font-medium">Rekord</span>
                <strong className="text-xl font-extrabold text-emerald-400">{bestScore}</strong>
              </div>
            </div>

            {/* Special Reward Promo Code if score >= 10 */}
            {rewardCode && (
              <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3.5 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                  <Sparkles className="h-4 w-4" /> Chegirma yutib oldingiz!
                </div>
                <div className="rounded-lg bg-black/40 px-3 py-1 font-mono text-sm font-black tracking-widest text-amber-400 border border-amber-400/30">
                  {rewardCode}
                </div>
                <p className="mt-1 text-[10px] text-white/60">Buyurtma berishda ushbu kodni ishlating</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                variant="unstyled"
                size="unset"
                onClick={startNewGame}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-black shadow-lg shadow-orange-500/25 active:scale-98 transition-transform"
              >
                <RotateCcw className="h-4 w-4 stroke-[2.5]" /> Qayta o'ynash
              </Button>
              <Link
                to="/home"
                className="flex h-11 w-full items-center justify-center rounded-2xl bg-white/10 text-xs font-bold text-white/80 hover:bg-white/15 active:scale-98 transition-all"
              >
                Menyuga qaytish
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
