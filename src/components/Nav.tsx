"use client";

import Link from "next/link";
import { Guitar, Menu, X, User } from "lucide-react";
import { useState } from "react";
import CartDropdown from "@/components/CartDropdown";

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

type NavProps = {
  readonly userEmail?: string | null;
  readonly categories: NavCategory[];
};

export default function Nav({ userEmail, categories }: NavProps) {
  const loggedIn = !!userEmail;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[10000] bg-asphalt border-b border-rust-gray/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight text-concrete uppercase">
            <Guitar className="w-5 h-5 text-spray-red" />
            String Co.
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-sm font-black uppercase tracking-wide text-rust-gray hover:text-concrete transition-colors">
              Shop
            </Link>
            <Link href="/tuner" className="text-sm font-black uppercase tracking-wide text-rust-gray hover:text-concrete transition-colors">
              Tune
            </Link>
            <a href="/#about" className="text-sm font-black uppercase tracking-wide text-rust-gray hover:text-concrete transition-colors">
              About us
            </a>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <CartDropdown loggedIn={loggedIn} />

            {userEmail ? (
              <Link href="/account" className="p-2 text-rust-gray hover:text-concrete transition-colors">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-rust-gray hover:text-spray-red transition-colors px-2"
              >
                Sign in
              </Link>
            )}

            <button
              className="md:hidden p-2 text-rust-gray hover:text-concrete transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-rust-gray/20 pt-3 space-y-1">
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="block px-2 py-2 text-sm font-bold text-concrete uppercase tracking-wide"
            >
              Shop
            </Link>
            <Link
              href="/tuner"
              onClick={() => setMenuOpen(false)}
              className="block px-2 py-2 text-sm font-bold text-concrete uppercase tracking-wide"
            >
              Tune
            </Link>
            <a
              href="/#about"
              onClick={() => setMenuOpen(false)}
              className="block px-2 py-2 text-sm font-bold text-concrete uppercase tracking-wide"
            >
              About us
            </a>
            {categories.map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-2 py-1.5 text-sm font-medium text-rust-gray hover:text-spray-red transition-colors"
                >
                  {cat.name}
                </Link>
                {cat.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/shop?category=${sub.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-5 py-1 text-xs text-rust-gray/60 hover:text-rust-gray transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
