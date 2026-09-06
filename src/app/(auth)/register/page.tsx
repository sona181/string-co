"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import FadeUp from "@/components/FadeUp";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [error, action, pending] = useActionState(register, undefined);

  return (
    <div>

      <FadeUp delay={0}>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-spray-red mb-5">
          String Co.
        </p>
      </FadeUp>

      <FadeUp delay={0.07}>
        <h1 className="text-5xl font-black uppercase tracking-tight text-concrete leading-tight mb-4">
          Create your account
        </h1>
      </FadeUp>

      <FadeUp delay={0.13}>
        <p className="text-rust-gray text-base mb-12">
          Free forever · Earn loyalty points on every order
        </p>
      </FadeUp>

      {error && (
        <p className="mb-8 text-sm text-spray-red font-medium">{error}</p>
      )}

      <form action={action} className="space-y-10">
        <FadeUp delay={0.19}>
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-black uppercase tracking-[0.2em] text-rust-gray mb-3"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              className="w-full bg-transparent border-b border-rust-gray/40 text-tag-yellow text-lg py-3 px-0 focus:outline-none focus:border-tag-yellow transition-colors"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.25}>
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

        <FadeUp delay={0.31}>
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
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent border-b border-rust-gray/40 text-tag-yellow text-lg py-3 px-0 focus:outline-none focus:border-tag-yellow transition-colors"
            />
            <p className="text-xs text-rust-gray/60 mt-2 uppercase tracking-widest">Minimum 8 characters</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.37}>
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 bg-spray-red text-black font-black text-sm px-7 py-4 rounded-xl uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50"
          >
            {pending ? "Creating account…" : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </FadeUp>
      </form>

      <FadeUp delay={0.43}>
        <p className="mt-10 text-sm text-rust-gray">
          Already have an account?{" "}
          <Link href="/login" className="text-concrete font-bold hover:text-tag-yellow transition-colors">
            Sign in
          </Link>
        </p>
      </FadeUp>

    </div>
  );
}
