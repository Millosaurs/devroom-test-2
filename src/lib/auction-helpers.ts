import { db } from "@/db";
import { auctions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function canManageAuction(userId: string, auctionId: number) {
  const au = await db
    .select({ userId: auctions.userId })
    .from(auctions)
    .where(eq(auctions.id, auctionId))
    .limit(1);
  return au.length && au[0].userId === userId;
}
