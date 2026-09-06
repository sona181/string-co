"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/admin";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={`Delete ${name}`}
      className="p-1.5 rounded text-spray-red hover:bg-spray-red/10 transition-colors disabled:opacity-40"
    >
      <Trash2 size={14} />
    </button>
  );
}
