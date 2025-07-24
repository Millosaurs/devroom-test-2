import { db } from "@/db";
import { auctions, user, bids } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AuctionCard } from "@/components/auction-card";

export default async function HomePage() {
  const activeAuctions = await db
    .select({
      id: auctions.id,
      title: auctions.title,
      description: auctions.description,
      startingPrice: auctions.startingPrice,
      currentPrice: auctions.currentPrice,
      closingDate: auctions.closingDate,
      createdAt: auctions.createdAt,
      userName: user.name,
    })
    .from(auctions)
    .innerJoin(user, eq(auctions.userId, user.id))
    .where(eq(auctions.isActive, true))
    .orderBy(desc(auctions.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Active Auctions
        </h1>
        <p className="text-gray-600">
          Browse and bid on amazing items from our community
        </p>
      </div>

      {activeAuctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
