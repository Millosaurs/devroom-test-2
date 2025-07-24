import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auctions, bids, user, balanceTransactions } from "@/db/schema";
import { eq, and, desc, lte } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const endedAuctions = await db
      .select()
      .from(auctions)
      .where(
        and(eq(auctions.isActive, true), lte(auctions.closingDate, new Date()))
      );

    for (const auction of endedAuctions) {
      const highestBid = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, auction.id))
        .orderBy(desc(bids.createdAt))
        .limit(1);

      if (highestBid.length > 0) {
        const winningBid = highestBid[0];

        await db.insert(balanceTransactions).values({
          userId: winningBid.userId,
          auctionId: auction.id,
          bidId: winningBid.id,
          type: "auction_win",
          amount: winningBid.amount,
          description: `Won auction: ${auction.title}`,
        });
      }

      await db
        .update(auctions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(auctions.id, auction.id));
    }

    return NextResponse.json({
      message: `Processed ${endedAuctions.length} ended auctions`,
    });
  } catch (error) {
    console.error("Process ended auctions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
