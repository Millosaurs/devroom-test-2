"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export interface AuctionOwnerControlsProps {
  auctionId: number;
  isLocked: boolean | null;
  isActive: boolean | null;
  ownerId: string;
}

export function AuctionOwnerControls({
  auctionId,
  isLocked,
  isActive,
  ownerId,
}: AuctionOwnerControlsProps) {
  const { data: session } = useSession();
  const [isPending, start] = useTransition();

  if (!session?.user || session.user.id !== ownerId) return null;

  const toggleLock = async () =>
    start(async () => {
      await fetch(`/api/auctions/${auctionId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: !isLocked }),
      });
      location.reload();
    });

  const endAuction = async () =>
    start(async () => {
      if (
        !confirm(
          "End this auction now?  No further bids will be possible and the winner will be settled."
        )
      )
        return;

      await fetch(`/api/auctions/${auctionId}/end`, { method: "POST" });
      location.reload();
    });

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        disabled={isPending}
        onClick={toggleLock}
        title={isLocked ? "Allow new bids" : "Block new bids"}
      >
        {isLocked ? "Unlock bids" : "Lock bids"}
      </Button>

      <Button
        variant="destructive"
        disabled={isPending}
        onClick={endAuction}
        title="End auction now"
      >
        End auction
      </Button>
    </div>
  );
}
