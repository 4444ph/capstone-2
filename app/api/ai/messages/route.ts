//Chat History of Session

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetch messages for a given user and session
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "User ID and session ID are required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the correct user
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.userId !== userId) {
      return NextResponse.json(
        { error: "Invalid session for the given user" },
        { status: 403 }
      );
    }

    // Fetch messages for the given session
    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" }, // Use `createdAt` instead of `timestamp`
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

// Post a new message for the given session
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
    const { userId, body, sessionId } = data;

    if (!userId || !sessionId || !body) {
      return NextResponse.json(
        { error: "User ID, session ID, and message body are required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the correct user
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.userId !== userId) {
      return NextResponse.json(
        { error: "Invalid session for the given user" },
        { status: 403 }
      );
    }

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
      parts: [{ text: body }],
    });

    // Generate the response using the updated chat history
    const chatSessions = model.startChat({
      history: chatHistory,
    });

    // Send the user's message and get the response
    const result = await chatSessions.sendMessage(body);
    const output = result.response.text();

    // Store user message and assistant response in the database
    await db.chatMessage.create({
      data: {
        userId,
        sender: userId,
        message: body,
        sessionId,
      },
    });

    await db.chatMessage.create({
      data: {
        userId,
        sender: "Assistant",
        message: output,
        sessionId,
      },
    });

    // Push assistant's response to chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: output }],
    });

    // Generate a title for the session
    if (!chatSession.title) {
      const titlePrompt = `Generate a brief and descriptive title for a chat about basketball. Here's a summary of the conversation: ${existingMessages
        .slice(0, 3)
        .map((msg) => msg.message)
        .join(", ")}`;

      const titleResult = await chatSessions.sendMessage(titlePrompt);
      const generatedTitle = titleResult.response.text();

      // Update the session with the generated title
      await db.chatSession.update({
        where: { id: sessionId },
        data: { title: generatedTitle },
      });
    }

    return NextResponse.json({ output });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
