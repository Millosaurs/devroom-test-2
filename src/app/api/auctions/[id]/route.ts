import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auctions, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const auctionId = parseInt(id);

    if (isNaN(auctionId)) {
      return NextResponse.json(
        { message: "Invalid auction ID" },
        { status: 400 }
      );
    }

    const auction = await db
      .select({
        id: auctions.id,
        title: auctions.title,
        description: auctions.description,
        startingPrice: auctions.startingPrice,
        currentPrice: auctions.currentPrice,
        closingDate: auctions.closingDate,
        userId: auctions.userId,
        isActive: auctions.isActive,
        createdAt: auctions.createdAt,
        userName: user.name,
      })
      .from(auctions)
      .innerJoin(user, eq(auctions.userId, user.id))
      .where(eq(auctions.id, auctionId))
      .limit(1);

    if (!auction.length) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(auction[0]);
  } catch (error) {
    console.error("Get auction error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
