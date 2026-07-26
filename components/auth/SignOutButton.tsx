"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-sm font-medium text-savi-muted transition hover:text-savi-ink"
    >
      Sign out
    </button>
  );
}
