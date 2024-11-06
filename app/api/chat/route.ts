import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await req.json(); // Get userId from the request

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { timestamp: "asc" }, // Order by timestamp
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
