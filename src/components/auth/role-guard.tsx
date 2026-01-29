"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";

type AllowedRole = "agent" | "admin";

type ProfileRow = {
  role: "public" | "agent" | "admin" | null;
};

type GuardState =
  | { status: "loading" }
  | { status: "allowed" }
  | { status: "denied"; reason: string; redirect: string };

type RoleGuardProps = {
  allowedRoles: AllowedRole[];
  children: React.ReactNode;
  loadingSlot?: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGuard({
  allowedRoles,
  children,
  loadingSlot,
  fallback,
}: RoleGuardProps) {
  const pathname = usePathname();
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [state, setState] = useState<GuardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      if (!supabaseReady) {
        if (cancelled) return;
        setState({
          status: "denied",
          reason: "Supabase environment variables are missing in .env.local.",
          redirect: "/auth",
        });
        return;
      }

      const { data, error } = await supabaseBrowserClient.auth.getUser();

      if (cancelled) return;

      if (error) {
        setState({
          status: "denied",
          reason: error.message,
          redirect: `/auth?redirect=${encodeURIComponent(pathname)}`,
        });
        return;
      }

      const user = data.user;
      if (!user) {
        setState({
          status: "denied",
          reason: "Sign in to access this area.",
          redirect: `/auth?redirect=${encodeURIComponent(pathname)}`,
        });
        return;
      }

      const { data: profile, error: profileError } = await supabaseBrowserClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (cancelled) return;

      if (profileError) {
        setState({
          status: "denied",
          reason: profileError.message,
          redirect: "/onboarding",
        });
        return;
      }

      const role = profile?.role ?? "public";
      const isAllowed =
        role === "admin" || allowedRoles.includes(role as AllowedRole);

      setState(
        isAllowed
          ? { status: "allowed" }
          : {
              status: "denied",
              reason: "This area is limited to agents or admins.",
              redirect: "/onboarding",
            },
      );
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, pathname, supabaseReady]);

  if (state.status === "allowed") {
    return <>{children}</>;
  }

  if (state.status === "loading") {
    return (
      <>
        {loadingSlot ?? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
            Checking your access...
          </div>
        )}
      </>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <div className="text-base font-semibold text-amber-900">
        Access restricted
      </div>
      <div>{state.reason}</div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={state.redirect}
          className="rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Go to {state.redirect.startsWith("/onboarding") ? "onboarding" : "auth"}
        </Link>
        <Link
          href="/onboarding"
          className="text-xs font-semibold text-amber-900 underline underline-offset-4"
        >
          Update my role
        </Link>
      </div>
    </div>
  );
}
