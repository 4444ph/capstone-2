import React, { useEffect, useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer"; // Import the Markdown component

interface Message {
  sender: string;
  text: string;
}

interface ChatBoxProps {
  messages: Message[];
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-scroll w-full">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.sender !== "Assistant" ? "justify-end" : "justify-start"
          } mb-4`}
        >
          <div
            className={`max-w-lg p-2 rounded-lg text-white ${
              msg.sender === "Assistant" ? "bg-blue-500" : "bg-green-500"
            }`}
          >
            <strong>{msg.sender}</strong>:{" "}
            <MarkdownRenderer content={msg.text} />
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} /> {/* This div is used for scrolling */}
    </div>
  );
};

export default ChatBox;
