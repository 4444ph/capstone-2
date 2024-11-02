import React from "react";

const TypingAnimation: React.FC = () => {
  return (
    <div className="text-gray-500 italic mb-2 flex items-center">
      <span>AI is typing</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <style jsx>{`
        .dot {
          animation: blink 1s infinite;
          margin-left: 2px; /* Space between dots */
          font-size: 1.5em; /* Slightly larger dots */
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        /* Pulsing effect */
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .dot {
          animation: blink 1s infinite, pulse 1.5s infinite; /* Combine animations */
        }
      `}</style>
    </div>
  );
};

export default TypingAnimation;
