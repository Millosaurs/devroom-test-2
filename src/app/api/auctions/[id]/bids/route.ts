import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bids, auctions, user, balanceTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const auctionId = parseInt(id);
    const { amount } = await request.json();

    if (isNaN(auctionId) || !amount || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid auction ID or bid amount" },
        { status: 400 }
      );
    }

    const auction = await db
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .limit(1);

    if (!auction.length) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    const auctionData = auction[0];

    if (
      !auctionData.isActive ||
      auctionData.isLocked ||
      new Date() > new Date(auctionData.closingDate)
    ) {
      return NextResponse.json(
        { message: "Bidding is closed for this auction" },
        { status: 400 }
      );
    }

    if (amount <= parseFloat(auctionData.currentPrice)) {
      return NextResponse.json(
        { message: "Bid must be higher than current price" },
        { status: 400 }
      );
    }

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData.length || parseFloat(userData[0].balance!) < amount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }

    const previousHighestBid = await db
      .select({
        id: bids.id,
        userId: bids.userId,
        amount: bids.amount,
      })
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.createdAt))
      .limit(1);

    await db.transaction(async (tx) => {
      const newBid = await tx
        .insert(bids)
        .values({
          auctionId,
          userId: session.user.id,
          amount: amount.toString(),
        })
        .returning();

      await tx
        .update(user)
        .set({
          balance: (parseFloat(userData[0].balance!) - amount).toString(),
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      await tx.insert(balanceTransactions).values({
        userId: session.user.id,
        auctionId,
        bidId: newBid[0].id,
        type: "bid_hold",
        amount: amount.toString(),
        description: `Bid placed on auction: ${auctionData.title}`,
      });

      if (
        previousHighestBid.length > 0 &&
        previousHighestBid[0].userId !== session.user.id
      ) {
        const prevBidder = await tx
          .select()
          .from(user)
          .where(eq(user.id, previousHighestBid[0].userId))
          .limit(1);

        if (prevBidder.length > 0) {
          const refundAmount = parseFloat(previousHighestBid[0].amount);

          await tx
            .update(user)
            .set({
              balance: (
                parseFloat(prevBidder[0].balance!) + refundAmount
              ).toString(),
              updatedAt: new Date(),
            })
            .where(eq(user.id, previousHighestBid[0].userId));

          await tx.insert(balanceTransactions).values({
            userId: previousHighestBid[0].userId,
            auctionId,
            bidId: previousHighestBid[0].id,
            type: "bid_refund",
            amount: refundAmount.toString(),
            description: `Bid refunded - outbid on auction: ${auctionData.title}`,
          });
        }
      }

      await tx
        .update(auctions)
        .set({
          currentPrice: amount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(auctions.id, auctionId));
    });

    return NextResponse.json({ message: "Bid placed successfully" });
  } catch (error) {
    console.error("Place bid error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
