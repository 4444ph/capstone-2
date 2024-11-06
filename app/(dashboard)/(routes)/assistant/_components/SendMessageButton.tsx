import React from 'react';

interface SendMessageButtonProps {
    onClick: () => void;
}

const SendMessageButton: React.FC<SendMessageButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
            Send
        </button>
    );
};

export default SendMessageButton;
