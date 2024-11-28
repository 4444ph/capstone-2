"use client";

import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";

import { Send, Trash2, Plus, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Chat {
  id: string;
  title: string;
}

const AssistantPage: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const username = user ? user.firstName || user.username || "User" : "User";
  const userId = user ? user.id : "";

  const [showWelcome, setShowWelcome] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
  } = useChat({
    api: "/api/ai",
    body: { userId, chatId: currentChatId },
    onResponse: (response) => {
      setShowWelcome(false);
      // Parse the response and update the messages state
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        const readChunk = async () => {
          const { done, value } = await reader.read();
          if (done) return;
          const chunk = decoder.decode(value);
          try {
            const parsedChunk = JSON.parse(chunk);
            if (parsedChunk.output) {
              setMessages((prevMessages) => [
                ...prevMessages,
                { id: Date.now().toString(), role: "assistant", content: parsedChunk.output },
              ]);
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
          await readChunk();
        };
        readChunk();
      }
    },
    onFinish: () => {
      router.refresh();
    },
  });

  useEffect(() => {
    const fetchChats = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/chat?userId=${userId}`);
          if (Array.isArray(response.data)) {
            setChats(response.data);
            if (response.data.length > 0 && !currentChatId) {
              setCurrentChatId(response.data[0].id);
            }
          }
          setError(null);
        } catch (error) {
          console.error("Error fetching chats:", error);
          setError("Failed to fetch chats. Please try again later.");
          setChats([]);
        }
      }
    };
    fetchChats();
  }, [userId, currentChatId]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (currentChatId) {
        try {
          const response = await axios.get(`/api/ai?chatId=${currentChatId}`);
          if (Array.isArray(response.data)) {
            const chatMessages = response.data.map((msg: any) => ({
              id: msg.id.toString(),
              role:
                msg.sender === "Assistant"
                  ? ("assistant" as "assistant")
                  : ("user" as "user"),
              content: msg.message,
            }));
            setMessages(chatMessages);
            setShowWelcome(chatMessages.length === 0);
          }
          setError(null);
        } catch (error) {
          console.error("Error fetching chat history:", error);
          setError("Failed to fetch chat history. Please try again later.");
        }
      }
    };
    fetchChatHistory();
  }, [currentChatId, setMessages]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    try {
      const response = await axios.post("/api/chat", { userId });
      const newChat = response.data;
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
      setMessages([]);
      setShowWelcome(true);
      setError(null);
    } catch (error) {
      console.error("Error creating new chat:", error);
      setError("Failed to create a new chat. Please try again later.");
    }
  };

  const deleteChat = async () => {
    if (!currentChatId) return;
  
    try {
      await axios.delete(`/api/chat`, {
        data: { chatId: currentChatId }
      });
      setChats(chats.filter((chat) => chat.id !== currentChatId));
      if (chats.length > 1) {
        setCurrentChatId(
          chats[0].id === currentChatId ? chats[1].id : chats[0].id
        );
      } else {
        setCurrentChatId(null);
        setMessages([]);
        setShowWelcome(true);
      }
      router.refresh();
      setError(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      setError("Failed to delete chat. Please try again later.");
    }
  };
  

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentChatId) {
      await createNewChat();
    }
    await handleSubmit(e);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 p-4 overflow-y-auto transition-transform duration-300 ease-in-out transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0" // Always visible on larger screens
        )}
      >
        <Button
          onClick={createNewChat}
          className="w-full mb-4 bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "p-2 rounded cursor-pointer",
              currentChatId === chat.id ? "bg-blue-100" : "hover:bg-gray-200"
            )}
            onClick={() => {
              setCurrentChatId(chat.id);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
          >
            {chat.title}
          </div>
        ))}
      </div>

      {/* Toggle Sidebar Button */}
      <Button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="md:hidden fixed top-5 left-12 z-50 flex flex-col justify-between items-center w-10 h-10 text-white p-2 rounded"
>
  {sidebarOpen ? (
    <X className="h-6 w-6" />
  ) : (
    <>
      <span className="block w-6 h-0.5 bg-white"></span>
      <span className="block w-6 h-0.5 bg-white"></span>
      <span className="block w-6 h-0.5 bg-white"></span>
    </>
  )}
</Button>


      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col md:ml-30"> {/* Adjusted for sidebar */}
        <div className="flex-grow overflow-hidden relative">
          {showWelcome && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold text-sky-700">
                Hi, I am Robert your Virtual Coaching Assistant
              </div>
            </div>
          )}
          <ScrollArea className="h-full px-4">
            <div className="max-w-3xl mx-auto space-y-8 py-8">
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start space-x-3 max-w-[80%]",
                      message.role === "assistant"
                        ? "flex-row"
                        : "flex-row-reverse space-x-reverse"
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={
                          message.role === "assistant"
                            ? "/ai-avatar.png"
                            : user?.imageUrl
                        }
                        alt={message.role}
                      />
                      <AvatarFallback>
                        {message.role === "assistant" ? "AI" : username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        message.role === "assistant"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-green-100 text-green-900"
                      )}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-blue max-w-none"
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-100 rounded-2xl px-4 py-2">
                    <span className="text-blue-900">...Thinking</span>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </ScrollArea>
        </div>
        {/* Input Form */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full p-4 bg-white shadow-md"
        >
          <div className="flex items-center space-x-4">
            <Input
              className="w-full"
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
            />
            <Button
              type="submit"
              className="bg-blue-500 text-white hover:bg-blue-600"
              disabled={isLoading || !input}
            >
              <Send className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={deleteChat}
              disabled={!currentChatId}
              className="bg-red-500 text-white hover:bg-red-600 h-10 w-14"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssistantPage;

