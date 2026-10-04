"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Copy, Check, Volume2, VolumeX, Music } from "lucide-react";

type Scene = {
  id: string;
  dur: number; // seconds
  kicker: string;
  title: React.ReactNode;
  sub: string;
  visual: React.ReactNode;
  narration: string;
};

function ChatMock({ messages, highlight }: { messages: { from: string; text: React.ReactNode }[]; highlight?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/60 p-4 text-left shadow-2xl">
      {messages.map((m, i) => (
        <div key={i} className={`chat-in mb-3 rounded-xl p-3 text-sm ${m.from === "you" ? "ml-8 bg-violet-600/30" : "mr-8 bg-white/5"}`}
          style={{ animationDelay: `${i * 0.9}s` }}>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">{m.from === "you" ? "Buyer" : "AI answer"}</div>
          <div className={highlight && m.from === "ai" ? "text-slate-100" : "text-slate-300"}>{m.text}</div>
        </div>
      ))}
    </div>
  );
}

function ScoreDemo() {
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-6 rounded-2xl border border-white/10 bg-black/60 p-6">
      <div className="score-pop text-center">
        <div className="text-6xl font-extrabold text-emerald-300">73</div>
        <div className="text-xs uppercase tracking-widest text-slate-400">GEO score · B</div>
      </div>
      <div className="flex-1 space-y-2 text-left text-xs">
        {[["Answer-ready", 81], ["E-E-A-T", 68], ["Structured data", 44]].map(([l, v], i) => (
          <div key={l as string}>
            <div className="mb-1 flex justify-between text-slate-400"><span>{l}</span><span>{v}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-400" style={{ width: `${v}%`, animationDelay: `${0.4 + i * 0.4}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptGrid() {
  const engines = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Copilot", "Llama 3"];
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/60 p-4 text-left">
      <div className="mb-3 text-sm text-slate-300">“Best CRM for startups?”</div>
      <div className="grid grid-cols-3 gap-2">
        {engines.map((e, i) => (
          <div key={e} className={`cell-on rounded-xl border p-3 text-center ${i < 4 ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}
            style={{ animationDelay: `${0.5 + i * 0.45}s` }}>
            <div className="text-xs font-semibold">{e}</div>
            <div className="mt-1 text-lg">{i < 4 ? "✓" : "✕"}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-slate-400">4 of 6 engines cite you</div>
    </div>
  );
}

function FixesDemo() {
  const fixes = ["JSON-LD schema bundle added", "AI excerpt + FAQ block", "llms.txt published"];
  return (
    <div className="mx-auto max-w-md space-y-2 text-left">
      {fixes.map((f, i) => (
        <div key={f} className="check-in flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"
          style={{ animationDelay: `${0.5 + i * 0.7}s` }}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-black">✓</span>
          {f}
        </div>
      ))}
      <pre className="check-in overflow-hidden rounded-xl bg-black/70 p-3 text-[11px] text-emerald-200" style={{ animationDelay: "2.6s" }}>
{`<script type="application/ld+json">
{"@type":"FAQPage", ...}
</script>`}
      </pre>
    </div>
  );
}

const SCENES: Scene[] = [
  {
    id: "hook", dur: 11, kicker: "Scene 1 · The shift",
    title: <>Your buyers stopped Googling.<br />They <span className="gradient-text">ask AI.</span></>,
    sub: "58% of product searches now end in an AI answer.",
    visual: <ChatMock messages={[
      { from: "you", text: "What's the best CRM for a 10-person startup?" },
      { from: "ai", text: <>Try <b>Competitor A</b> — free tier, fast setup. Sources: <span className="text-violet-300 underline">g2.com</span> · <span className="text-violet-300 underline">reddit.com</span></> },
    ]} />,
    narration: "Your buyers stopped Googling. They ask AI — and the AI answers with a short list of brands, each with a clickable citation. If your business isn't cited, you were never in the room.",
  },
  {
    id: "problem", dur: 11, kicker: "Scene 2 · The problem",
    title: <>If you're not cited,<br />you <span className="text-red-300">don't exist.</span></>,
    sub: "AI answers mention ~3 brands. Everyone else is invisible.",
    visual: <ChatMock highlight messages={[
      { from: "you", text: "Is Acme reliable? Reviews and pricing?" },
      { from: "ai", text: <>Mixed reviews for Acme. Most buyers pick <b>Competitor A</b> or <b>B</b>. Sources: <span className="text-violet-300 underline">competitor-a.com/vs</span> · <span className="text-violet-300 underline">g2.com</span></> },
    ]} />,
    narration: "Here's the painful part. A buyer asks about YOUR brand by name — and the AI still recommends your competitors, citing their comparison pages and reviews. SEO can't fix this. This is a Generative Engine Optimization problem.",
  },
  {
    id: "audit", dur: 14, kicker: "Scene 3 · Diagnose — GEO Audit",
    title: <>RankAI audits how AI sees you.<br /><span className="gradient-text">6 pillars, 60+ checks.</span></>,
    sub: "Live fetch: schema, E-E-A-T, answer-readiness, citability…",
    visual: <ScoreDemo />,
    narration: "RankAI fetches your site live and scores it the way AI engines do: structured data, authority signals, and whether your content is written in quotable, answer-ready form. One number, with every fix ranked by impact.",
  },
  {
    id: "track", dur: 14, kicker: "Scene 4 · Track — Prompt Lab",
    title: <>Test the exact prompts<br />your <span className="gradient-text">buyers ask.</span></>,
    sub: "Across ChatGPT, Perplexity, Gemini, Claude, Copilot + open Llama.",
    visual: <PromptGrid />,
    narration: "Then track the prompts that matter — pricing, comparisons, reviews — across seven AI engines. See who gets cited, who gets skipped, and which competitor stole your spot.",
  },
  {
    id: "optimize", dur: 14, kicker: "Scene 5 · Fix — Content Optimizer",
    title: <>Apply the fixes that<br /><span className="gradient-text">earn citations.</span></>,
    sub: "FAQ schema, AI excerpts, llms.txt — copy-paste ready.",
    visual: <FixesDemo />,
    narration: "Now fix it: add the schema bundle AI crawlers look for, lead every page with a quotable answer block, and publish an llms.txt file. RankAI generates all three for you — copy, paste, done.",
  },
  {
    id: "outcome", dur: 12, kicker: "Scene 6 · The outcome",
    title: <>Same question.<br /><span className="text-emerald-300">Now you're the answer.</span></>,
    sub: "Citation rate 61% and climbing.",
    visual: <ChatMock highlight messages={[
      { from: "you", text: "What's the best CRM for a 10-person startup?" },
      { from: "ai", text: <>Top pick: <b>Acme</b> — transparent pricing, 4.8★ from 2,100 reviews. Sources: <span className="text-emerald-300 underline">acme.com/pricing</span> · <span className="text-emerald-300 underline">acme.com/faq</span></> },
    ]} />,
    narration: "Ninety days later, the same buyer asks the same question — and now your pages are the cited sources. That's Generative Engine Optimization: from invisible, to mentioned, to cited.",
  },
  {
    id: "cta", dur: 10, kicker: "RankAI GEO",
    title: <><span className="gradient-text">Get cited by AI answers.</span></>,
    sub: "Free 60-second AI visibility audit. No credit card.",
    visual: (
      <div className="mx-auto max-w-md rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-600/30 to-emerald-600/20 p-8 text-center">
        <div className="text-5xl font-extrabold">R</div>
        <div className="mt-2 text-2xl font-bold">RankAI</div>
        <div className="mt-1 text-sm text-slate-300">rankai.geo/dashboard/audit</div>
      </div>
    ),
    narration: "Run your free AI visibility audit today, and see exactly how ChatGPT, Perplexity and Gemini see your business.",
  },
];

const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

export default function VideoPage() {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [wall, setWall] = useState(0);
  const [over, setOver] = useState(0);
  const wallRef = useRef(0);
  const sceneStartRef = useRef(0);
  const prevIdxRef = useRef(0);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [voiceURI, setVoiceURI] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const speakingRef = useRef(false);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; sched?: number } | null>(null);
  const idxRef = useRef(0);

  // Browsers block audio until the first user gesture. Sound defaults ON and
  // unlocks itself on the first tap/click/keypress anywhere on the page.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current?.sched) clearInterval(audioRef.current.sched);
      audioRef.current?.ctx.close().catch(() => {});
    };
  }, []);

  // Upbeat 116 BPM loop, fully synthesized: kick, hats, bass, offbeat
  // chord stabs + pentatonic pluck over C – G – Am – F.
  const startMusic = () => {
    try {
      if (audioRef.current) { audioRef.current.ctx.resume(); return; }
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const prog = [
        { root: 130.81, chord: [261.63, 329.63, 392.0] },  // C
        { root: 98.0, chord: [196.0, 246.94, 392.0] },    // G
        { root: 110.0, chord: [220.0, 261.63, 329.63] },  // Am
        { root: 87.31, chord: [174.61, 220.0, 349.23] },  // F
      ];
      const melody = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
      const bpm = 116;
      const s16 = 60 / bpm / 4;

      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

      const tone = (f: number, t: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.05);
      };
      const hat = (t: number, open = false) => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = 7500;
        const g = ctx.createGain();
        const dur = open ? 0.18 : 0.05;
        g.gain.setValueAtTime(open ? 0.09 : 0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(hp); hp.connect(g); g.connect(master);
        src.start(t); src.stop(t + dur + 0.02);
      };

      let step = 0;
      let nextT = ctx.currentTime + 0.1;
      const sched = window.setInterval(() => {
        if (ctx.state !== "running") return;
        while (nextT < ctx.currentTime + 0.3) {
          const bar = Math.floor(step / 16) % 4;
          const s = step % 16;
          const { root, chord } = prog[bar];
          if (s % 4 === 0) tone(150, nextT, 0.12, "sine", 0.5, 48);            // kick
          if (s % 2 === 1 || s % 16 === 14) hat(nextT, s % 8 === 6);            // hats
          if (s % 2 === 0) tone(root, nextT, 0.18, "square", 0.07);             // bass 8ths
          if (s === 2 || s === 7 || s === 10) chord.forEach((f) => tone(f, nextT, 0.14, "triangle", 0.08)); // skank
          if (s % 2 === 0) tone(melody[(bar * 2 + s / 2) % 8], nextT, 0.2, "triangle", 0.1); // pluck
          nextT += s16;
          step++;
        }
      }, 80);

      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
      audioRef.current = { ctx, gain: master, sched };
    } catch { /* audio unsupported — video still plays silent */ }
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    if (!soundOn) return;
    if (next) startMusic();
    else if (audioRef.current) {
      audioRef.current.gain.gain.linearRampToValueAtTime(0, audioRef.current.ctx.currentTime + 0.5);
      setTimeout(() => audioRef.current?.ctx.suspend(), 600);
    }
  };

  useEffect(() => {
    if (!playing) return;
    // t (scene clock) freezes while narration speaks so scenes are never cut
    // off; wall (display clock) always advances so the tracker never stalls.
    timer.current = setInterval(() => {
      setT((v) => {
        if (v + 0.1 >= TOTAL) {
          setWall(0);
          setOver(0);
          return 0;
        }
        return speakingRef.current ? v : v + 0.1;
      });
      setWall((w) => w + 0.1);
    }, 100);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing]);

  let acc = 0, idx = 0, local = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t < acc + SCENES[i].dur) { idx = i; local = t - acc; break; }
    acc += SCENES[i].dur; idx = i; local = SCENES[i].dur;
  }
  const scene = SCENES[idx];
  wallRef.current = wall;
  const liveTotal = TOTAL + over;
  const liveProgress = Math.min(100, (wall / liveTotal) * 100);
  idxRef.current = idx;

  // Speak a scene's narration. Extracted so the first user gesture can
  // (re)trigger it — browsers discard speech requested before interaction.
  const speakScene = (i: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SCENES[i].narration);
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    u.voice =
      en.find((v) => v.voiceURI === voiceURI) ??
      en.find((v) => /google us english|samantha|zira|aria|jenny/i.test(v.name)) ??
      en[0] ??
      null;
    u.rate = 1.02;
    speakingRef.current = true;
    const done = () => {
      // small beat after the last word before the scene moves on
      setTimeout(() => { speakingRef.current = false; }, 450);
    };
    u.onend = done;
    u.onerror = done;
    // safety: never freeze longer than 90s even if speech events misbehave
    setTimeout(() => { speakingRef.current = false; }, 90000);
    window.speechSynthesis.speak(u);
  };

  // Unlock audio on the first interaction anywhere: start music and
  // (re)speak the current scene, since pre-gesture speech gets discarded.
  useEffect(() => {
    if (unlocked || !soundOn) return;
    const unlock = () => {
      setUnlocked(true);
      if (musicOn) startMusic();
      else audioRef.current?.ctx.resume().catch(() => {});
      window.speechSynthesis?.cancel();
      speakScene(idxRef.current);
    };
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, soundOn, musicOn]);

  // Speak the current scene's narration whenever the scene changes (if sound on).
  // The scene clock freezes while speaking (see timer), so long narrations —
  // e.g. scene 1 — always play out fully before advancing. Overtime beyond the
  // planned duration is added to the displayed total so the tracker stays live.
  useEffect(() => {
    const spent = wallRef.current - sceneStartRef.current;
    const extra = spent - SCENES[prevIdxRef.current].dur;
    if (extra > 0.5) setOver((o) => o + extra);
    sceneStartRef.current = wallRef.current;
    prevIdxRef.current = idx;
    if (!soundOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speakScene(idx);
    return () => {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, soundOn]);

  const copyScript = () => {
    navigator.clipboard.writeText(SCENES.map((s, i) => `SCENE ${i + 1} (${s.kicker}, ${s.dur}s)\n${s.narration}`).join("\n\n"));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#05070D]">
      <style>{`
        @keyframes chatIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .chat-in { opacity: 0; animation: chatIn 0.5s ease forwards; }
        @keyframes barGrow { from { width: 0 !important; } }
        .bar-grow { animation: barGrow 1s ease forwards; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        .score-pop { animation: popIn 0.7s ease both; }
        @keyframes cellOn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .cell-on { opacity: 0; animation: cellOn 0.4s ease forwards; }
        @keyframes checkIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
        .check-in { opacity: 0; animation: checkIn 0.5s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .scene-enter { animation: fadeUp 0.5s ease both; }
      `}</style>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold">R</div>
          <span className="font-bold">RankAI <span className="text-xs font-medium text-slate-400">explainer · {Math.round(TOTAL)}s</span></span>
        </Link>
        <Link href="/dashboard" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">Open the app</Link>
      </header>

      {/* 16:9 stage */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F1A]">
          <div className="grid-bg absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
          <div key={scene.id} className="scene-enter relative grid h-full grid-cols-2 items-center gap-6 px-10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{scene.kicker}</div>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight lg:text-4xl">{scene.title}</h1>
              <p className="mt-3 text-sm text-slate-400">{scene.sub}</p>
            </div>
            <div>{scene.visual}</div>
          </div>
          {/* transport */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 transition-[width] duration-100" style={{ width: `${liveProgress}%` }} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlaying(!playing)} className="rounded-full bg-white p-2 text-black">
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={() => { window.speechSynthesis?.cancel(); speakingRef.current = false; setT(0); setWall(0); setOver(0); sceneStartRef.current = 0; prevIdxRef.current = 0; }} className="rounded-full border border-white/20 p-2"><RotateCcw size={16} /></button>
              <span className="text-xs text-slate-300">{Math.floor(wall)}s / ~{Math.round(liveTotal)}s · {scene.kicker}</span>
              <div className="ml-auto flex items-center gap-1.5">
                {!unlocked && soundOn && (
                  <span className="animate-pulse rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-medium text-amber-200">
                    Tap anywhere for sound
                  </span>
                )}
                {soundOn ? (
                  <>
                    <button onClick={() => { setSoundOn(false); window.speechSynthesis?.cancel(); speakingRef.current = false; }} title="Mute narration"
                      className="rounded-full border border-white/20 p-1.5"><Volume2 size={14} /></button>
                    <button onClick={toggleMusic} title={musicOn ? "Mute music" : "Unmute music"}
                      className={`rounded-full border p-1.5 ${musicOn ? "border-emerald-400/50 text-emerald-300" : "border-white/20 text-slate-400"}`}>
                      <Music size={14} />
                    </button>
                    {voices.filter((v) => v.lang.toLowerCase().startsWith("en")).length > 1 && (
                      <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}
                        className="max-w-[130px] rounded-lg border border-white/20 bg-black/60 px-1.5 py-1 text-[11px] text-slate-300 outline-none">
                        <option value="">Auto voice</option>
                        {voices.filter((v) => v.lang.toLowerCase().startsWith("en")).slice(0, 12).map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>{v.name.slice(0, 28)}</option>
                        ))}
                      </select>
                    )}
                  </>
                ) : (
                  <button onClick={() => { setSoundOn(true); setUnlocked(true); if (musicOn) startMusic(); speakScene(idxRef.current); }} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">
                    <VolumeX size={14} /> Unmute
                  </button>
                )}
              </div>
              <div className="ml-1 flex gap-1.5">
                {SCENES.map((s, i) => (
                  <button key={s.id} title={s.kicker}
                    onClick={() => {
                      window.speechSynthesis?.cancel();
                      speakingRef.current = false;
                      const target = SCENES.slice(0, i).reduce((a, x) => a + x.dur, 0);
                      setT(target);
                      setWall(target);
                      setOver(0);
                      sceneStartRef.current = target;
                      prevIdxRef.current = i;
                    }}
                    className={`h-2 w-6 rounded-full ${i === idx ? "bg-white" : i < idx ? "bg-white/40" : "bg-white/15"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">Tip: sound plays automatically after your first tap — fullscreen (F11), then screen-record with QuickTime (Cmd+Shift+5) for a shareable MP4 with audio.</p>
      </div>

      {/* narration script */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Voiceover script</h2>
          <button onClick={copyScript} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy script"}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {SCENES.map((s, i) => (
            <div key={s.id} className="glass rounded-xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">Scene {i + 1} · {s.dur}s</div>
              <p className="mt-1 text-sm text-slate-200">“{s.narration}”</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
