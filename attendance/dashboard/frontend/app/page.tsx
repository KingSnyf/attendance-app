"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { Spinner } from "@/components/ui/spinner";

const ROLES_AUTHORISES = ["admin", "gestionnaire"];

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "auth" | "dashboard">("loading");

  useEffect(() => {
    const check = async () => {
      const token = authService.getToken();
      if (!token) {
        setState("auth");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3000) }
        );
        if (res.ok) {
          const user = await res.json();
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
