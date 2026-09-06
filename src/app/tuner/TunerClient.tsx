"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import RotatingTitle from "@/components/RotatingTitle";

// ── Instrument presets ──────────────────────────────────────────────────────
// Kept as a plain array so adding new instruments (mandolin, banjo, etc.)
// is just appending another object here — no algorithm changes needed.
type StringDef  = { note: string; frequency: number };
type Instrument = { name: string; strings: StringDef[] };

const INSTRUMENTS: Instrument[] = [
  {
    name: "Guitar",
    strings: [
      { note: "E2", frequency: 82.41  },
      { note: "A2", frequency: 110.00 },
      { note: "D3", frequency: 146.83 },
      { note: "G3", frequency: 196.00 },
      { note: "B3", frequency: 246.94 },
      { note: "E4", frequency: 329.63 },
    ],
  },
  {
    name: "Drop D",
    strings: [
      { note: "D2", frequency: 73.42  },
      { note: "A2", frequency: 110.00 },
      { note: "D3", frequency: 146.83 },
      { note: "G3", frequency: 196.00 },
      { note: "B3", frequency: 246.94 },
      { note: "E4", frequency: 329.63 },
    ],
  },
  {
    name: "Bass",
    strings: [
      { note: "E1", frequency: 41.20  },
      { note: "A1", frequency: 55.00  },
      { note: "D2", frequency: 73.42  },
      { note: "G2", frequency: 98.00  },
    ],
  },
  {
    name: "Violin",
    strings: [
      { note: "G3", frequency: 196.00 },
      { note: "D4", frequency: 293.66 },
      { note: "A4", frequency: 440.00 },
      { note: "E5", frequency: 659.25 },
    ],
  },
  {
    name: "Ukulele",
    strings: [
      { note: "G4", frequency: 392.00 },
      { note: "C4", frequency: 261.63 },
      { note: "E4", frequency: 329.63 },
      { note: "A4", frequency: 440.00 },
    ],
  },
];

// ── Pitch detection — autocorrelation with parabolic interpolation ───────────
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function detectPitch(buf: Float32Array, sampleRate: number): number {
  // RMS energy check — skip silence
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / buf.length) < 0.015) return -1;

  const HALF    = Math.floor(buf.length / 2);
  // Lag range: 40 Hz (low bass) to 1200 Hz (high strings)
  const minLag  = Math.floor(sampleRate / 1200);
  const maxLag  = Math.min(Math.ceil(sampleRate / 40), HALF);

  // Build autocorrelation values for each lag in range
  const corr = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i < HALF; i++) c += buf[i] * buf[i + lag];
    corr[lag] = c;
  }

  // Skip the initial downslope (lag-0 peak is always largest — skip it)
  let d = minLag;
  while (d < maxLag - 1 && corr[d] > corr[d + 1]) d++;

  // Find the highest peak after that dip
  let bestVal = -Infinity, bestLag = -1;
  for (let i = d; i <= maxLag; i++) {
    if (corr[i] > bestVal) { bestVal = corr[i]; bestLag = i; }
  }
  if (bestLag <= minLag || bestLag >= maxLag) return -1;

  // Parabolic interpolation for sub-sample frequency accuracy
  const y1 = corr[bestLag - 1], y2 = corr[bestLag], y3 = corr[bestLag + 1];
  const a  = (y1 + y3 - 2 * y2) / 2;
  const b  = (y3 - y1) / 2;
  const shift = a !== 0 ? -b / (2 * a) : 0;

  return sampleRate / (bestLag + shift);
}

function freqToNote(freq: number): { name: string; octave: number; cents: number } {
  const semitones = 12 * Math.log2(freq / 440);
  const midi      = Math.round(semitones) + 69;
  const cents     = Math.round((semitones - (midi - 69)) * 100);
  return {
    name:   NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    cents,
  };
}

function closestStringIdx(freq: number, strings: StringDef[]): number {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < strings.length; i++) {
    const dist = Math.abs(Math.log2(freq / strings[i].frequency));
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

// ── Component ───────────────────────────────────────────────────────────────
type TunerState = "idle" | "running" | "denied" | "unsupported";

// Needle SVG geometry constants
const CX = 120, CY = 110, R = 90; // arc center + radius
const NEEDLE_LEN = 80;
const MAX_CENTS_ANGLE = 60; // degrees at ±50 cents

function centsToAngle(cents: number) {
  return Math.max(-MAX_CENTS_ANGLE, Math.min(MAX_CENTS_ANGLE, cents * (MAX_CENTS_ANGLE / 50)));
}

// Compute needle endpoint from an angle (degrees from 12 o'clock, clockwise +)
function needlePoint(angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180); // offset so 0° = straight up
  return {
    x: CX + NEEDLE_LEN * Math.cos(rad),
    y: CY + NEEDLE_LEN * Math.sin(rad),
  };
}

// Arc path for the meter background (−60° to +60° from top, as SVG arc)
function arcPath(startDeg: number, endDeg: number, r: number) {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const sx = CX + r * Math.cos(toRad(startDeg));
  const sy = CY + r * Math.sin(toRad(startDeg));
  const ex = CX + r * Math.cos(toRad(endDeg));
  const ey = CY + r * Math.sin(toRad(endDeg));
  return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
}

export default function TunerClient() {
  const [tunerState, setTunerState] = useState<TunerState>("idle");
  const [instrumentIdx, setInstrumentIdx] = useState(0);

  // Ref mirrors so the RAF loop reads fresh values without re-creating
  const currentInstrumentRef = useRef(INSTRUMENTS[0]);

  // DOM refs for direct RAF updates (avoids re-renders at 60 fps)
  const noteNameRef         = useRef<HTMLDivElement>(null);
  const centsTextRef        = useRef<HTMLParagraphElement>(null);
  const needleRef           = useRef<SVGLineElement>(null);
  const arcInTuneRef        = useRef<SVGPathElement>(null);
  const stringButtonsRef    = useRef<(HTMLButtonElement | null)[]>([]);
  const prevClosestRef      = useRef(-1);

  // Web Audio refs
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const rafRef       = useRef<number | null>(null);
  const sampleBufRef = useRef<Float32Array | null>(null);

  // ── RAF detection loop ───────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      const buf      = sampleBufRef.current;
      const ctx      = audioCtxRef.current;
      if (!analyser || !buf || !ctx) return;

      analyser.getFloatTimeDomainData(buf);
      const freq = detectPitch(buf, ctx.sampleRate);
      const instrument = currentInstrumentRef.current;

      if (freq > 0 && freq < 5000) {
        const { name, octave, cents } = freqToNote(freq);
        const inTune = Math.abs(cents) <= 5;
        const accentColor  = "var(--theme-accent)";
        const subtextColor = "var(--theme-panel-subtext,#888)";
        const color = inTune ? accentColor : subtextColor;

        if (noteNameRef.current) {
          noteNameRef.current.textContent = `${name}${octave}`;
          noteNameRef.current.style.color = color;
        }
        if (centsTextRef.current) {
          centsTextRef.current.textContent = inTune
            ? "In tune ✓"
            : `${cents > 0 ? "+" : ""}${cents} cents`;
          centsTextRef.current.style.color = color;
        }

        // Move needle
        const angle = centsToAngle(cents);
        const pt = needlePoint(angle);
        if (needleRef.current) {
          needleRef.current.setAttribute("x2", String(pt.x));
          needleRef.current.setAttribute("y2", String(pt.y));
          needleRef.current.style.stroke = color;
        }

        // In-tune arc glow (small green arc segment near center)
        if (arcInTuneRef.current) {
          arcInTuneRef.current.style.opacity = inTune ? "1" : "0";
        }

        // Highlight closest string
        const ci = closestStringIdx(freq, instrument.strings);
        if (ci !== prevClosestRef.current) {
          const prev = prevClosestRef.current;
          if (prev >= 0 && stringButtonsRef.current[prev]) {
            stringButtonsRef.current[prev]!.style.outline = "";
            stringButtonsRef.current[prev]!.style.fontWeight = "700";
          }
          if (stringButtonsRef.current[ci]) {
            stringButtonsRef.current[ci]!.style.outline = "2px solid var(--theme-accent)";
            stringButtonsRef.current[ci]!.style.fontWeight = "900";
          }
          prevClosestRef.current = ci;
        }
      } else {
        // No signal — reset display to idle
        if (noteNameRef.current) {
          noteNameRef.current.textContent = "—";
          noteNameRef.current.style.color = "var(--theme-panel-subtext,#888)";
        }
        if (centsTextRef.current) {
          centsTextRef.current.textContent = "";
        }
        const idle = needlePoint(0);
        if (needleRef.current) {
          needleRef.current.setAttribute("x2", String(idle.x));
          needleRef.current.setAttribute("y2", String(idle.y));
          needleRef.current.style.stroke = "var(--theme-panel-subtext,#888)";
        }
        if (arcInTuneRef.current) arcInTuneRef.current.style.opacity = "0";
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current    = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current  = null;
    analyserRef.current  = null;
    sampleBufRef.current = null;
    prevClosestRef.current = -1;
    stringButtonsRef.current.forEach(b => {
      if (b) { b.style.outline = ""; b.style.fontWeight = "700"; }
    });
  }, []);

  const handleStart = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setTunerState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source  = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // larger buffer → better low-frequency resolution (bass guitar)
      source.connect(analyser);
      analyserRef.current  = analyser;
      sampleBufRef.current = new Float32Array(analyser.fftSize);

      setTunerState("running");
      startLoop();
    } catch (e) {
      const name = (e as Error).name;
      setTunerState(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "denied"
          : "unsupported",
      );
    }
  }, [startLoop]);

  const handleStop = useCallback(() => {
    stopAll();
    setTunerState("idle");
  }, [stopAll]);

  // Clean up on unmount
  useEffect(() => () => stopAll(), [stopAll]);

  // Sync currentInstrumentRef when the instrument tab changes
  useEffect(() => {
    currentInstrumentRef.current = INSTRUMENTS[instrumentIdx];
    prevClosestRef.current = -1;
    // Reset all string button highlights
    stringButtonsRef.current.forEach(b => {
      if (b) { b.style.outline = ""; b.style.fontWeight = "700"; }
    });
    // Reset string button array length to match new instrument
    stringButtonsRef.current = Array(INSTRUMENTS[instrumentIdx].strings.length).fill(null);
  }, [instrumentIdx]);

  const instrument = INSTRUMENTS[instrumentIdx];

  // Idle needle endpoint (straight up)
  const idlePt = needlePoint(0);

  // ── CSS custom props used throughout ────────────────────────────────────
  const accent  = "var(--theme-accent)";
  const subtext = "var(--theme-panel-subtext,#888)";
  const cardBg  = "var(--theme-card-bg,rgba(255,255,255,0.06))";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px 48px",
      minHeight: "100vh",
    }}>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        marginBottom: 24,
        // drop-shadow applies to the canvas pixels directly (transparent bg),
        // giving a solid black undercolor that makes the red text pop
        filter: "drop-shadow(0px 3px 0px #000) drop-shadow(0px 1px 6px rgba(0,0,0,0.85))",
      }}>
        <RotatingTitle
          text="Tuner"
          color="#FF3B1F"
          fontSize="clamp(2.8rem, 11vw, 5.5rem)"
          canvasHeight="clamp(4rem, 14vw, 7.5rem)"
          strokeColor="#000000"
          strokeWidth={1.5}
        />
      </div>

      {/* ── Instrument selector ───────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
        maxWidth: 480,
        width: "100%",
        marginBottom: 24,
      }}>
        {INSTRUMENTS.map((inst, i) => {
          const active = i === instrumentIdx;
          return (
            <button
              key={inst.name}
              onClick={() => setInstrumentIdx(i)}
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "transparent" : accent}`,
                background: active ? accent : "transparent",
                color: active ? "#fff" : accent,
                fontWeight: 800,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {inst.name}
            </button>
          );
        })}
      </div>

      {/* ── Main tuner card ──────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: cardBg,
        border: `1.5px solid rgba(255,59,31,0.45)`,
        borderRadius: 20,
        padding: 24,
        boxShadow: `0 0 40px rgba(255,59,31,0.18), 0 0 90px rgba(255,59,31,0.09), inset 0 0 30px rgba(255,59,31,0.05)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        boxSizing: "border-box",
      }}>

        {/* Note name — huge, dominant */}
        <div
          ref={noteNameRef}
          style={{
            fontSize: "clamp(3rem, 12vw, 5rem)",
            fontWeight: 900,
            color: subtext,
            fontFamily: "var(--theme-font-display,sans-serif)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            transition: "color 0.25s ease",
            minHeight: "1em",
            userSelect: "none",
          }}
        >
          —
        </div>

        {/* ── Needle / meter ────────────────────────────────────────────── */}
        <svg
          width="240"
          height="130"
          viewBox="0 0 240 130"
          style={{ overflow: "visible", width: "100%", maxWidth: 230 }}
          aria-hidden
        >
          {/* Arc background track */}
          <path
            d={arcPath(-MAX_CENTS_ANGLE, MAX_CENTS_ANGLE, R)}
            fill="none"
            stroke={subtext}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.25}
          />

          {/* In-tune highlight arc (center ±5° band) — fades in when in tune */}
          <path
            ref={arcInTuneRef}
            d={arcPath(-6, 6, R)}
            fill="none"
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            style={{ opacity: 0, transition: "opacity 0.2s ease" }}
          />

          {/* Tick marks: left edge, center, right edge */}
          {[-MAX_CENTS_ANGLE, 0, MAX_CENTS_ANGLE].map(deg => {
            const inner = 82, outer = 96;
            const rad = (deg - 90) * (Math.PI / 180);
            return (
              <line
                key={deg}
                x1={CX + inner * Math.cos(rad)} y1={CY + inner * Math.sin(rad)}
                x2={CX + outer * Math.cos(rad)} y2={CY + outer * Math.sin(rad)}
                stroke={subtext}
                strokeWidth={deg === 0 ? 2 : 1.5}
                opacity={deg === 0 ? 0.7 : 0.4}
              />
            );
          })}

          {/* Flat / Sharp labels */}
          <text x={18} y={CY + 18} fontSize={10} fontWeight={700} fill={subtext} opacity={0.5} textAnchor="middle">♭</text>
          <text x={222} y={CY + 18} fontSize={10} fontWeight={700} fill={subtext} opacity={0.5} textAnchor="middle">♯</text>

          {/* Needle */}
          <line
            ref={needleRef}
            x1={CX} y1={CY}
            x2={idlePt.x} y2={idlePt.y}
            stroke={subtext}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: "stroke 0.25s ease" }}
          />

          {/* Pivot dot */}
          <circle cx={CX} cy={CY} r={5} fill={accent} />
        </svg>

        {/* Cents readout */}
        <p
          ref={centsTextRef}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: subtext,
            margin: "-8px 0 0",
            letterSpacing: "0.06em",
            minHeight: "1.4em",
            textAlign: "center",
            transition: "color 0.25s ease",
          }}
        />
      </div>

      {/* ── String target row ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 24,
        justifyContent: "center",
        maxWidth: 480,
        width: "100%",
        flexWrap: "wrap",
      }}>
        {instrument.strings.map((s, i) => (
          <button
            key={`${instrumentIdx}-${i}`}
            ref={el => { stringButtonsRef.current[i] = el; }}
            title={`${s.note} — ${s.frequency.toFixed(2)} Hz`}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `1.5px solid rgba(255,59,31,0.5)`,
              background: "transparent",
              color: accent,
              fontWeight: 700,
              fontSize: 12,
              cursor: "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "outline 0.15s ease, box-shadow 0.15s ease",
              outlineOffset: 2,
              boxShadow: `0 0 8px rgba(255,59,31,0.12)`,
            }}
          >
            {/* Show letter only (no octave number) in the circle */}
            {s.note.replace(/\d+/, "")}
          </button>
        ))}
      </div>

      {/* ── Start / Stop button ───────────────────────────────────────────── */}
      <button
        onClick={tunerState === "running" ? handleStop : handleStart}
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 480,
          height: 48,
          borderRadius: 999,
          border: "none",
          background: tunerState === "running" ? subtext : accent,
          color: "#fff",
          fontWeight: 900,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          cursor: "pointer",
          transition: "background 0.2s ease, opacity 0.15s ease, box-shadow 0.2s ease",
          boxShadow: tunerState === "running"
            ? "none"
            : `0 0 24px rgba(255,59,31,0.5), 0 0 60px rgba(255,59,31,0.25)`,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {tunerState === "running" ? "Stop" : "Start tuning"}
      </button>

      {/* ── Permission / browser error messages ──────────────────────────── */}
      {tunerState === "denied" && (
        <div style={{ marginTop: 20, maxWidth: 480, textAlign: "center" }}>
          <p style={{ fontWeight: 800, color: accent, fontSize: 14, marginBottom: 4 }}>
            Microphone access denied
          </p>
          <p style={{ fontSize: 13, color: subtext, lineHeight: 1.6 }}>
            Allow microphone access in your browser settings, then press{" "}
            <strong>Start tuning</strong> again.
          </p>
        </div>
      )}

      {tunerState === "unsupported" && (
        <div style={{ marginTop: 20, maxWidth: 480, textAlign: "center" }}>
          <p style={{ fontWeight: 800, color: accent, fontSize: 14, marginBottom: 4 }}>
            Microphone not available
          </p>
          <p style={{ fontSize: 13, color: subtext, lineHeight: 1.6 }}>
            Your browser or context doesn't support microphone access. Use a modern
            browser over HTTPS.
          </p>
        </div>
      )}

    </div>
  );
}
