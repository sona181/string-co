import Link from "next/link";
import { auth } from "@/lib/auth";
import RotatingTitle from "@/components/RotatingTitle";
import GenreQuiz from "@/components/GenreQuiz";
import Ferrofluid from "@/components/Ferrofluid";
import FadeUp from "@/components/FadeUp";
import GlitchReveal from "@/components/GlitchReveal";
import GlitchLoop from "@/components/GlitchLoop";
import WarpText from "@/components/WarpText";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col">

      {/* ── Hero wrapper with Ferrofluid background ──────────────────────────── */}
      <div style={{ position: "relative" }}>

        {/* Ferrofluid background — sits behind both hero sections */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <Ferrofluid
            colors={["#F2EFE4", "#FF3B1F", "#F7D726", "#00C2A8"]}
            speed={0.35}
            scale={1.6}
            turbulence={0.8}
            fluidity={0.15}
            rimWidth={0.16}
            sharpness={3}
            shimmer={1}
            glow={1.5}
            flowDirection="down"
            opacity={0.7}
            mouseInteraction={true}
            mouseStrength={0.7}
            mouseRadius={0.3}
            mouseDampening={0.15}
          />
        </div>

        {/* ── Hero: full-screen title ─────────────────────────────────────────── */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
          <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24">
            <RotatingTitle text="String Co." color="#F2EFE4" />
          </div>
        </section>

        {/* ── Hero: content below ─────────────────────────────────────────────── */}
        <section className="w-full" style={{ position: "relative", zIndex: 1, background: "transparent" }}>
          <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24 py-16">

            <FadeUp delay={0}>
              <p className="mb-6 text-xs font-black uppercase tracking-[0.3em]" style={{ color: "#00C2A8" }}>
                The shop for players
              </p>
            </FadeUp>

            <FadeUp delay={0.08}>
              <div className="max-w-2xl">
                <p style={{ fontFamily: "monospace", fontSize: "clamp(1.4rem, 2.8vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, color: "#F2EFE4" }}>
                  Music gives a soul to the universe, wings to the mind, flight to the imagination, and life to everything.
                </p>
                <p className="mt-2" style={{ fontFamily: "monospace", fontSize: "clamp(1.1rem, 2.2vw, 1.7rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#FF3B1F" }}>
                  — Plato
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.16}>
              <p className="mt-6 text-concrete text-base max-w-lg leading-relaxed">
                Guitars, basses, and gear for whatever you&apos;re building.
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-spray-red text-black font-black text-sm px-7 py-3.5 rounded-xl uppercase tracking-wide hover:brightness-110 transition-all"
                >
                  Shop  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeUp>

          </div>
        </section>

        {/* ── Company history — inside hero wrapper so Ferrofluid continues ── */}
        <section id="about" style={{ position: "relative", zIndex: 1, background: "transparent" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-32 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <GlitchReveal delay={0}>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-spray-red mb-4">Est. 2024</p>
              </GlitchReveal>
              <GlitchLoop delay={0.08}>
                <h2 className="text-3xl font-black uppercase tracking-tight text-concrete leading-tight mb-6">
                  Built for players,<br />not browsers.
                </h2>
              </GlitchLoop>
            </div>
            <GlitchReveal delay={0.16} duration={0.75} fromX={180}>
              <p className="text-rust-gray text-base leading-relaxed">
                String Co. started in a back room with one idea: gear that fits the
                way real musicians think. No bloated catalogs, no fake stars, no
                corporate upsell. Just instruments you can customize before you buy,
                loyalty rewards that actually matter, and a shop that treats you like
                you know what you&apos;re doing — because you do.
              </p>
            </GlitchReveal>
          </div>
        </section>

      </div>{/* ── end hero wrapper ── */}

      {/* ── Genre quiz ────────────────────────────────────────────────────────── */}
      <section className="bg-asphalt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 flex flex-col md:flex-row gap-16 items-center">

          {/* Left: quiz */}
          <div className="w-full md:w-1/2">
            <GenreQuiz isLoggedIn={isLoggedIn} />
          </div>

          {/* Right: text */}
          <div className="w-full md:w-1/2 md:pl-16">
            <GlitchReveal delay={0}>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-rust-gray mb-4">60-second quiz</p>
            </GlitchReveal>
            <GlitchLoop delay={0.08} className="w-full mb-2">
              <WarpText
                text="Find your sound"
                color="#F2EFE4"
                fontFamily="var(--font-geist-sans)"
                fontSize="clamp(1.8rem, 3.5vw, 3.2rem)"
                fontWeight={900}
                letterSpacing="-0.03em"
                warpStrength={0.28}
                warpScale={2.2}
                speed={1.2}
                pointerInfluence={0.6}
                pointerStrength={0.9}
                refraction={0.05}
                ripple
                style={{ height: "clamp(3.5rem, 7vw, 6.5rem)", minHeight: 0 }}
              />
            </GlitchLoop>
            <GlitchReveal delay={0.16} duration={0.6}>
              <p className="text-rust-gray text-base leading-relaxed">Six questions. We&apos;ll tell you where you belong.</p>
            </GlitchReveal>
          </div>

        </div>
      </section>

      {/* ── Why String Co. — inside hero wrapper so Ferrofluid mesh continues ── */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <Ferrofluid
            colors={["#F2EFE4", "#FF3B1F", "#F7D726", "#00C2A8"]}
            speed={0.35} scale={1.6} turbulence={0.8} fluidity={0.15}
            rimWidth={0.16} sharpness={3} shimmer={1} glow={1.5}
            flowDirection="down" opacity={0.7} mouseInteraction={true}
            mouseStrength={0.7} mouseRadius={0.3} mouseDampening={0.15}
          />
        </div>
        <section style={{ position: "relative", zIndex: 1, background: "transparent" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-32">
            <FadeUp delay={0}>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-spray-red mb-5 text-center">Why string co.</p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h2 className="text-5xl font-black uppercase tracking-tight text-concrete text-center mb-24">
                The difference
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
              {[
                {
                  label: "01",
                  title: "Visual customizer",
                  body: "Pick your color, pickguard, and hardware. See the exact instrument you'll receive before you spend a dollar.",
                  delay: 0.1,
                },
                {
                  label: "02",
                  title: "Loyalty rewards",
                  body: "Every order earns points. Bronze, Silver, Gold — real discounts that scale with how much you play and buy.",
                  delay: 0.18,
                },
                {
                  label: "03",
                  title: "Verified reviews only",
                  body: "Reviews come from customers who bought. No bots, no paid placements, no inflated stars.",
                  delay: 0.26,
                },
              ].map((f) => (
                <FadeUp key={f.label} delay={f.delay}>
                  <div className="flex gap-8 items-start">
                    <span className="font-black text-spray-red shrink-0 leading-none" style={{ fontSize: "clamp(4rem, 7vw, 6rem)", opacity: 0.9 }}>
                      {f.label}
                    </span>
                    <div className="pt-3">
                      <h3 className="text-xl font-black uppercase tracking-tight text-concrete mb-5">{f.title}</h3>
                      <p className="text-base text-rust-gray leading-loose">{f.body}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Account CTA ───────────────────────────────────────────────────────── */}
      {!isLoggedIn && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <Ferrofluid
              colors={["#F2EFE4", "#FF3B1F", "#F7D726", "#00C2A8"]}
              speed={0.35} scale={1.6} turbulence={0.8} fluidity={0.15}
              rimWidth={0.16} sharpness={3} shimmer={1} glow={1.5}
              flowDirection="down" opacity={0.7} mouseInteraction={true}
              mouseStrength={0.7} mouseRadius={0.3} mouseDampening={0.15}
            />
          </div>
          <section style={{ position: "relative", zIndex: 1, background: "transparent" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-36 text-center">
              <FadeUp delay={0}>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-spray-red mb-6">Free to join</p>
              </FadeUp>
              <FadeUp delay={0.08}>
                <h2 className="text-5xl font-black uppercase tracking-tight text-concrete mb-8 leading-tight">
                  Your account.<br />Your history.
                </h2>
              </FadeUp>
              <FadeUp delay={0.16}>
                <p className="text-rust-gray text-lg mb-14 max-w-md mx-auto leading-loose">
                  Save builds, track orders, earn rewards, and pick up exactly where
                  you left off — on any device.
                </p>
              </FadeUp>
              <FadeUp delay={0.24}>
                <div className="flex flex-wrap justify-center gap-5">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-3 bg-spray-red text-black font-black text-base px-10 py-4 rounded-xl uppercase tracking-wide hover:brightness-110 transition-all"
                  >
                    Create free account <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-3 border border-rust-gray text-concrete text-base font-bold px-10 py-4 rounded-xl hover:border-concrete transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </FadeUp>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
