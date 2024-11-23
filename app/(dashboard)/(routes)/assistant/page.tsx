"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Send, Trash2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub-flavored markdown

interface Message {
  sender: string;
  text: string;
  timestamp?: Date;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
}

const fetchGeminiResponse = async (
  message: string,
  userId: string,
  sessionId: string
): Promise<string> => {
  try {
    const response = await axios.post("/api/ai/messages", {
      body: message,
      userId,
      sessionId,
    });
    return response.data.output;
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return "Sorry, there was an error communicating with the assistant.";
  }
};

const AssistantPage = () => {
  const { user } = useUser();
  const username = user ? user.firstName || user.username || "User" : "User";
  const userId = user ? user.id : "";
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Fetch all chat sessions for the user
  useEffect(() => {
    const fetchChatSessions = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/ai?userId=${userId}`);

          // Check if response is an array
          if (Array.isArray(response.data)) {
            setSessions(response.data);
            // If there are chat sessions, select the first one
            if (response.data.length > 0 && !currentSessionId) {
              setCurrentSessionId(response.data[0].id);
            }
          } else {
            console.error("Error: Expected an array of chat sessions.");
            setSessions([]);
          }
        } catch (error) {
          console.error("Error fetching chat sessions:", error);
        }
      }
    };
    fetchChatSessions();
  }, [userId]);

  // Fetch messages for current session
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (userId && currentSessionId) {
        try {
          const response = await axios.get(
            `/api/ai/messages?userId=${userId}&sessionId=${currentSessionId}`
          );
          if (Array.isArray(response.data)) {
            const chatMessages = response.data.map((msg: any) => ({
              sender: msg.sender !== "Assistant" ? username : "Assistant",
              text: msg.message,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(chatMessages);
          } else {
            console.error("Error: Expected an array of messages.");
          }
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      }
    };
    fetchChatHistory();
  }, [userId, currentSessionId, username]);

  const startNewChat = async () => {
    if (userId) {
      try {
        const response = await axios.post("/api/ai", { userId, body: "" });
        const newSessionId = response.data.sessionId;
        const newSession: ChatSession = {
          id: newSessionId,
          messages: [],
          createdAt: new Date(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
        setMessages([]);
        setInput("");
      } catch (error) {
        console.error("Error starting new chat:", error);
      }
    }
  };

  const sendMessage = async () => {
    if (input.trim() && currentSessionId) {
      const userMessage: Message = {
        sender: username,
        text: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const assistantReply = await fetchGeminiResponse(
        input,
        userId,
        currentSessionId
      );
      const assistantMessage: Message = {
        sender: "Assistant",
        text: assistantReply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update sessions with new message preview
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage, assistantMessage],
              }
            : session
        )
      );
    }
  };

  const deleteChatHistory = async () => {
    if (!userId || !currentSessionId) return;

    try {
      await axios.delete("/api/ai", { data: { userId, currentSessionId } });
      setSessions((prev) =>
        prev.filter((session) => session.id !== currentSessionId)
      );
      setMessages([]);
      if (sessions.length > 1) {
        setCurrentSessionId(sessions[0].id);
      } else {
        setCurrentSessionId("");
      }
    } catch (error) {
      console.error("Error deleting chat history:", error);
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Sidebar */}
      <Card className="w-64 flex flex-col">
        <CardHeader className="pb-2">
          <Button className="w-full" onClick={startNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {sessions.length === 0 ? (
                <p>No chat sessions available.</p>
              ) : (
                sessions.map((session) => (
                  <Button
                    key={session.id}
                    variant={
                      currentSessionId === session.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => setCurrentSessionId(session.id)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      {session && session.title
                        ? session.title.substring(0, 20)
                        : "No title"}
                      ...
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "Assistant"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.sender === "Assistant"
                        ? "flex-row"
                        : "flex-row-reverse"
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={
                          message.sender === "Assistant"
                            ? "/ai-avatar.png"
                            : user?.imageUrl
                        }
                        alt={message.sender}
                      />
                      <AvatarFallback>
                        {message.sender === "Assistant" ? "AI" : username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === "Assistant"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            rows={1}
            className="flex-grow"
          />
          <Button onClick={sendMessage} disabled={!input.trim()}>
            <Send />
          </Button>
          <Button onClick={deleteChatHistory} variant="destructive">
            <Trash2 />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssistantPage;
