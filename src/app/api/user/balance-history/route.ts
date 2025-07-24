import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { balanceTransactions, auctions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const transactions = await db
      .select({
        id: balanceTransactions.id,
        type: balanceTransactions.type,
        amount: balanceTransactions.amount,
        description: balanceTransactions.description,
        createdAt: balanceTransactions.createdAt,
        auctionTitle: auctions.title,
      })
      .from(balanceTransactions)
      .leftJoin(auctions, eq(balanceTransactions.auctionId, auctions.id))
      .where(eq(balanceTransactions.userId, session.user.id))
      .orderBy(desc(balanceTransactions.createdAt))
      .limit(50);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get balance history error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
