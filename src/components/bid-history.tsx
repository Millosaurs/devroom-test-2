"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

interface Bid {
  id: number;
  amount: string;
  createdAt: Date | null;
  userName: string;
}

interface BidHistoryProps {
  bids: Bid[];
  auctionOwnerId: string; 
}

export function BidHistory({ bids, auctionOwnerId }: BidHistoryProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const canViewHistory = session?.user && session.user.id === auctionOwnerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bid History</CardTitle>
      </CardHeader>

      <CardContent>
        {!canViewHistory ? (
          <p className="text-gray-500 text-sm">
            Only the auction owner can view bid history
          </p>
        ) : bids.length === 0 ? (
          <p className="text-gray-500 text-sm">No bids yet</p>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">${bid.amount}</p>
                  <p className="text-sm text-gray-600">{bid.userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {bid.createdAt
                      ? new Date(bid.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {bid.createdAt
                      ? new Date(bid.createdAt).toLocaleTimeString()
                      : "Unknown time"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
