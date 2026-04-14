"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser-client";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button className={className ?? "ghost-button"} onClick={handleLogout} disabled={loading} type="button">
      {loading ? "退出中..." : "退出登录"}
    </button>
  );
}
