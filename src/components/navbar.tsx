"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [balanceLoading, setBalanceLoading] = useState(false);
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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Auctions
          </Link>

          <div className="flex items-center space-x-4">
            {!isPending && (
              <>
                {session?.user ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Balance: {balanceLoading ? "..." : `$${userBalance}`}
                    </span>
                    <Link href="/create">
                      <Button variant="outline" size="sm">
                        Create Auction
                      </Button>
                    </Link>
                    <span className="text-sm text-gray-700">
                      Welcome, {session.user.name}
                    </span>
                    <Button onClick={handleLogout} variant="ghost" size="sm">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">Register</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
