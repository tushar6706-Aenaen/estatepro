"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { supabaseBrowserClient } from "@/src/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const navLinks = [
  { label: "Buy", value: "sale", href: "/?listingType=sale" },
  { label: "Rent", value: "rent", href: "/?listingType=rent" },
  { label: "Sell", value: "sell", href: "/onboarding?redirect=/" },
  { label: "Agents", value: "agents", href: "/agents" },
];

type ProfileRow = {
  role: "public" | "agent" | "admin" | null;
};

export function HomeHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeListingType = searchParams.get("listingType") || "sale";
  
  const supabaseReady = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }, []);

  const [loading, setLoading] = useState(supabaseReady);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<ProfileRow["role"] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const profileDestination = isAdmin
    ? "/admin/profile"
    : isAgent
      ? "/agent/profile"
      : "/profile";
  const isHomeRoute = pathname === "/";
  const isMessagesRoute = pathname?.startsWith("/chats");

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
  };

  const primaryAction = () => {
    if (!userEmail) {
      return (
        <Link
          href="/auth?mode=signup&redirect=/onboarding"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(0,0,0,0.45)] transition hover:bg-zinc-800 active:scale-95"
        >
          List Property
        </Link>
      );
    }

    if (isAdmin) {
      return (
        <Link
          href="/admin"
          className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(0,0,0,0.45)] transition hover:bg-emerald-600 active:scale-95"
        >
          Admin Dashboard
        </Link>
      );
    }

    if (isAgent) {
      return (
        <Link
          href="/agent"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(0,0,0,0.45)] transition hover:bg-zinc-800 active:scale-95"
        >
          Agent Dashboard
        </Link>
      );
    }

    return (
      <Link
        href="/onboarding?redirect=/"
        className="rounded-full border border-zinc-900/15 bg-[#f8f3e7] px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900/30 hover:bg-[#f1ead8] active:scale-95"
      >
        Become an Agent
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900/10 bg-[#efe8d8]/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-2 rounded-[1.2rem] border border-zinc-900/10 bg-white/80 px-3 py-2 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.4)] backdrop-blur-sm md:gap-4 md:px-4">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:w-[18px] md:h-[18px]"
            >
              <path d="M12 2v20" />
              <path d="M2 12h20" />
              <path d="m4.9 4.9 14.2 14.2" />
              <path d="m19.1 4.9-14.2 14.2" />
            </svg>
            </span>
            <span className="text-base md:text-lg font-semibold tracking-tight text-zinc-950">
              LuxEstate
            </span>
          </Link>

          <div className="hidden flex-1 items-center gap-3 rounded-full border border-zinc-900/10 bg-[#f8f3e7] px-4 py-2.5 text-sm text-zinc-700 shadow-inner md:flex">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
              className="text-zinc-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search for city, neighborhood, or zip"
              className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-500 outline-none"
          />
          </div>

          <nav className="ml-auto hidden items-center gap-1.5 text-sm lg:flex">
            {navLinks.map((link) => {
              const isListingLink = link.value === "sale" || link.value === "rent";
              const isActive = isHomeRoute
                ? link.value === activeListingType ||
                  (link.value === "sale" && !searchParams.get("listingType"))
                : false;

              return (
                <Link
                  key={link.value}
                  href={link.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isListingLink && isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-[#f8f3e7] hover:text-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/chats"
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                isMessagesRoute
                  ? "border-zinc-900/20 bg-zinc-900 text-white"
                  : "border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/25 hover:bg-[#f8f3e7]"
              }`}
            >
              Messages
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:gap-3 md:flex">
          {loading ? (
              <div className="h-10 w-32 rounded-full bg-zinc-200/80" />
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white px-2 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-900/20 hover:bg-[#f8f3e7] hover:text-zinc-900">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
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
                        <Link href="/chats">Messages</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={profileDestination}>Profile</Link>
                      </DropdownMenuItem>
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

          <button
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-900/10 bg-white text-zinc-900 shadow-sm transition hover:bg-[#f8f3e7] md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Open menu</span>
          {mobileMenuOpen ? (
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
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
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
          )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mt-2 md:hidden">
          <div className="space-y-3 rounded-[1.2rem] border border-zinc-900/10 bg-white/90 px-4 py-4 shadow-[0_16px_45px_-35px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            {/* User Info Section */}
            {loading ? (
              <div className="h-12 w-full rounded-xl bg-zinc-200/80 animate-pulse" />
            ) : userEmail ? (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-900/10 bg-[#f8f3e7] p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{userEmail}</p>
                  <p className="text-xs text-zinc-600">
                    {isAdmin ? "Administrator" : isAgent ? "Agent" : "Member"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Link
                  href="/auth?mode=signin"
                  className="block w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const isListingLink = link.value === "sale" || link.value === "rent";
                const isActive = isHomeRoute
                  ? link.value === activeListingType ||
                    (link.value === "sale" && !searchParams.get("listingType"))
                  : false;
                
                return (
                  <Link
                    key={link.value}
                    href={link.href}
                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                      isListingLink && isActive
                        ? "bg-zinc-900 text-white"
                        : "border border-transparent text-zinc-700 hover:border-zinc-900/10 hover:bg-[#f8f3e7]"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu Items */}
            {userEmail && (
              <div className="space-y-1 rounded-xl border border-zinc-900/10 bg-white p-2">
                <Link
                  href="/chats"
                  className={`block rounded-lg px-4 py-2.5 font-medium transition ${
                    isMessagesRoute
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-[#f8f3e7]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href={profileDestination}
                  className="block rounded-lg px-4 py-2.5 text-zinc-700 hover:bg-[#f8f3e7] font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href={accountDestination}
                  className="block rounded-lg px-4 py-2.5 text-zinc-700 hover:bg-[#f8f3e7] font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdmin ? "Admin Dashboard" : isAgent ? "Agent Dashboard" : "Account"}
                </Link>
              </div>
            )}

            {/* Action Button */}
            <div className="border-t border-zinc-900/10 pt-3">
              {!userEmail ? (
                <Link
                  href="/auth?mode=signup&redirect=/onboarding"
                  className="block w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  List Property
                </Link>
              ) : (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isAgent && !isAdmin && (
                    <Link
                      href="/agent"
                      className="block w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Agent Dashboard
                    </Link>
                  )}
                  {!isAgent && !isAdmin && (
                    <Link
                      href="/onboarding?redirect=/"
                      className="block w-full rounded-xl border border-zinc-900/15 bg-[#f8f3e7] px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 transition hover:border-zinc-900/30 hover:bg-[#f1ead8]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Become an Agent
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-2 block w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
