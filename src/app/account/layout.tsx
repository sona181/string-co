import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountSidebar from "@/components/account/AccountSidebar";

export const metadata = { title: "My Account — StringCo" };

// Fixed dark palette — account section shares the site's dark aesthetic
const themeVars: React.CSSProperties = {
  ["--theme-bg"            as string]: "#0D0D0D",
  ["--theme-text"          as string]: "#F2EFE4",
  ["--theme-accent"        as string]: "#FF3B1F",
  ["--theme-card-bg"       as string]: "rgba(20,14,12,0.90)",
  ["--theme-card-text"     as string]: "#F2EFE4",
  ["--theme-panel-subtext" as string]: "#8A8578",
  ["--theme-border"        as string]: "rgba(255,59,31,0.18)",
  ["--theme-font-eyebrow"  as string]: "var(--font-wild-sewerage-var), sans-serif",
  ["--theme-font-display"  as string]: "var(--font-riemish-var), sans-serif",
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div style={themeVars}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <AccountSidebar
              user={{ name: session.user.name, email: session.user.email }}
            />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
