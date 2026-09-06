"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/lib/actions/auth";
import FadeUp from "@/components/FadeUp";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  // NextAuth redirects to /login?callbackUrl=... ; custom links use ?redirect=...
  const redirectTo = searchParams.get("callbackUrl") ?? searchParams.get("redirect") ?? "/shop";

  return (
    <div>

      <FadeUp delay={0}>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-spray-red mb-5">
          String Co.
        </p>
      </FadeUp>

      <FadeUp delay={0.07}>
        <h1 className="text-5xl font-black uppercase tracking-tight text-concrete leading-tight mb-4">
          Welcome back
        </h1>
      </FadeUp>

      <FadeUp delay={0.13}>
        <p className="text-rust-gray text-base mb-12">Sign in to continue shopping</p>
      </FadeUp>

      {registered && (
        <FadeUp delay={0}>
          <p className="mb-8 text-sm font-medium" style={{ color: "#00C2A8" }}>
            Account created — sign in below.
          </p>
        </FadeUp>
      )}

      {error && (
        <p className="mb-8 text-sm text-spray-red font-medium">{error}</p>
      )}

      <form action={action} className="space-y-10">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <FadeUp delay={0.19}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-3"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-transparent border-b border-rust-gray/40 text-tag-yellow text-lg py-3 px-0 focus:outline-none focus:border-tag-yellow transition-colors"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-3"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-transparent border-b border-rust-gray/40 text-tag-yellow text-lg py-3 px-0 focus:outline-none focus:border-tag-yellow transition-colors"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.31}>
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 bg-spray-red text-black font-black text-sm px-7 py-4 rounded-xl uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50"
          >
            {pending ? "Signing in…" : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </FadeUp>
      </form>

      <FadeUp delay={0.37}>
        <p className="mt-10 text-sm text-rust-gray">
          No account?{" "}
          <Link href="/register" className="text-concrete font-bold hover:text-tag-yellow transition-colors">
            Create one free
          </Link>
        </p>
      </FadeUp>

    </div>
  );
}
