import Ferrofluid from "@/components/Ferrofluid";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ position: "relative" }}>

      {/* Ferrofluid mesh background */}
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

      <div className="w-full max-w-lg px-6 py-20" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>

    </div>
  );
}
