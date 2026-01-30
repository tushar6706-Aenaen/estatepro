"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const navLinks = ["Buy", "Rent", "Sell", "Agents"];

type ProfileRow = {
  role: "public" | "agent" | "admin" | null;
};

export function HomeHeader() {
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(supabaseReady);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<ProfileRow["role"] | null>(null);

  useEffect(() => {
    if (!supabaseReady) {
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      const { data, error } = await supabaseBrowserClient.auth.getUser();

      if (cancelled) return;

      if (error || !data.user) {
        setUserEmail(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUserEmail(data.user.email ?? null);

      const { data: profileData } = await supabaseBrowserClient
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle<ProfileRow>();

      if (cancelled) return;

      setRole(profileData?.role ?? "public");
      setLoading(false);
    };

    loadSession();

    const { data: authListener } =
      supabaseBrowserClient.auth.onAuthStateChange(() => {
        setLoading(true);
        loadSession();
      });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [supabaseReady]);

  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const avatarFallback = userEmail?.[0]?.toUpperCase() ?? "?";
  const accountDestination = isAdmin ? "/admin" : "/onboarding";

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
  };

  const primaryAction = () => {
    if (!userEmail) {
      return (
        <Link
          href="/auth?mode=signup&redirect=/onboarding"
          className="rounded-full bg-neutral-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)] transition hover:bg-neutral-400"
        >
          List Property
        </Link>
      );
    }

    if (isAdmin) {
      return (
        <Link
          href="/admin"
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-20px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400"
        >
          Admin Dashboard
        </Link>
      );
    }

    if (isAgent) {
      return (
        <Link
          href="/agent"
          className="rounded-full bg-neutral-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)] transition hover:bg-neutral-400"
        >
          Agent Dashboard
        </Link>
      );
    }

    return (
      <Link
        href="/onboarding?redirect=/"
        className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
      >
        Become an Agent
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-500/15 text-neutral-300">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M2 12h20" />
              <path d="m4.9 4.9 14.2 14.2" />
              <path d="m19.1 4.9-14.2 14.2" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">LuxEstate</span>
        </div>

        <div className="hidden flex-1 items-center gap-3 rounded-full border border-white/10 bg-neutral-900/60 px-4 py-2 text-sm text-neutral-300 md:flex">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search for city, neighborhood, or zip"
            className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-6 text-sm text-neutral-300 md:flex">
          {navLinks.map((link) => (
            <a key={link} className="transition hover:text-white" href="#">
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {loading ? (
            <div className="h-10 w-40 rounded-full bg-white/5" />
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-semibold text-neutral-200 transition hover:text-white">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">
                      {userEmail ? "Account" : "Sign In"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userEmail ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={accountDestination}>Account</Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      {isAgent && !isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/agent">Agent Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth?mode=signin">Sign in</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth?mode=signup&redirect=/onboarding">
                          Create account
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {primaryAction()}
            </>
          )}
        </div>

        <button className="md:hidden">
          <span className="sr-only">Open menu</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18" />
            <path d="M3 6h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
