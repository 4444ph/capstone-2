//Chat Session

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create a new chat session for the user
    const chatSession = await db.chatSession.create({
      data: {
        userId,
      },
    });

    return NextResponse.json({ sessionId: chatSession.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch all chat sessions for the user
    const chatSessions = await db.chatSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc", // Order by most recent
      },
    });

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, sessionId } = await req.json();

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "User ID and session ID are required" },
        { status: 400 }
      );
    }

    // Delete messages and the session
    await db.chatMessage.deleteMany({
      where: { sessionId },
    });

    await db.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete chat history" },
      { status: 500 }
    );
  }
}
