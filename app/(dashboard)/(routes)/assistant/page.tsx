"use client";

import { useState, useEffect, useRef } from "react";
import ChatBox from "./_components/ChatBox";
import TypingAnimation from "./_components/TypingAnimation";
import SendMessageButton from "./_components/SendMessageButton";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface Message {
  sender: string;
  text: string;
}

const fetchGeminiResponse = async (
  message: string,
  userId: string
): Promise<string> => {
  try {
    const response = await axios.post("/api/ai", { body: message, userId });
    return response.data.output;
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return "Sorry, there was an error communicating with the assistant.";
  }
};

const AssistantPage: React.FC = () => {
  const { user } = useUser();
  const username = user ? user.firstName || user.username || "User" : "User";
  const userId = user ? user.id : ""; // Get userId from Clerk

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat history when the component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/ai?userId=${userId}`);
          if (Array.isArray(response.data)) {
            const chatMessages = response.data.map((msg: any) => ({
              sender: msg.sender !== "Assistant" ? username : "Assistant",
              text: msg.message,
            }));
            setMessages(chatMessages);
          }
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      }
    };
    fetchChatHistory();
  }, [userId, username]);

  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage: Message = { sender: username, text: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      const assistantReply = await fetchGeminiResponse(input, userId);
      setMessages((prev) => [
        ...prev,
        { sender: "Assistant", text: assistantReply },
      ]);
      setIsTyping(false);
    }
  };

  // Delete messages
  const deleteChatHistory = async () => {
    if (!userId) return;

    try {
      await axios.delete("/api/ai", { data: { userId } });
      setMessages([]);
    } catch (error) {
      console.error("Error deleting chat history:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Chat Assistant</h1>
      <ChatBox messages={messages} />
      {isTyping && <TypingAnimation />}
      <div className="flex mt-4 w-full justify-center gap-2 items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-1/2 max-h-[100px] min-h-[100px] focus:outline-none focus:border-blue-500"
        />
        <SendMessageButton onClick={sendMessage} />
      </div>
      <button onClick={deleteChatHistory} className="mt-4 text-red-500">
        Delete Chat History
      </button>
    </div>
  );
};

export default AssistantPage;
