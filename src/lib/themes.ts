export type CardPalette = {
  bg: string;
  text: string;
  subtext: string;
  eyebrow: string;
  divider: string;
  border: string;
  borderWidth?: string;
  boxShadow?: string;
  glitchA: string;
  glitchB: string;
};

export type TitleAnimation = "glitch" | "echo" | "splitflap" | "fuzzy" | "pressure" | "curvedLoop" | "splitText";

export type Theme = {
  background: string;
  text: string;
  accent: string;
  accentSecondary: string;
  cardBackground: string;
  cardText: string;
  panelSubtext: string;
  glitchShadowA: string;
  glitchShadowB: string;
  fontEyebrow: string;
  fontDisplay: string;
  fontSignature: string;
  titleAnimation: TitleAnimation;
  cardPalettes: CardPalette[];
};

const defaultTheme: Theme = {
  background: "#0D0D0D",
  text: "#F2EFE4",
  accent: "#FF3B1F",
  accentSecondary: "#F7D726",
  cardBackground: "#F2EFE4",
  cardText: "#0D0D0D",
  panelSubtext: "#8A8578",
  glitchShadowA: "#FF3B1F",
  glitchShadowB: "#00C2A8",
  fontEyebrow: "var(--font-wild-sewerage-var), sans-serif",
  fontDisplay: "var(--font-riemish-var), sans-serif",
  fontSignature: "var(--font-zombiewolf-var), sans-serif",
  titleAnimation: "glitch",
  cardPalettes: [
    { bg: "#F2EFE4", text: "#0D0D0D", subtext: "#8A8578", eyebrow: "#FF3B1F", divider: "#F7D726", border: "#FF3B1F", glitchA: "#FF3B1F", glitchB: "#00C2A8" },
  ],
};

export const THEMES: Record<string, Theme> = {
  "Hip-Hop": {
    background: "#0D0D0D",
    text: "#F2EFE4",
    accent: "#FF3B1F",
    accentSecondary: "#F7D726",
    cardBackground: "#F2EFE4",
    cardText: "#0D0D0D",
    panelSubtext: "#8A8578",
    glitchShadowA: "#FF3B1F",
    glitchShadowB: "#00C2A8",
    fontEyebrow: "var(--font-wild-sewerage-var), sans-serif",
    fontDisplay: "var(--font-riemish-var), sans-serif",
    fontSignature: "var(--font-zombiewolf-var), sans-serif",
    titleAnimation: "glitch",
    cardPalettes: [
      { bg: "#0D0D0D", text: "#F2EFE4", subtext: "#9A9590", eyebrow: "#FF3B1F", divider: "#F7D726", border: "#FF3B1F", glitchA: "#FF3B1F", glitchB: "#00C2A8" },
      { bg: "#F2EFE4", text: "#0D0D0D", subtext: "#8A8578", eyebrow: "#FF3B1F", divider: "#F7D726", border: "#FF3B1F", glitchA: "#FF3B1F", glitchB: "#00C2A8" },
      { bg: "#FF3B1F", text: "#F2EFE4", subtext: "rgba(242,239,228,0.72)", eyebrow: "#F7D726", divider: "#F7D726", border: "#F7D726", glitchA: "#F7D726", glitchB: "#F2EFE4" },
      { bg: "#F7D726", text: "#0D0D0D", subtext: "#5a4800", eyebrow: "#FF3B1F", divider: "#FF3B1F", border: "#FF3B1F", glitchA: "#FF3B1F", glitchB: "#0D0D0D" },
      { bg: "#00C2A8", text: "#F2EFE4", subtext: "rgba(242,239,228,0.75)", eyebrow: "#F7D726", divider: "#F7D726", border: "#0D0D0D", glitchA: "#F7D726", glitchB: "#F2EFE4" },
    ],
  },
  "Classical": {
    background: "#4A2E1E",
    text: "#2B2B2B",
    accent: "#6B1F2A",
    accentSecondary: "#C9A227",
    cardBackground: "#FAF7F0",
    cardText: "#2B2B2B",
    panelSubtext: "#7A7068",
    glitchShadowA: "#6B1F2A",
    glitchShadowB: "#C9A227",
    fontEyebrow: "var(--font-classical-1), serif",
    fontDisplay: "var(--font-classical-1), serif",
    fontSignature: "var(--font-classical-2), serif",
    titleAnimation: "echo",
    cardPalettes: [
      // Ivory — light, the default refined look
      { bg: "#FAF7F0", text: "#2B2B2B", subtext: "#7A7068", eyebrow: "#6B1F2A", divider: "#C9A227", border: "#4A2E1E", borderWidth: "1px", glitchA: "#6B1F2A", glitchB: "#C9A227" },
      // Charcoal — deep dark, gold accents
      { bg: "#2B2B2B", text: "#FAF7F0", subtext: "rgba(250,247,240,0.6)", eyebrow: "#C9A227", divider: "#C9A227", border: "#C9A227", borderWidth: "1px", glitchA: "#C9A227", glitchB: "#FAF7F0" },
      // Burgundy — rich, dramatic
      { bg: "#6B1F2A", text: "#FAF7F0", subtext: "rgba(250,247,240,0.65)", eyebrow: "#C9A227", divider: "#C9A227", border: "#C9A227", borderWidth: "1px", glitchA: "#C9A227", glitchB: "#FAF7F0" },
      // Gold leaf — opulent warm
      { bg: "#C9A227", text: "#2B2B2B", subtext: "#4A2E1E", eyebrow: "#6B1F2A", divider: "#4A2E1E", border: "#6B1F2A", borderWidth: "1px", glitchA: "#6B1F2A", glitchB: "#4A2E1E" },
      // Walnut — earthy dark brown
      { bg: "#4A2E1E", text: "#FAF7F0", subtext: "rgba(250,247,240,0.6)", eyebrow: "#C9A227", divider: "#C9A227", border: "#C9A227", borderWidth: "1px", glitchA: "#C9A227", glitchB: "#FAF7F0" },
    ],
  },
  "Jazz": {
    background: "#5C1A2B",
    text: "#EDE4D3",
    accent: "#1B2A4A",
    accentSecondary: "#D98E2B",
    cardBackground: "#211E1B",
    cardText: "#EDE4D3",
    panelSubtext: "#9A8870",
    glitchShadowA: "#D98E2B",
    glitchShadowB: "#1B2A4A",
    fontEyebrow: "var(--font-jazz-1), serif",
    fontDisplay: "var(--font-jazz-1), serif",
    fontSignature: "var(--font-jazz-1), serif",
    titleAnimation: "splitflap",
    cardPalettes: [
      // Smoke black — dim, smoky, default feel
      { bg: "#1A1714", text: "#EDE4D3", subtext: "rgba(237,228,211,0.55)", eyebrow: "#D98E2B", divider: "#D98E2B", border: "#5C1A2B", borderWidth: "1px", glitchA: "#D98E2B", glitchB: "#1B2A4A" },
      // Midnight blue — cool dark, brass warmth
      { bg: "#1B2A4A", text: "#EDE4D3", subtext: "rgba(237,228,211,0.55)", eyebrow: "#D98E2B", divider: "#D98E2B", border: "#5C1A2B", borderWidth: "1px", glitchA: "#D98E2B", glitchB: "#EDE4D3" },
      // Brass gold — opulent warm
      { bg: "#D98E2B", text: "#1A1714", subtext: "rgba(26,23,20,0.65)", eyebrow: "#EDE4D3", divider: "#5C1A2B", border: "#1B2A4A", borderWidth: "1px", glitchA: "#1B2A4A", glitchB: "#5C1A2B" },
      // Wine — dark red warmth
      { bg: "#5C1A2B", text: "#EDE4D3", subtext: "rgba(237,228,211,0.55)", eyebrow: "#D98E2B", divider: "#D98E2B", border: "#1B2A4A", borderWidth: "1px", glitchA: "#D98E2B", glitchB: "#EDE4D3" },
      // Cream — rare daylight warmth in the room
      { bg: "#EDE4D3", text: "#1A1714", subtext: "rgba(26,23,20,0.5)", eyebrow: "#D98E2B", divider: "#D98E2B", border: "#5C1A2B", borderWidth: "1px", glitchA: "#5C1A2B", glitchB: "#1B2A4A" },
    ],
  },
  "Rock/Metal": {
    background: "#9FEF00",
    text: "#EDEDED",
    accent: "#A11D1D",
    accentSecondary: "#9FEF00",
    cardBackground: "#0A0A0A",
    cardText: "#EDEDED",
    panelSubtext: "#6E6E6E",
    glitchShadowA: "#A11D1D",
    glitchShadowB: "#9FEF00",
    fontEyebrow: "var(--font-rock-metal-1), sans-serif",
    fontDisplay: "var(--font-rock-metal-1), sans-serif",
    fontSignature: "var(--font-rock-metal-1), sans-serif",
    titleAnimation: "fuzzy",
    cardPalettes: [
      // Void black — flat industrial dark
      { bg: "#0A0A0A", text: "#EDEDED", subtext: "#6E6E6E", eyebrow: "#A11D1D", divider: "#A11D1D", border: "#6E6E6E", borderWidth: "2px", glitchA: "#A11D1D", glitchB: "#9FEF00" },
      // Bone white — stark light, confrontational
      { bg: "#EDEDED", text: "#0A0A0A", subtext: "#6E6E6E", eyebrow: "#A11D1D", divider: "#A11D1D", border: "#6E6E6E", borderWidth: "2px", glitchA: "#A11D1D", glitchB: "#9FEF00" },
      // Blood red — aggressive, saturated
      { bg: "#A11D1D", text: "#EDEDED", subtext: "rgba(237,237,237,0.6)", eyebrow: "#9FEF00", divider: "#9FEF00", border: "#0A0A0A", borderWidth: "2px", glitchA: "#9FEF00", glitchB: "#EDEDED" },
      // Steel gray — industrial mid-tone
      { bg: "#6E6E6E", text: "#0A0A0A", subtext: "rgba(10,10,10,0.55)", eyebrow: "#A11D1D", divider: "#A11D1D", border: "#0A0A0A", borderWidth: "2px", glitchA: "#A11D1D", glitchB: "#9FEF00" },
      // Acid green — electric hit, occasional shock
      { bg: "#9FEF00", text: "#0A0A0A", subtext: "rgba(10,10,10,0.55)", eyebrow: "#A11D1D", divider: "#A11D1D", border: "#0A0A0A", borderWidth: "2px", glitchA: "#A11D1D", glitchB: "#0A0A0A" },
    ],
  },
  "EDM": {
    background: "#0B0B2E",
    text: "#F5F5F5",
    accent: "#00E5FF",
    accentSecondary: "#FF2ED1",
    cardBackground: "#0B0B2E",
    cardText: "#F5F5F5",
    panelSubtext: "rgba(245,245,245,0.5)",
    glitchShadowA: "#00E5FF",
    glitchShadowB: "#FF2ED1",
    fontEyebrow: "var(--font-edm-1), sans-serif",
    fontDisplay: "var(--font-edm-1), sans-serif",
    fontSignature: "var(--font-edm-1), sans-serif",
    titleAnimation: "pressure",
    cardPalettes: [
      // Void navy — main dark base, cyan border glow
      { bg: "linear-gradient(160deg,#0B0B2E,#14103A)", text: "#F5F5F5", subtext: "rgba(245,245,245,0.5)", eyebrow: "#00E5FF", divider: "#7B2FF7", border: "#00E5FF", borderWidth: "1px", boxShadow: "0 0 18px rgba(0,229,255,0.35),0 24px 64px rgba(0,0,0,0.6)", glitchA: "#00E5FF", glitchB: "#FF2ED1" },
      // Electric purple — purple depth, magenta border glow
      { bg: "linear-gradient(160deg,#7B2FF7,#5C1FCC)", text: "#F5F5F5", subtext: "rgba(245,245,245,0.55)", eyebrow: "#00E5FF", divider: "#FF2ED1", border: "#FF2ED1", borderWidth: "1px", boxShadow: "0 0 18px rgba(255,46,209,0.35),0 24px 64px rgba(0,0,0,0.55)", glitchA: "#00E5FF", glitchB: "#FF2ED1" },
      // Neon cyan — bright saturated, dark text
      { bg: "#00E5FF", text: "#0B0B2E", subtext: "rgba(11,11,46,0.65)", eyebrow: "#0B0B2E", divider: "#7B2FF7", border: "#0B0B2E", borderWidth: "1px", boxShadow: "0 0 24px rgba(0,229,255,0.55),0 24px 64px rgba(0,0,0,0.4)", glitchA: "#0B0B2E", glitchB: "#7B2FF7" },
      // Neon magenta — hot pink, dark text
      { bg: "#FF2ED1", text: "#0B0B2E", subtext: "rgba(11,11,46,0.65)", eyebrow: "#0B0B2E", divider: "#7B2FF7", border: "#0B0B2E", borderWidth: "1px", boxShadow: "0 0 24px rgba(255,46,209,0.55),0 24px 64px rgba(0,0,0,0.4)", glitchA: "#0B0B2E", glitchB: "#7B2FF7" },
      // Deep midnight — slightly warmer navy, magenta accent
      { bg: "linear-gradient(160deg,#0F0B30,#0B0B2E)", text: "#F5F5F5", subtext: "rgba(245,245,245,0.5)", eyebrow: "#FF2ED1", divider: "#00E5FF", border: "#7B2FF7", borderWidth: "1px", boxShadow: "0 0 18px rgba(123,47,247,0.35),0 24px 64px rgba(0,0,0,0.6)", glitchA: "#FF2ED1", glitchB: "#00E5FF" },
    ],
  },
  "Folk": {
    background: "#F3E9D2",
    text: "#3B5A73",
    accent: "#B5502C",
    accentSecondary: "#E8C77E",
    cardBackground: "#F3E9D2",
    cardText: "#3B5A73",
    panelSubtext: "rgba(59,90,115,0.55)",
    glitchShadowA: "#B5502C",
    glitchShadowB: "#E8C77E",
    fontEyebrow: "var(--font-country-1), serif",
    fontDisplay: "var(--font-country-1), serif",
    fontSignature: "var(--font-country-1), serif",
    titleAnimation: "curvedLoop",
    cardPalettes: [
      // Cream — sun-bleached paper, rust text
      { bg: "#F3E9D2", text: "#3B5A73", subtext: "rgba(59,90,115,0.55)", eyebrow: "#B5502C", divider: "#E8C77E", border: "#7A2E2E", borderWidth: "1.5px", glitchA: "#B5502C", glitchB: "#E8C77E" },
      // Denim blue — indigo shadow, wheat warmth
      { bg: "#3B5A73", text: "#F3E9D2", subtext: "rgba(243,233,210,0.55)", eyebrow: "#E8C77E", divider: "#E8C77E", border: "#E8C77E", borderWidth: "1.5px", glitchA: "#E8C77E", glitchB: "#F3E9D2" },
      // Wheat — warm gold, dark red accents
      { bg: "#E8C77E", text: "#3B5A73", subtext: "rgba(59,90,115,0.6)", eyebrow: "#7A2E2E", divider: "#B5502C", border: "#7A2E2E", borderWidth: "1.5px", glitchA: "#7A2E2E", glitchB: "#B5502C" },
      // Rust orange — weathered barn door
      { bg: "#B5502C", text: "#F3E9D2", subtext: "rgba(243,233,210,0.6)", eyebrow: "#E8C77E", divider: "#E8C77E", border: "#7A2E2E", borderWidth: "1.5px", glitchA: "#E8C77E", glitchB: "#F3E9D2" },
      // Barn red — deep warm red
      { bg: "#7A2E2E", text: "#F3E9D2", subtext: "rgba(243,233,210,0.55)", eyebrow: "#E8C77E", divider: "#E8C77E", border: "#B5502C", borderWidth: "1.5px", glitchA: "#E8C77E", glitchB: "#F3E9D2" },
    ],
  },
  "Reggae": {
    background: "#1E7A34",
    text: "#EFE6D0",
    accent: "#F2C230",
    accentSecondary: "#1E7A34",
    cardBackground: "#141414",
    cardText: "#EFE6D0",
    panelSubtext: "rgba(239,230,208,0.5)",
    glitchShadowA: "#F2C230",
    glitchShadowB: "#1E7A34",
    fontEyebrow: "var(--font-reggae-1), sans-serif",
    fontDisplay: "var(--font-reggae-1), sans-serif",
    fontSignature: "var(--font-reggae-1), sans-serif",
    titleAnimation: "splitText",
    cardPalettes: [
      // Black — deep, warm dark
      { bg: "#141414", text: "#EFE6D0", subtext: "rgba(239,230,208,0.5)", eyebrow: "#F2C230", divider: "#F2C230", border: "#1E7A34", borderWidth: "1.5px", glitchA: "#F2C230", glitchB: "#1E7A34" },
      // Gold — warm saturated
      { bg: "#F2C230", text: "#141414", subtext: "rgba(20,20,20,0.6)", eyebrow: "#141414", divider: "#CE1126", border: "#1E7A34", borderWidth: "1.5px", glitchA: "#CE1126", glitchB: "#1E7A34" },
      // Green — lush, Jamaican flag green
      { bg: "#1E7A34", text: "#EFE6D0", subtext: "rgba(239,230,208,0.55)", eyebrow: "#F2C230", divider: "#F2C230", border: "#F2C230", borderWidth: "1.5px", glitchA: "#F2C230", glitchB: "#EFE6D0" },
      // Red — rare, used deliberately
      { bg: "#CE1126", text: "#EFE6D0", subtext: "rgba(239,230,208,0.55)", eyebrow: "#F2C230", divider: "#F2C230", border: "#141414", borderWidth: "1.5px", glitchA: "#F2C230", glitchB: "#EFE6D0" },
      // Sand — daylight warmth
      { bg: "#EFE6D0", text: "#141414", subtext: "rgba(20,20,20,0.55)", eyebrow: "#1E7A34", divider: "#F2C230", border: "#1E7A34", borderWidth: "1.5px", glitchA: "#1E7A34", glitchB: "#CE1126" },
    ],
  },
  "Blues/Soul": {
    background: "#0a0f1a",
    text: "#E8D8DC",
    accent: "#B97D82",
    accentSecondary: "#22314A",
    cardBackground: "#E8D8DC",
    cardText: "#0a0f1a",
    panelSubtext: "#887078",
    glitchShadowA: "#B97D82",
    glitchShadowB: "#4A7BA8",
    fontEyebrow: "sans-serif",
    fontDisplay: "sans-serif",
    fontSignature: "sans-serif",
    titleAnimation: "glitch",
    cardPalettes: [
      { bg: "#E8D8DC", text: "#0a0f1a", subtext: "#887078", eyebrow: "#B97D82", divider: "#4A7BA8", border: "#B97D82", glitchA: "#B97D82", glitchB: "#4A7BA8" },
    ],
  },
};

// Maps Genre enum values (from DB / ?genre= param) to THEMES keys
const GENRE_THEME_KEY: Record<string, string> = {
  HIP_HOP:      "Hip-Hop",
  CLASSICAL:    "Classical",
  JAZZ:         "Jazz",
  ROCK_METAL:   "Rock/Metal",
  ELECTRONIC:   "EDM",
  COUNTRY_FOLK: "Folk",
  REGGAE:       "Reggae",
  BLUES_SOUL:   "Blues/Soul",
};

export function getTheme(q: string): Theme {
  if (!q) return defaultTheme;
  // Accept Genre enum values (e.g. "HIP_HOP") as well as display names (e.g. "Hip-Hop")
  const resolved = GENRE_THEME_KEY[q] ?? q;
  if (THEMES[resolved]) return THEMES[resolved];
  const key = Object.keys(THEMES).find(k => k.toLowerCase() === resolved.toLowerCase());
  return key ? THEMES[key] : defaultTheme;
}
