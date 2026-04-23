"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createOrGetChat } from "@/src/lib/chat/client";

type MessageAgentButtonProps = {
  propertyId: string;
  agentId: string;
};

export function MessageAgentButton({
  propertyId,
  agentId,
}: MessageAgentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    return loading || !propertyId || !agentId;
  }, [loading, propertyId, agentId]);

  const handleClick = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);

    const { data, error: requestError } = await createOrGetChat({
      propertyId,
      agentId,
    });

    if (requestError || !data) {
      setError(requestError?.message ?? "Unable to start chat.");
      setLoading(false);
      return;
    }

    router.push(`/chats/${data.id}`);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="group relative w-full overflow-hidden rounded-2xl border border-indigo-900/30 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(79,70,229,0.85)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_45px_-22px_rgba(99,102,241,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_45%)] opacity-90" />
        <span className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_0_6px_rgba(255,255,255,0.15)]" />
        <span className="relative inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>{loading ? "Starting chat..." : "Message Agent Now"}</span>
        </span>
      </button>
      {error && (
        <div className="rounded-xl border border-zinc-900/10 bg-white px-3 py-2 text-xs text-zinc-600">
          {error}{" "}
          <Link href="/auth?mode=signin" className="font-semibold text-zinc-900 underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
