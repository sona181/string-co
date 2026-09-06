import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import NavWrapper from "@/components/NavWrapper";
import { CartCountProvider } from "@/lib/cartStore";
import FooterWrapper from "@/components/FooterWrapper";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NavCategory } from "@/components/Nav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Hip-Hop fonts (personal-use except Wild Sewerage — review licenses before deploy)
const lunatic      = localFont({ src: "../fonts/hip-hop/Lunatic.ttf",              variable: "--font-lunatic-var"       });
const riemish      = localFont({ src: "../fonts/hip-hop/Riemish.otf",              variable: "--font-riemish-var"       });
const firstLyrics  = localFont({ src: "../fonts/hip-hop/FirstLyrics.ttf",          variable: "--font-first-lyrics-var"  });
const secondLyrics = localFont({ src: "../fonts/hip-hop/SecondLyrics.ttf",         variable: "--font-second-lyrics-var" });
const wildSewerage = localFont({ src: "../fonts/hip-hop/WildSewerage.otf",         variable: "--font-wild-sewerage-var" });
const zombiewolf   = localFont({ src: "../fonts/hip-hop/ZombiewolfPersonalUse.ttf",variable: "--font-zombiewolf-var"    });

// Classical fonts (verify licenses before deploy)
const chopinScript         = localFont({ src: "../fonts/classical/ChopinScript.ttf",                      variable: "--font-classical-1" });
const crustaceansSignature = localFont({ src: "../fonts/classical/Crustaceans-SignatureDEMO-Regular.otf", variable: "--font-classical-2" });

// Jazz fonts (verify licenses before deploy)
const fastBlaze = localFont({ src: "../fonts/jazz/FAST BLAZE.otf", variable: "--font-jazz-1" });

// Rock/Metal fonts (verify licenses before deploy)
const graenMetal = localFont({ src: "../fonts/rock-metal/GraenMetal-Regular.otf", variable: "--font-rock-metal-1" });

// EDM fonts (verify licenses before deploy)
const punkKid = localFont({ src: "../fonts/edm/punk kid.ttf", variable: "--font-edm-1" });

// Country/Folk fonts (verify licenses before deploy)
const pinesCountry = localFont({ src: "../fonts/country-folk/Pines Country Font by Sutujuh.otf", variable: "--font-country-1" });

// Reggae fonts (verify licenses before deploy)
const yomanica = localFont({ src: "../fonts/reggae/Yomanica-Regular.otf", variable: "--font-reggae-1" });

export const metadata: Metadata = {
  title: "String Co. — Music Shop",
  description: "Guitars, basses, and gear for whatever you're building.",
};

export default async function RootLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await auth();

  const rawCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { children: { orderBy: { name: "asc" } } },
  });

  const categories: NavCategory[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  }));

  let cartCount = 0;
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { _count: { select: { items: true } } },
    });
    cartCount = cart?._count.items ?? 0;
  }

  return (
    <html
      lang="en"
      className={`${geist.variable} ${lunatic.variable} ${riemish.variable} ${firstLyrics.variable} ${secondLyrics.variable} ${wildSewerage.variable} ${zombiewolf.variable} ${chopinScript.variable} ${crustaceansSignature.variable} ${fastBlaze.variable} ${graenMetal.variable} ${punkKid.variable} ${pinesCountry.variable} ${yomanica.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-asphalt text-concrete">

        {/* Page content */}
        <CartCountProvider initial={cartCount}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <NavWrapper><Nav userEmail={session?.user?.email} categories={categories} /></NavWrapper>
          <main className="flex-1">{children}</main>
          <FooterWrapper><footer className="bg-[#0a0a0a] border-t border-rust-gray/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
              <div className="col-span-2 md:col-span-1">
                <p className="font-black uppercase tracking-tight text-tag-yellow text-sm mb-2">String Co.</p>
                <p className="text-xs text-rust-gray leading-relaxed">
                  Guitars, basses, and gear for whatever you&apos;re building.
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-tag-yellow mb-4">Shop</p>
                <ul className="space-y-2 text-xs text-rust-gray">
                  <li><a href="/shop" className="hover:text-tag-yellow transition-colors">All products</a></li>
                  <li><a href="/shop?sort=new" className="hover:text-tag-yellow transition-colors">New arrivals</a></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-tag-yellow mb-4">Account</p>
                <ul className="space-y-2 text-xs text-rust-gray">
                  <li><a href="/account" className="hover:text-tag-yellow transition-colors">My account</a></li>
                  <li><a href="/account/orders" className="hover:text-tag-yellow transition-colors">Orders</a></li>
                  <li><a href="/account/rewards" className="hover:text-tag-yellow transition-colors">Rewards</a></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-tag-yellow mb-4">Info</p>
                <ul className="space-y-2 text-xs text-rust-gray">
                  <li><a href="/register" className="hover:text-tag-yellow transition-colors">Create account</a></li>
                  <li><a href="/login" className="hover:text-tag-yellow transition-colors">Sign in</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-rust-gray/10 py-5 text-center text-xs text-rust-gray/50">
              {"©"} {new Date().getFullYear()} String Co. All rights reserved.
            </div>
          </footer></FooterWrapper>
        </div>
        </CartCountProvider>

      </body>
    </html>
  );
}
