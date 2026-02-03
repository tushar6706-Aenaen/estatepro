"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
  };

  const primaryAction = () => {
    if (!userEmail) {
      return (
        <Link
          href="/auth?mode=signup&redirect=/onboarding"
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
        >
          List Property
        </Link>
      );
    }

    if (isAdmin) {
      return (
        <Link
          href="/admin"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          Admin Dashboard
        </Link>
      );
    }

    if (isAgent) {
      return (
        <Link
          href="/agent"
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
        >
          Agent Dashboard
        </Link>
      );
    }

    return (
      <Link
        href="/onboarding?redirect=/"
        className="rounded-full border border-gray-900 bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
      >
        Become an Agent
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 md:gap-6 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
          <span className="text-base md:text-lg font-semibold tracking-tight text-gray-900">LuxEstate</span>
        </div>

        <div className="hidden flex-1 items-center gap-3 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 md:flex">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search for city, neighborhood, or zip"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 text-sm lg:flex">
          {navLinks.map((link) => {
            const isActive = link.value === activeListingType || 
                           (link.value === "sale" && !searchParams.get("listingType"));
            
            return (
              <Link
                key={link.value}
                href={link.href}
                className={`px-3 lg:px-4 py-2 rounded-full font-medium transition-all ${
                  isActive && (link.value === "sale" || link.value === "rent")
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:gap-4 md:flex">
          {loading ? (
            <div className="h-10 w-32 md:w-40 rounded-full bg-gray-200" />
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-gray-900">
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
          className="md:hidden ml-auto"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-300 bg-white">
          <div className="px-4 py-4 space-y-3">
            {/* User Info Section */}
            {loading ? (
              <div className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
            ) : userEmail ? (
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
                  <p className="text-xs text-gray-600">
                    {isAdmin ? "Administrator" : isAgent ? "Agent" : "Member"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pb-3 border-b border-gray-200">
                <Link
                  href="/auth?mode=signin"
                  className="block w-full text-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const isActive = link.value === activeListingType || 
                               (link.value === "sale" && !searchParams.get("listingType"));
                
                return (
                  <Link
                    key={link.value}
                    href={link.href}
                    className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                      isActive && (link.value === "sale" || link.value === "rent")
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
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
              <div className="pt-3 border-t border-gray-200 space-y-1">
                <Link
                  href="/chats"
                  className="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href={profileDestination}
                  className="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href={accountDestination}
                  className="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdmin ? "Admin Dashboard" : isAgent ? "Agent Dashboard" : "Account"}
                </Link>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-3 border-t border-gray-200">
              {!userEmail ? (
                <Link
                  href="/auth?mode=signup&redirect=/onboarding"
                  className="block w-full text-center rounded-lg border-2 border-gray-900 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  List Property
                </Link>
              ) : (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block w-full text-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isAgent && !isAdmin && (
                    <Link
                      href="/agent"
                      className="block w-full text-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Agent Dashboard
                    </Link>
                  )}
                  {!isAgent && !isAdmin && (
                    <Link
                      href="/onboarding?redirect=/"
                      className="block w-full text-center rounded-lg border-2 border-gray-900 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
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
                    className="mt-2 block w-full text-center rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
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
