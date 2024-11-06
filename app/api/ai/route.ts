import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db"; // Ensure your db instance is correctly set up

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
  You are a friendly and supportive virtual assistant focused solely on basketball topics. 
  Respond to questions about basketball in a conversational and relatable manner. 
  Avoid discussing non-basketball subjects, and refrain from technical jargon. 
  Provide clear and simple explanations, encouraging curiosity and learning about basketball. 
  Always maintain a polite and respectful tone, ensuring users feel comfortable asking basketball-related questions.
  For more information about basketball rules, visit: https://www.ducksters.com/sports/basketballrules.php
`,
    });

    const data = await req.json();
    const userId = data.userId;
    const userMessage = data.body;

    // Initialize chat history if it doesn't exist
    const existingMessages = await db.chatMessage.findMany({
      where: { userId },
    });

    // Initialize chat history array
    const chatHistory: any = [];

    // Add existing messages to chat history in the required format
    existingMessages.forEach((msg) => {
      chatHistory.push({
        role: msg.sender === userId ? "user" : "model",
        parts: [{ text: msg.message }],
      });
    });

    // Push the user's message
    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Generate the response using the updated chat history
    const chatSession = model.startChat({
      history: chatHistory,
    });

    // Send the user's message and get the response
    const result = await chatSession.sendMessage(userMessage);
    const output = result.response.text();

    // Store user message and assistant response in the database
    await db.chatMessage.create({
      data: {
        userId,
        sender: userId,
        message: userMessage,
      },
    });

    await db.chatMessage.create({
      data: {
        userId,
        sender: "Assistant",
        message: output,
      },
    });

    // Push assistant's response to chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: output }],
    });

    return NextResponse.json({ output });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Retrieve messages
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { timestamp: "asc" },
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

// Delete messages

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Delete all chat messages for the user
    await db.chatMessage.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ message: "Chat history deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete chat history" },
      { status: 500 }
    );
  }
}
