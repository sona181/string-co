import TunerClient from "./TunerClient";

export const metadata = { title: "Tuner — String Co." };

// Tuner always uses the red palette — independent of genre theme
const RED = "#FF3B1F";
const BG  = "#0D0D0D";

export default function TunerPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        // Smoky red radial bloom behind the content
        backgroundImage: `radial-gradient(ellipse 70% 55% at 50% 10%, rgba(255,59,31,0.18) 0%, transparent 70%)`,
        ["--theme-bg"            as string]: BG,
        ["--theme-text"          as string]: "#F2EFE4",
        ["--theme-accent"        as string]: RED,
        ["--theme-accent-2"      as string]: "#F7D726",
        ["--theme-card-bg"       as string]: "rgba(255,59,31,0.07)",
        ["--theme-card-text"     as string]: "#F2EFE4",
        ["--theme-panel-subtext" as string]: "#8A8578",
        ["--theme-font-eyebrow"  as string]: "var(--font-wild-sewerage-var), sans-serif",
        ["--theme-font-display"  as string]: "var(--font-riemish-var), sans-serif",
      }}
    >
      <TunerClient />
    </div>
  );
}
