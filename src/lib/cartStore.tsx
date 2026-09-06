"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

type CartCtx = {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  increment: () => void;
};

const Ctx = createContext<CartCtx>({ count: 0, setCount: () => {}, increment: () => {} });

export function CartCountProvider({ initial, children }: { initial: number; children: ReactNode }) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount((c) => c + 1), []);

  useEffect(() => {
    const handler = () => increment();
    window.addEventListener("cart:item-added", handler);
    return () => window.removeEventListener("cart:item-added", handler);
  }, [increment]);

  return <Ctx.Provider value={{ count, setCount, increment }}>{children}</Ctx.Provider>;
}

export const useCartCount = () => useContext(Ctx);

export function notifyCartAdded() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart:item-added"));
  }
}
