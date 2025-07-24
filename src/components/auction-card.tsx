import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuctionCardProps {
  auction: {
    id: number;
    title: string;
    description: string;
    startingPrice: string;
    currentPrice: string;
    closingDate: Date;
    createdAt: Date | null;
    userName: string;
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const isExpired = new Date() > new Date(auction.closingDate);
  const timeLeft =
    new Date(auction.closingDate).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">
            {auction.title}
          </CardTitle>
          <Badge variant={isExpired ? "destructive" : "default"}>
            {isExpired ? "Ended" : `${daysLeft}d left`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {auction.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Starting Price:</span>
            <span className="font-medium">${auction.startingPrice}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Current Bid:</span>
            <span className="font-bold text-green-600">
              ${auction.currentPrice}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Listed by:</span>
            <span className="text-sm">{auction.userName}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/auction/${auction.id}`} className="w-full">
          <Button className="w-full" disabled={isExpired}>
            {isExpired ? "Auction Ended" : "View & Bid"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
