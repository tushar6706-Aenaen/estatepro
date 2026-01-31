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
        className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting chat..." : "Message Agent"}
      </button>
      {error && (
        <div className="text-xs text-neutral-400">
          {error}{" "}
          <Link href="/auth?mode=signin" className="text-white underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
