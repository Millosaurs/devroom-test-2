import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auctions } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description, startingPrice, closingDate } =
      await request.json();

    if (!title || !description || !startingPrice || !closingDate) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const newAuction = await db
      .insert(auctions)
      .values({
        title,
        description,
        startingPrice: startingPrice.toString(),
        currentPrice: startingPrice.toString(),
        closingDate: new Date(closingDate),
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json(newAuction[0]);
  } catch (error) {
    console.error("Create auction error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
