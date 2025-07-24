import { notFound } from "next/navigation";
import { db } from "@/db";
import { auctions, user, bids } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BidForm } from "@/components/bid-form";
import { BidHistory } from "@/components/bid-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import type { AuctionOwnerControlsProps } from "@/components/auction-owner-controls";
import AuctionOwnerControlsWrapper from "@/components/auction-owner-controls-wrapper";

interface AuctionPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuctionPage({ params }: AuctionPageProps) {
  const { id } = await params;
  const auctionId = parseInt(id);

  if (isNaN(auctionId)) {
    notFound();
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
      isLocked: auctions.isLocked,
      createdAt: auctions.createdAt,
      userName: user.name,
    })
    .from(auctions)
    .innerJoin(user, eq(auctions.userId, user.id))
    .where(eq(auctions.id, auctionId))
    .limit(1);

  if (!auction.length) {
    notFound();
  }

  const auctionData = auction[0];
  const isExpired = new Date() > new Date(auctionData.closingDate);
  const timeLeft =
    new Date(auctionData.closingDate).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  const auctionBids = await db
    .select({
      id: bids.id,
      amount: bids.amount,
      createdAt: bids.createdAt,
      userName: user.name,
    })
    .from(bids)
    .innerJoin(user, eq(bids.userId, user.id))
    .where(eq(bids.auctionId, auctionId))
    .orderBy(desc(bids.createdAt));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl">{auctionData.title}</CardTitle>
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? "Ended" : `${daysLeft}d left`}
                </Badge>
              </div>
              <AuctionOwnerControlsWrapper
                auctionId={auctionId}
                isLocked={!!auctionData.isLocked}
                isActive={!!auctionData.isActive}
                ownerId={auctionData.userId}
              />
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{auctionData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Starting Price</h3>
                  <p className="text-lg">${auctionData.startingPrice}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Current Bid</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${auctionData.currentPrice}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Listed by</h3>
                  <p>{auctionData.userName}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Closing Date</h3>
                  <p>
                    {new Date(auctionData.closingDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!isExpired && (
                <BidForm
                  auctionId={auctionId}
                  currentPrice={parseFloat(auctionData.currentPrice)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <BidHistory bids={auctionBids} auctionOwnerId={auctionData.userId} />
        </div>
      </div>
    </div>
  );
}
