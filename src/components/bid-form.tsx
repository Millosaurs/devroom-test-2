"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

interface BidFormProps {
  auctionId: number;
  currentPrice: number;
}

export function BidForm({ auctionId, currentPrice }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchUserBalance();
    }
  }, [session]);

  const fetchUserBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setUserBalance("1000.00");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const amount = parseFloat(bidAmount);

    if (amount <= currentPrice) {
      setError(`Bid must be higher than current price of $${currentPrice}`);
      setLoading(false);
      return;
    }

    if (amount > parseFloat(userBalance)) {
      setError("Insufficient balance for this bid");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        router.refresh();
        setBidAmount("");
        fetchUserBalance();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to place bid");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || balanceLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 mb-4">
            Please log in to place a bid
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Login to Bid
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bid</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid ($)</Label>
            <Input
              id="bidAmount"
              type="number"
              step="0.01"
              min={currentPrice + 0.01}
              max={parseFloat(userBalance)}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Minimum: $${(currentPrice + 0.01).toFixed(2)}`}
              required
            />
          </div>

          <div className="text-sm text-gray-600">
            Your balance: ${userBalance}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Placing bid..." : "Place Bid"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
