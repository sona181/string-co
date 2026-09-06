"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AnimatedList from "./AnimatedList";

type Suggestion = {
  id: string;
  text: string;
  imageUrl?: string | null;
};

type Props = {
  defaultValue?: string;
  hiddenFields?: Record<string, string>;
};

export default function ShopSearchBar({ defaultValue = "", hiddenFields = {} }: Readonly<Props>) {
  const [query, setQuery]             = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focused, setFocused]         = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef  = useRef(0);
  const inputRef    = useRef<HTMLInputElement>(null);

  // ── Debounced suggestions fetch ──────────────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setSelectedIdx(-1); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const id = ++fetchIdRef.current;
      try {
        const res = await fetch(`/api/shop/search-suggestions?q=${encodeURIComponent(query)}`);
        if (id !== fetchIdRef.current) return;
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setSelectedIdx(-1);
      } catch {
        // network error — keep existing suggestions
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // ── Navigate on suggestion pick ──────────────────────────────────────────────
  const navigate = useCallback((s: Suggestion) => {
    setSuggestions([]);
    setFocused(false);
    globalThis.dispatchEvent(new CustomEvent("dome:open-product", { detail: { id: s.id } }));
  }, []);

  const handleItemSelect = useCallback((_label: string, index: number) => {
    const s = suggestions[index];
    if (s) navigate(s);
  }, [suggestions, navigate]);

  // ── Keyboard handler on input ────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSuggestions([]);
      setSelectedIdx(-1);
      return;
    }
    if (e.key === "Enter") {
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        e.preventDefault();
        navigate(suggestions[selectedIdx]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    }
  }, [selectedIdx, suggestions, navigate]);

  const showDropdown = focused && suggestions.length > 0;
  const items = suggestions.map(s => s.text);

  return (
    <div style={{ position: "relative", marginBottom: "1.5rem" }}>
      <form
        method="GET"
        action="/shop"
        style={{
          position: "relative",
          background: "rgba(0,0,0,0.7)",
          borderRadius: "999px",
          padding: "0.75rem 1.5rem 0.75rem 1.25rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <Search
          style={{
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            width: 16, height: 16, color: "rgba(255,255,255,0.45)", pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          name="q"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          onKeyDown={handleKeyDown}
          placeholder="Search instruments, brands…"
          autoComplete="off"
          style={{
            width: "100%",
            paddingLeft: 28, paddingRight: 16,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--theme-text, #F2EFE4)",
            fontSize: "1rem",
          }}
        />
        {Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      </form>

      {/* ── Floating glass dropdown ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.17, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0, right: 0,
              background: "color-mix(in srgb, var(--theme-cardBackground, #1a1625) 80%, transparent)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 18,
              boxShadow: "0 8px 32px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 9999,
              overflow: "hidden",
              ["--al-bg" as string]: "transparent",
              ["--al-text" as string]: "var(--theme-text, #F2EFE4)",
              ["--al-selected" as string]: "var(--theme-accent, #FF3B1F)",
              ["--al-selected-text" as string]: "var(--theme-text, #F2EFE4)",
            }}
          >
            <AnimatedList
              items={items}
              selectedIndex={selectedIdx}
              onItemSelect={handleItemSelect}
              onSelectedIndexChange={setSelectedIdx}
              showGradients={false}
              enableArrowNavigation={false}
              displayScrollbar={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
