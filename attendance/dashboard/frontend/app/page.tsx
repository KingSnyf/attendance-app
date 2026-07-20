"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { Spinner } from "@/components/ui/spinner";
import { ROLES_AUTHORISES } from "@/lib/api";

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "auth" | "dashboard">("loading");

  useEffect(() => {
    const check = async () => {
      let token = authService.getToken();
      if (!token) {
        try {
          const refreshRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/auth/refresh`,
            { method: "POST", credentials: "include", signal: AbortSignal.timeout(3000) }
          );
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            authService.setToken(data.access_token);
            token = data.access_token;
          }
        } catch { /* pas de refresh */ }
        if (!token) { setState("auth"); return; }
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3000) }
        );
        if (res.ok) {
          const user = await res.json();
          authService.setUser(user);
          if (ROLES_AUTHORISES.includes(user.role)) {
            setState("dashboard");
          } else {
            authService.logout();
            setState("auth");
          }
        } else {
          authService.logout();
          setState("auth");
        }
      } catch {
        authService.logout();
        setState("auth");
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    if (state === "auth") router.push("/auth");
    if (state === "dashboard") router.push("/dashboard");
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Spinner />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}
