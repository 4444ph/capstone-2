import React from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const getMarkdown = () => {
    return { __html: marked(content) };
  };

  return <div dangerouslySetInnerHTML={getMarkdown()} />;
};

export default MarkdownRenderer;
