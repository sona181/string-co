"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { gsap } from "gsap";

// ── Genre definitions ─────────────────────────────────────────────────────────

type GenreId =
  | "hip-hop"
  | "classical"
  | "jazz"
  | "rock-metal"
  | "edm"
  | "country-folk"
  | "reggae"
  | "blues-soul";

type Genre = {
  name: string;
  color: string;
  darkText?: boolean;
  result: string;
};

const GENRES: Record<GenreId, Genre> = {
  "hip-hop":      { name: "Streetwear / Hip-Hop", color: "#FF3B1F",  result: "You're built for the beat. Bold tones, heavy bass, gear that hits as hard as the drop." },
  "classical":    { name: "Classical",             color: "#9B2335",  result: "You're drawn to precision and craft. Timeless tone, built to last generations." },
  "jazz":         { name: "Jazz",                  color: "#4B7BB5",  result: "You improvise, you feel it out. Warm tones, room to breathe, nothing forced." },
  "rock-metal":   { name: "Rock / Metal",          color: "#CC2200",  result: "You want it loud and you want it now. High-gain, heavy strings, no apologies." },
  "edm":          { name: "Electronic / EDM",      color: "#9B30FF",  result: "You live in the synths and the drop. Modern gear for modern sound." },
  "country-folk": { name: "Country / Folk",        color: "#C49A2A",  result: "You keep it honest and unplugged. Warm wood, real strings, real stories." },
  "reggae":       { name: "Reggae",                color: "#F7D726", darkText: true, result: "You keep it easy and in the pocket. Deep bass, laid-back groove, all day." },
  "blues-soul":   { name: "Blues / Soul",          color: "#8B4F8A",  result: "You play from the gut. Raw tone, real feeling, nothing polished away." },
};

// ── Questions ─────────────────────────────────────────────────────────────────

type Option   = { text: string; genre: GenreId };
type Question = { text: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    text: "Pick your Friday night",
    options: [
      { text: "A house party with the bass turned all the way up", genre: "hip-hop" },
      { text: "A concert hall, front row for the orchestra",        genre: "classical" },
      { text: "A dim, smoky jazz club downtown",                    genre: "jazz" },
      { text: "Front row, sweating it out at a rock show",          genre: "rock-metal" },
      { text: "A warehouse rave till sunrise",                      genre: "edm" },
      { text: "A bonfire with someone playing acoustic guitar",     genre: "country-folk" },
      { text: "Beach, feet in the sand, reggae on a speaker",      genre: "reggae" },
      { text: "A quiet night spinning soul records",                genre: "blues-soul" },
    ],
  },
  {
    text: "Pick a word for your energy",
    options: [
      { text: "Bold",     genre: "hip-hop" },
      { text: "Refined",  genre: "classical" },
      { text: "Smooth",   genre: "jazz" },
      { text: "Intense",  genre: "rock-metal" },
      { text: "Electric", genre: "edm" },
      { text: "Grounded", genre: "country-folk" },
      { text: "Easy",     genre: "reggae" },
      { text: "Soulful",  genre: "blues-soul" },
    ],
  },
  {
    text: "Choose an instrument you'd want to master",
    options: [
      { text: "Turntables or an MPC",                   genre: "hip-hop" },
      { text: "Violin or piano",                         genre: "classical" },
      { text: "Saxophone or upright bass",               genre: "jazz" },
      { text: "Electric guitar with heavy distortion",   genre: "rock-metal" },
      { text: "A synthesizer",                           genre: "edm" },
      { text: "Acoustic guitar or banjo",                genre: "country-folk" },
      { text: "Bass guitar with a deep groove",          genre: "reggae" },
      { text: "A Hammond organ or slide guitar",         genre: "blues-soul" },
    ],
  },
  {
    text: "Pick a movie soundtrack style",
    options: [
      { text: "Gritty city drama",              genre: "hip-hop" },
      { text: "Sweeping period drama",           genre: "classical" },
      { text: "Noir detective film",             genre: "jazz" },
      { text: "Action-packed blockbuster",       genre: "rock-metal" },
      { text: "Sci-fi thriller",                 genre: "edm" },
      { text: "Small-town coming-of-age story",  genre: "country-folk" },
      { text: "Laid-back island getaway",        genre: "reggae" },
      { text: "Slow-burn character drama",       genre: "blues-soul" },
    ],
  },
  {
    text: "Pick your dream stage",
    options: [
      { text: "A festival main stage",            genre: "hip-hop" },
      { text: "An opera house",                   genre: "classical" },
      { text: "A tiny basement club",             genre: "jazz" },
      { text: "An arena, pyrotechnics included",  genre: "rock-metal" },
      { text: "A massive outdoor rave",           genre: "edm" },
      { text: "A porch, no stage at all",         genre: "country-folk" },
      { text: "An outdoor summer festival",       genre: "reggae" },
      { text: "A neighborhood dive bar",          genre: "blues-soul" },
    ],
  },
  {
    text: "Last question — pick a color that matches your vibe",
    options: [
      { text: "Spray-can red",             genre: "hip-hop" },
      { text: "Deep burgundy and gold",    genre: "classical" },
      { text: "Midnight blue and brass",   genre: "jazz" },
      { text: "Blood red and black",       genre: "rock-metal" },
      { text: "Neon purple and cyan",      genre: "edm" },
      { text: "Denim blue and wheat",      genre: "country-folk" },
      { text: "Sun-bleached gold and green", genre: "reggae" },
      { text: "Dusty rose and indigo",     genre: "blues-soul" },
    ],
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function getWinner(answers: GenreId[]): GenreId {
  const counts = {} as Record<GenreId, number>;
  for (const g of answers) counts[g] = (counts[g] ?? 0) + 1;
  return (Object.entries(counts) as [GenreId, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Result screen (separate component so it always mounts fresh) ──────────────

function ResultScreen({ genre, onReset, isLoggedIn }: { genre: Genre; onReset: () => void; isLoggedIn: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }
  }, []);

  return (
    <div ref={ref} className="space-y-6 text-center" style={{ opacity: 0 }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rust-gray mb-3">Your lane</p>
        <span
          className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: genre.color, color: genre.darkText ? "#000" : "#F2EFE4" }}
        >
          {genre.name}
        </span>
        <p className="text-concrete text-lg leading-relaxed max-w-sm mx-auto mt-4">
          <span style={{ color: "#F7D726", fontSize: "1.15em", lineHeight: 1 }}>&ldquo;</span>
          {genre.result}
          <span style={{ color: "#F7D726", fontSize: "1.15em", lineHeight: 1 }}>&rdquo;</span>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 border border-rust-gray text-concrete text-sm font-bold px-5 py-2.5 rounded-lg hover:border-concrete transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Retake quiz
        </button>
        <Link
          href={isLoggedIn ? "/shop" : "/login?redirect=/shop"}
          className="inline-flex items-center gap-2 bg-spray-red text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all"
        >
          {isLoggedIn ? "Shop this vibe" : "Sign in to shop"} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenreQuiz({ isLoggedIn = false }: Readonly<{ isLoggedIn?: boolean }>) {
  const [current, setCurrent]         = useState(0);
  const [answers, setAnswers]         = useState<(GenreId | null)[]>(Array(QUESTIONS.length).fill(null));
  const [done, setDone]               = useState(false);
  const [winner, setWinner]           = useState<GenreId | null>(null);
  const [pickedGenre, setPickedGenre] = useState<GenreId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [enterKey, setEnterKey]       = useState(0); // increment triggers fade-in effect

  const containerRef    = useRef<HTMLDivElement>(null);
  const questionWrapRef = useRef<HTMLDivElement>(null);
  const btnRefs         = useRef<(HTMLButtonElement | null)[]>([]);
  const rafRef          = useRef<number>(0);

  // Fade-in new question after transition
  useEffect(() => {
    if (enterKey === 0 || !questionWrapRef.current) return;
    gsap.fromTo(
      questionWrapRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, [enterKey]);

  // Cleanup RAF on unmount
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  // ── Physics transition ───────────────────────────────────────────────────────

  const runPhysics = async (): Promise<void> => {
    const { default: Matter } = await import("matter-js");

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const btns = btnRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (btns.length === 0) return;

    // Snapshot positions before any state change
    const btnData = btns.map(btn => {
      const r = btn.getBoundingClientRect();
      const cx = r.left - containerRect.left + r.width  / 2;
      const cy = r.top  - containerRect.top  + r.height / 2;
      return { btn, cx, cy, w: r.width, h: r.height };
    });

    btns.forEach(btn => { btn.style.pointerEvents = "none"; });

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.2 } });

    const bodies = btnData.map(({ cx, cy, w, h }) => {
      const body = Matter.Bodies.rectangle(cx, cy, w, h, {
        restitution: 0.4,
        friction:    0.2,
        frictionAir: 0.02,
      });
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 9,
        y: Math.random() * 2 - 0.5,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.28);
      return body;
    });

    Matter.Composite.add(engine.world, bodies);

    return new Promise(resolve => {
      const DURATION  = 750;
      const startTime = performance.now();

      const tick = () => {
        const elapsed  = performance.now() - startTime;
        const progress = Math.min(elapsed / DURATION, 1);

        Matter.Engine.update(engine, 1000 / 60);

        bodies.forEach((body, i) => {
          const { btn, cx, cy } = btnData[i];
          const dx  = body.position.x - cx;
          const dy  = body.position.y - cy;
          const opacity = progress < 0.2
            ? 1
            : Math.max(0, 1 - (progress - 0.2) / 0.6);

          btn.style.transform = `translate(${dx}px,${dy}px) rotate(${body.angle}rad)`;
          btn.style.opacity   = String(opacity.toFixed(3));
        });

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(rafRef.current);
          Matter.Composite.clear(engine.world, false);
          Matter.Engine.clear(engine);
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    });
  };

  // ── Answer handler ───────────────────────────────────────────────────────────

  const handleAnswer = async (genre: GenreId) => {
    if (isTransitioning) return;

    setPickedGenre(genre);
    setIsTransitioning(true);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      await sleep(80);
      doAdvance(genre);
      setPickedGenre(null);
      setEnterKey(k => k + 1);
      setIsTransitioning(false);
      return;
    }

    // 150 ms: selected button emphasis visible
    await sleep(150);

    // Physics fall (750 ms)
    await runPhysics();

    // Fade out question text while buttons finish disappearing
    if (questionWrapRef.current) {
      await gsap.to(questionWrapRef.current, { opacity: 0, duration: 0.18, ease: "power2.in" });
    }

    // Reset button DOM styles
    btnRefs.current.forEach(btn => {
      if (!btn) return;
      btn.style.transform     = "";
      btn.style.opacity       = "1";
      btn.style.pointerEvents = "";
    });

    // Reset questionWrap opacity BEFORE React reconciles — if this is the last
    // question, React reuses this DOM node as the result screen's first <div>,
    // so opacity:0 left by GSAP would make the result content invisible.
    if (questionWrapRef.current) {
      questionWrapRef.current.style.opacity  = "1";
      questionWrapRef.current.style.transform = "";
    }

    // Advance state — React batches these into one render
    doAdvance(genre);
    setPickedGenre(null);
    setEnterKey(k => k + 1); // triggers useEffect fade-in on new question
    setIsTransitioning(false);
  };

  const doAdvance = (genre: GenreId) => {
    setAnswers(prev => {
      const next = [...prev];
      next[current] = genre;
      return next;
    });
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      // Compute winner now using current answers snapshot + this final pick,
      // so the result screen never reads a partially-updated answers array.
      const finalAnswers = answers.map((a, i) => (i === current ? genre : a)).filter(Boolean) as GenreId[];
      setWinner(getWinner(finalAnswers));
      setDone(true);
    }
  };

  const goBack = () => {
    if (current > 0 && !isTransitioning) setCurrent(c => c - 1);
  };

  const reset = () => {
    setDone(false);
    setWinner(null);
    setCurrent(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setPickedGenre(null);
    setIsTransitioning(false);
    setEnterKey(0);
  };

  // ── Result screen ────────────────────────────────────────────────────────────

  if (done && winner) {
    const genre = GENRES[winner];

    return <ResultScreen genre={genre} onReset={reset} isLoggedIn={isLoggedIn} />;
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────

  const q = QUESTIONS[current];

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
      <div ref={questionWrapRef} className="space-y-6">

        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-tag-yellow">
            Question {current + 1} of {QUESTIONS.length}
          </p>
          <div className="flex gap-1">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="h-1 w-5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i <= current ? "#F7D726" : "#8A8578" }}
              />
            ))}
          </div>
        </div>

        {/* Question text */}
        <h3 className="text-lg font-black text-concrete uppercase tracking-tight">{q.text}</h3>

        {/* Answer buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt, i) => {
            // pickedGenre is set during the active transition; fall back to the
            // stored answer so going back highlights the previously chosen option.
            const isSelected = (pickedGenre ?? answers[current]) === opt.genre;
            return (
              <button
                key={opt.genre}
                ref={el => { btnRefs.current[i] = el; }}
                onClick={() => handleAnswer(opt.genre)}
                disabled={isTransitioning}
                aria-pressed={isSelected || undefined}
                className="text-left px-4 py-3 rounded-lg text-sm border"
                style={{
                  backgroundColor: isSelected ? "#FF3B1F"  : "transparent",
                  borderColor:     isSelected ? "#FF3B1F"  : "#8A8578",
                  color:           isSelected ? "#000000"  : "#F2EFE4",
                  fontWeight:      isSelected ? 700        : 400,
                  transform:       isSelected ? "scale(1.04)" : "scale(1)",
                  transformOrigin: "center",
                  transition:      "background-color 0.1s, border-color 0.1s, color 0.1s, transform 0.1s",
                  willChange:      "transform, opacity",
                  cursor:          isTransitioning ? "not-allowed" : "pointer",
                }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Back navigation */}
        <div className="pt-1">
          <button
            onClick={goBack}
            disabled={current === 0 || isTransitioning}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rust-gray hover:text-concrete transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

      </div>
    </div>
  );
}
