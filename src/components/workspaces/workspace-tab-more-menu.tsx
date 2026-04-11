"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

type WorkspaceTabMoreMenuProps = {
  children: ReactNode;
};

export function WorkspaceTabMoreMenu({ children }: WorkspaceTabMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        aria-label="More"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
