import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auctions, bids, user, balanceTransactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";
import { canManageAuction } from "@/lib/auction-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id);
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!(await canManageAuction(session.user.id, auctionId)))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const auctionArr = await db
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .limit(1);

    if (!auctionArr.length || !auctionArr[0].isActive)
      return NextResponse.json(
        { message: "Auction already ended" },
        { status: 400 }
      );

    const topBid = await db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amount))
      .limit(1);

    await db.transaction(async (tx) => {
      if (topBid.length) {
        const win = topBid[0];
        const seller = auctionArr[0].userId;
        const amount = parseFloat(win.amount);

        await tx
          .update(user)
          .set({
            balance: sql`${user.balance} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(user.id, seller));

        await tx.insert(balanceTransactions).values({
          userId: seller,
          auctionId,
          bidId: win.id,
          type: "auction_win_credit",
          amount: amount.toString(),
          description: `Received payment for auction "${auctionArr[0].title}"`,
        });
      }

      await tx
        .update(auctions)
        .set({
          isActive: false,
          isLocked: true,
          endedManually: true,
          updatedAt: new Date(),
        })
        .where(eq(auctions.id, auctionId));
    });

    return NextResponse.json({ ended: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
