import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auctions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
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

    const { lock } = (await req.json()) as { lock: boolean };

    await db
      .update(auctions)
      .set({ isLocked: lock, updatedAt: new Date() })
      .where(eq(auctions.id, auctionId));

    return NextResponse.json({ locked: lock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
