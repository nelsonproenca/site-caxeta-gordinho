"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Supabase auth errors (expired/invalid links) redirect to the Site URL with
// the error in the hash fragment (#error=...), which the server never sees.
// Move it into a query param on the login page so it can show a real message
// instead of a raw error string sitting in the address bar.
export function AuthErrorWatcher() {
  const router = useRouter();

  useEffect(() => {
    if (!window.location.hash.includes("error=")) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get("error_code") ?? params.get("error");
    if (!code) return;

    router.replace(`/admin/login?error=${encodeURIComponent(code)}`);
  }, [router]);

  return null;
}
