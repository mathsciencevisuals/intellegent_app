"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center"
      >
        P
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-4">
          <div className="text-sm font-medium">Profile</div>

          <div className="mt-2 text-xs text-neutral-500">
            Logged in session
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 w-full rounded bg-black text-white py-2 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
